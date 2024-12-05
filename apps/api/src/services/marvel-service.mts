import crypto from 'crypto'
import * as z from 'zod'

const BASE_URL = `https://gateway.marvel.com`
const composeUrl = ({
  publicKey,
  privateKey,
  path,
}: {
  publicKey: string
  privateKey: string
  path?: string
}): string => {
  const ts = new Date().getTime()
  const hash = crypto
    .createHash('md5')
    .update(`${ts}${privateKey}${publicKey}`)
    .digest('hex')
  return `${BASE_URL}${path ?? ''}?apikey=${publicKey}&ts=${ts}&hash=${hash}`
}

const getListSchema = <ItemType extends z.ZodTypeAny>(itemSchema: ItemType) =>
  z.object({
    available: z.coerce.number().int().optional(),
    returned: z.coerce.number().int().optional(),
    collectionURI: z.string().url().optional(),
    items: z.array(itemSchema),
  })

const ComicsSummarySchema = z.object({
  resourceURI: z.string().url().optional(),
  name: z.string().optional(),
})

const StorySummarySchema = z.object({
  resourceURI: z.string().url().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
})

const EventSummarySchema = z.object({
  resourceURI: z.string().url().optional(),
  name: z.string().optional(),
})

const SeriesSummarySchema = z.object({
  reourceURI: z.string().url().optional(),
  name: z.string().optional(),
})

const MarvelPublicCharactersResponseSchema = z.object({
  code: z.number().nonnegative(),
  status: z.string().min(1),
  copyright: z.string().min(1),
  attributionText: z.string().min(1),
  attributionHTML: z.string().min(1),
  etag: z.string().min(1),
  data: z.object({
    offset: z.number().nonnegative(),
    limit: z.number().nonnegative(),
    total: z.number().nonnegative(),
    count: z.number().nonnegative(),
    results: z
      .object({
        id: z.number().nonnegative(),
        name: z.string().min(1),
        description: z.string().min(0),
        thumbnail: z.object({
          path: z.string().url(),
          extension: z.string(),
        }),
        resourceURI: z.string().url(),
        comics: getListSchema(ComicsSummarySchema),
        stories: getListSchema(StorySummarySchema),
        events: getListSchema(EventSummarySchema),
        series: getListSchema(SeriesSummarySchema),
        urls: z
          .object({
            type: z.string().optional(),
            url: z.string().url().optional(),
          })
          .array(),
      })
      .array(),
  }),
})

export type MarvelPublicCharactersResponseType = z.infer<
  typeof MarvelPublicCharactersResponseSchema
>
export class MarvelClient {
  _privateKey: string
  _publicKey: string
  constructor({
    publicKey,
    privateKey,
  }: {
    publicKey: string
    privateKey: string
  }) {
    this._publicKey = publicKey
    this._privateKey = privateKey
  }
  getComicCharacters = async () => {
    const response = await fetch(
      composeUrl({
        publicKey: this._publicKey,
        privateKey: this._privateKey,
        path: '/v1/public/characters',
      })
    )
    if (!response.ok) {
      const status = response.status
      const text = await response.text()
      throw new Error(
        `Error with status (${status}) in retrieving data: ${text}`
      )
    }
    const json = await response.json()
    console.log('%o', json)
    const parsed = MarvelPublicCharactersResponseSchema.safeParse(json)
    if (!parsed.success) {
      const errors = parsed.error.errors.map(
        (error) => `${error.code}: ${error.message} (${error.path})`
      )
      console.log(
        `Error in parsing the response from the API call: ${errors.join('\n')}`
      )
    }
  }
}
