import express from 'express'
import parameters from '../parameters.json'
import Sequelize from 'sequelize'
import FeedModelBuilder, { lengths } from './FeedModel'
import axios from 'axios'
import cheerio from 'cheerio'
import morgan from 'morgan'
import { truncate } from './strings'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const { port, database, username, password, host, dialect } = parameters

const sequelize = new Sequelize(database, username, password, {
    host,
    dialect,
})

sequelize
    .authenticate()
    .then(() => {
        console.log(
            `Connection to '${database}' on '${host}' by '${username}' has been established successfully`
        )
    })
    .catch((err) => {
        console.error(
            `Unable to connect to '${database}' on '${host}' by '${username}'`,
            err
        )
        throw err
    })
    .then(() => {
        const { findByName, list, insert, remove } = FeedModelBuilder(sequelize)

        const app = express()
        app.set('view engine', 'ejs')
        app.set('views', 'src/views')

        app.use(
            morgan(
                ':method :url :status :res[content-length] - :response-time ms'
            )
        )

        app.use(
            '/static',
            express.static(__dirname + '/static', { index: false })
        )

        app.get('/', (req, res) => {
            const name = truncate(req.query.name || req.query.n, lengths.name)
            const limit =
                Math.abs(parseInt(req.query.limit || req.query.l, 10)) || 25
            if (name) {
                return findByName({ name, limit }).then((entries) => {
                    res.type('text/xml')
                    return res.render('rss', { name, entries })
                })
            }
            return res.render('index')
        })
        app.get('/list', (req, res) => {
            return list().then((feeds) => {
                console.log(feeds[0].name, feeds[0].dataValues)
                return res.render('list', { feeds })
            })
        })

        app.get('/add', (req, res) => {
            const name = truncate(req.query.name || req.query.n, lengths.name)
            const url = truncate(req.query.url || req.query.u, lengths.url)
            const title = truncate(
                req.query.title || req.query.t,
                lengths.title
            )
            const description = truncate(
                req.query.description || req.query.d,
                lengths.description
            )

            if (!name || !url) {
                return res.status(404).end('404 : Missing name or url')
            }
            return (title && description
                ? Promise.resolve({ title, description })
                : Promise.resolve().then(() =>
                      axios
                          .get(url)
                          .then(function (response = {}) {
                              const { status, data } = response
                              if (status === 200) {
                                  const $ = cheerio.load(data, {
                                      normalizeWhitespace: true,
                                      xmlMode: false,
                                      decodeEntities: true,
                                  })
                                  return {
                                      title: truncate(
                                          $('head title').text(),
                                          lengths.title
                                      ),
                                      description: truncate(
                                          $('head meta[name=description]').attr(
                                              'content'
                                          ),
                                          lengths.description
                                      ),
                                  }
                              }
                          })
                          .catch(function (error) {
                              console.log(error)
                          })
                  )
            )
                .then((metas = {}) => {
                    const { title, description } = metas
                    return insert({ name, url, title, description })
                })
                .then(() => res.redirect(302, `/?n=${name}`))
                .catch((err) => {
                    const msg = `Error while inserting '${url}' in '${name}'`
                    console.error(msg, err)
                    res.sendStatus(500).end(msg)
                })
        })

        app.get('/del', (req, res) => {
            const name = truncate(req.query.name || req.query.n, lengths.name)
            const url = truncate(req.query.url || req.query.u, lengths.url)
            if (!name || !url) {
                return res.status(404).end('404 : Missing name or url')
            }
            return remove({ name, url })
                .then(() => res.redirect(302, `/?n=${name}`))
                .catch((err) => {
                    const msg = `Error while removing '${url}' in '${name}'`
                    console.error(msg, err)
                    res.sendStatus(500).end(msg)
                })
        })

        app.listen(port, () =>
            console.log(
                `rsstodolist-node-server listening at http://localhost:${port}`
            )
        )
    })