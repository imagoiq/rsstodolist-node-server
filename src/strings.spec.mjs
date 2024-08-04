import { trim, truncate, slugify, cleanify, sanitize, isValidUrl } from './strings.mjs'

describe('strings', () => {
    describe('trim', () => {
        test('should trim string', () => expect(trim(' abcdef  ')).toBe('abcdef'))
        test('should handle empty string', () => expect(trim(undefined)).toBe(''))
    })
    describe('truncate', () => {
        test('should truncate', () => expect(truncate('abcdef', 3)).toBe('abc'))
        test('should not truncate if shorter', () => expect(truncate('abc', 10)).toBe('abc'))
        test('should handle other type than string', () => expect(truncate(5, 10)).toBe('5'))
        test('should handle undefined', () => expect(truncate(undefined, 5)).toBe(''))
    })
    describe('slugify', () => {
        test('should do nothing if name is well formated', () => expect(slugify('abcdef')).toBe('abcdef'))
        test('should accept numbers', () => expect(slugify('abc123')).toBe('abc123'))
        test('should lower case', () => expect(slugify('AbC')).toBe('abc'))
        test('should remove space', () => expect(slugify(' a b c ')).toBe('abc'))
        test('should remove accents', () => expect(slugify('-áéó-')).toBe('--'))
        test('should remove unicode char', () => expect(slugify('--™-')).toBe('---'))
        test('should handle other type than string', () => expect(slugify(5)).toBe('5'))
        test('should handle undefined', () => expect(slugify(undefined)).toBe(''))
    })
    describe('cleanify', () => {
        test('should remove emoji', () =>
            expect(cleanify('Firefox OS 🦊🚀 - LinuxFr.org')).toBe('Firefox OS  - LinuxFr.org'))

        test('should remove more emoji', () =>
            expect(cleanify('Git files hidden in plain sight 🫥 - Tyler Cipriani')).toBe(
                'Git files hidden in plain sight  - Tyler Cipriani'
            ))

        test('should remove unicode char', () => expect(cleanify('--™-')).toBe('---'))

        test('should remove « lead surrogate »', () => expect(cleanify('|𝚟𝚎𝚛𝚖𝚊𝚍𝚎𝚗|')).toBe('||'))
    })

    describe('sanitize', () => {
        test('should remove %', () => expect(sanitize('test%')).toBe('test'))
        test('should remove multiple %', () => expect(sanitize('%test%')).toBe('test'))
        test('should remove \\%', () => expect(sanitize('\\%test')).toBe('test'))
        test('should remove "\' or 1=1', () => expect(sanitize('"\'or 1=1')).toBe('or 1=1'))
        test('should remove "\'', () => expect(sanitize('"')).toBe(''))
    })
    describe('isValidUrl', () => {
        describe('all URL', () => {
            test('should return true for valid http url', () => expect(isValidUrl('http://something.com')).toBe(true))
            test('should return true for valid https url', () => expect(isValidUrl('https://something.com')).toBe(true))
            test('should return false for not an url', () => expect(isValidUrl('something.com')).toBe(false))
        })
        describe('only wikipedia', () => {
            test('should return true for wikipedia FR url', () =>
                expect(isValidUrl('https://fr.wikipedia.org/wiki/Wikip%C3%A9dia:Accueil_principal', true)).toBe(true))
            test('should return false for standard url', () =>
                expect(isValidUrl('http://something.com', true)).toBe(false))
        })
    })
})
