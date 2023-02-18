import Sequelize from 'sequelize'

const Op = Sequelize.Op

export const id = 'id'
export const name = 'name'
export const url = 'url'
export const title = 'title'
export const description = 'description'

export const lengths = {
    [name]: 20,
    [url]: 512,
    [title]: 255,
    [description]: 1024,
}

const FeedModelBuilder = (sequelize) => {
    const FeedModel = sequelize.define(
        'feeds_feedentry',
        {
            [id]: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            [name]: {
                type: Sequelize.STRING(lengths[name]),
                allowNull: false,
            },
            [url]: {
                type: Sequelize.STRING(lengths[url]),
                allowNull: false,
            },
            [title]: {
                type: Sequelize.STRING(lengths[title]),
                allowNull: false,
            },
            [description]: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
        },
        {
            freezeTableName: true,
        }
    )

    const findByName = ({ name, limit }) =>
        FeedModel.findAll({
            limit: Math.min(limit || 25, 500),
            where: {
                name,
            },
            order: [
                ['updatedAt', 'DESC'],
                ['createdAt', 'DESC'],
            ],
        })

    const insert = ({ name, url, title, description }) =>
        FeedModel.findOne({
            where: { name, url },
        }).then((result) =>
            FeedModel.upsert({
                id: (result && result.id) || undefined,
                name,
                url,
                title,
                description,
            })
        )

    const remove = ({ name, url }) =>
        FeedModel.findOne({
            where: { name, url },
        }).then((m) => m && m.destroy())

    const list = () =>
        FeedModel.findAll({
            group: ['name'],
            attributes: ['name', [sequelize.fn('COUNT', 'name'), 'count']],
            order: [['name', 'ASC']],
        })

    const count = ({ name }) =>
        FeedModel.findAll({
            where: { name },
            attributes: [[sequelize.fn('COUNT', 'name'), 'count']],
        })

    const search = ({ query, limit }) =>
        FeedModel.findAll({
            limit: Math.min(limit || 100, 500),
            where: {
                [Op.or]: [
                    {
                        title: {
                            [Op.like]: `%${query}%`,
                        },
                    },
                    {
                        title: {
                            [Op.like]: `%${query}%`,
                        },
                    },
                    {
                        description: {
                            [Op.like]: `%${query}%`,
                        },
                    },
                ],
            },
            order: [
                ['updatedAt', 'DESC'],
                ['createdAt', 'DESC'],
            ],
        })

    return { FeedModel, findByName, insert, remove, list, count, search }
}

export default FeedModelBuilder
