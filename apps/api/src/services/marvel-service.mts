import crypto from 'crypto'
import { URLSearchParams } from 'url'
import * as z from 'zod'
import dayjs from 'dayjs'
import { GetComicCharactersResponse } from '../protos/gen/services/marvel/v1/GetComicCharactersResponse.mjs'

const BASE_URL = `https://gateway.marvel.com`
const composeUrl = ({
  publicKey,
  privateKey,
  path,
  setQueryString,
}: {
  publicKey: string
  privateKey: string
  path?: string
  setQueryString?: (searchParams: URLSearchParams) => void
}): string => {
  const ts = new Date().getTime()
  const hash = crypto
    .createHash('md5')
    .update(`${ts}${privateKey}${publicKey}`)
    .digest('hex')

  const url = new URL(`${BASE_URL}${path ?? ''}`)
  url.searchParams.set('apikey', publicKey)
  url.searchParams.set('ts', ts.toString())
  url.searchParams.set('hash', hash)

  if (setQueryString !== null && setQueryString !== undefined) {
    setQueryString(url.searchParams)
  }

  return url.toString()
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
  resourceURI: z.string().url().optional(),
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
        modified: z
          .string()
          .min(1)
          .transform((rawValue) => dayjs(rawValue, 'YYYY-MM-DDTHH:MM:SSZZ')),
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

const GetComicCharactersParamsSchema = z.object({
  name: z.string().optional(),
  nameStartsWith: z.string().optional(),
  modifiedSince: z.date().optional(),
  comics: z.string().array().optional(),
  series: z.string().array().optional(),
  events: z.string().array().optional(),
  stories: z.string().array().optional(),
  orderBy: z.enum(['name', 'modified', '-name', '-modified']).optional(),
  limit: z.coerce.number().int().min(1).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
})

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
  getComicCharacters = async (
    params?: z.infer<typeof GetComicCharactersParamsSchema>
  ): Promise<z.infer<typeof MarvelPublicCharactersResponseSchema>> => {
    const url = composeUrl({
      publicKey: this._publicKey,
      privateKey: this._privateKey,
      path: '/v1/public/characters',
      setQueryString: (searchParams: URLSearchParams) => {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'modifiedSince') {
              searchParams.set(key, dayjs(value as Date).format('YYYY-MM-DD'))
            } else if (typeof value === 'string') {
              searchParams.set(key, value)
            } else if (typeof value === 'number' && value > 0) {
              searchParams.set(key, value.toString())
            } else if (Array.isArray(value)) {
              value.forEach((token) => {
                searchParams.set(key, token.toString())
              })
            }
          }
        })
      },
    })
    const response = await fetch(url)
    if (!response.ok) {
      const status = response.status
      const text = await response.text()
      throw new Error(
        `Error with status (${status}) in retrieving data: ${text}`
      )
    }
    const json = await response.json()
    const parsed = MarvelPublicCharactersResponseSchema.safeParse(json)
    if (!parsed.success) {
      const errors = parsed.error.errors.map(
        (error) => `${error.code}: ${error.message} (${error.path})`
      )
      console.log(
        `Error in parsing the response from the API call: ${errors.join('\n')}`
      )
    }

    console.log('%s', JSON.stringify(parsed.data, null, 2))
    console.log(url.toString())
    return parsed.data
  }
}
