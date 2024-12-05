import { MarvelClient } from './marvel-service.mjs'

const verifyApiKeyHashTimetamp = (url: URL): boolean => {
  url.searchParams.sort()
  const keys = Array.from(url.searchParams.entries())
    .filter(([_, value]) => value && value.length > 0)
    .map(([key]) => key)

  return keys.join('-') === 'apikey-hash-ts'
}

const getMockedFetch = <T extends any>(
  handler: (url: URL) => Promise<T | void> = () => Promise.resolve()
): jest.Mock =>
  jest.fn((input) => {
    const url = new URL(input)
    if (verifyApiKeyHashTimetamp(url)) {
      return handler(url)
    } else {
      console.log('verified required fields failed')
      return Promise.resolve({
        ok: false,
        status: 401,
        text: async () =>
          Promise.resolve(
            'Missing one or more required fields: hash, api key and timestamp'
          ),
      })
    }
  })

describe('Marvel Service', () => {
  describe('Check the required fields retrieve comic data', () => {
    const globalFetch = global.fetch

    beforeAll(() => {
      global.fetch = getMockedFetch()
    })

    afterAll(() => {
      global.fetch = globalFetch
    })

    it('Missing required fields', async () => {
      const marvelClient = new MarvelClient({
        publicKey: '',
        privateKey: 'private_key',
      })

      expect(marvelClient.getComicCharacters()).rejects.toThrow(
        'Error with status (401) in retrieving data: Missing one or more required fields: hash, api key and timestamp'
      )
    })
  })

  describe('Call API to get comic data', () => {
    const globalFetch = global.fetch
    const marvelClient = new MarvelClient({
      publicKey: 'public_key',
      privateKey: 'private_key',
    })

    beforeAll(() => {
      global.fetch = getMockedFetch(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () =>
            Promise.resolve({
              code: 200,
              status: 'Ok',
              copyright: '© 2024 MARVEL',
              attributionText: 'Data provided by Marvel. © 2024 MARVEL',
              attributionHTML:
                '<a href="http://marvel.com">Data provided by Marvel. © 2024 MARVEL</a>',
              etag: 'e6414f6e209f93d3c6c193ba2c6a12cf49d7dfc9',
              data: {
                offset: 0,
                limit: 20,
                total: 1564,
                count: 20,
                results: [],
              },
            }),
        })
      })
    })

    afterAll(() => {
      global.fetch = globalFetch
    })

    it(`Get comic data without any criteria`, async () => {
      const data = await marvelClient.getComicCharacters()
    })
  })
})
