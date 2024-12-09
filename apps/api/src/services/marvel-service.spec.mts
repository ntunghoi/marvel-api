import { MarvelClient } from './marvel-service.mjs'

const REQUIRED_FIELDS = new Set(['apikey', 'hash', 'ts'])

const verifyApiKeyHashTimetamp = (url: URL): boolean => {
  url.searchParams.sort()
  const keys = Array.from(url.searchParams.entries())
    .filter(
      ([key, value]) => value && value.length > 0 && REQUIRED_FIELDS.has(key)
    )
    .map(([key]) => key)
    .sort()

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
  const getMarvelClient = (
    publicKey: string = 'public_key',
    privateKey: string = 'priate_key'
  ) =>
    new MarvelClient({
      publicKey,
      privateKey,
    })

  const response = {
    ok_1_101134: {
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
            results: [
              {
                id: 101134,
                name: '3-D Man',
                description: '',
                modified: '2024-04-29T14:10:17-0400',
                thumbnail: {
                  path: 'http://i.annihil.us/u/prod/marvel/i/mg/c/e0/535fecbbb9784',
                  extension: 'jpg',
                },
                resourceURI:
                  'http://gateway.marvel.com/v1/public/characters/1011334',
                comics: {
                  available: 0,
                  collectionURI:
                    'http://gateway.marvel.com/v1/public/characters/1011334/comics',
                  items: [],
                  returned: 0,
                },
                series: {
                  available: 0,
                  collectionURI:
                    'http://gateway.marvel.com/v1/public/characters/1011334/series',
                  items: [],
                  returned: 0,
                },
                stories: {
                  available: 21,
                  collectionURI:
                    'http://gateway.marvel.com/v1/public/characters/1011334/stories',
                  items: [],
                  returned: 0,
                },
                events: {
                  available: 1,
                  collectionURI:
                    'http://gateway.marvel.com/v1/public/characters/1011334/events',
                  items: [],
                  returned: 0,
                },
                urls: [
                  {
                    type: 'detail',
                    url: 'http://marvel.com/characters/74/3-d_man?utm_campaign=apiRef&utm_source=8ce48126cbff429d29e7c78456fd075a',
                  },
                  {
                    type: 'wiki',
                    url: 'http://marvel.com/universe/3-D_Man_(Chandler)?utm_campaign=apiRef&utm_source=8ce48126cbff429d29e7c78456fd075a',
                  },
                  {
                    type: 'comiclink',
                    url: 'http://marvel.com/comics/characters/1011334/3-d_man?utm_campaign=apiRef&utm_source=8ce48126cbff429d29e7c78456fd075a',
                  },
                ],
              },
            ],
          },
        }),
    },
  }

  describe('Check the required fields retrieve comic data', () => {
    const globalFetch = global.fetch

    beforeAll(() => {
      global.fetch = getMockedFetch()
    })

    afterAll(() => {
      global.fetch = globalFetch
    })

    it('Missing required fields', async () => {
      const marvelClient = getMarvelClient('')

      expect(marvelClient.getComicCharacters({})).rejects.toThrow(
        'Error with status (401) in retrieving data: Missing one or more required fields: hash, api key and timestamp'
      )
    })
  })

  describe('Call API to get comic data with criteria', () => {
    const globalFetch = global.fetch
    const marvelClient = getMarvelClient()
    const name = 'character name'
    const limit = 10
    const offset = 43

    beforeAll(() => {
      global.fetch = getMockedFetch((url: URL) => {
        expect(url.searchParams.get('name')).toBe(name)
        expect(url.searchParams.get('limit')).toBe(limit.toString())
        expect(url.searchParams.get('offset')).toBe(offset.toString())
        return Promise.resolve(response.ok_1_101134)
      })
    })

    afterAll(() => {
      global.fetch = globalFetch
    })

    it('Specify limit and offset in the search criteria', async () => {
      const marvelClient = getMarvelClient()

      marvelClient.getComicCharacters({
        limit,
        offset,
        name,
      })
    })
  })

  describe('Call API to get comic data with criteria', () => {
    const globalFetch = global.fetch
    const marvelClient = getMarvelClient()

    beforeAll(() => {
      global.fetch = getMockedFetch(() => Promise.resolve(response.ok_1_101134))
    })

    afterAll(() => {
      global.fetch = globalFetch
    })

    it(`Verify response code and status`, async () => {
      const data = await marvelClient.getComicCharacters({})
      expect(data.code).toBe(200)
      expect(data.status).toBe('Ok')
    })
  })
})
