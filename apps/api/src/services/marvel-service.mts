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
        comics: z.object({
          available: z.number().nonnegative(),
          collectionURI: z.string().url(),
        }),
      })
      .array(),
  }),
})
type MarvelPublicCharactersResponseType = z.infer<
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
  retriever = async () => {
    const response = await fetch(
      composeUrl({
        publicKey: this._publicKey,
        privateKey: this._privateKey,
        path: '/v1/public/characters',
      })
    )
    if (!response.ok) {
      const statusCode = response.status
      const text = await response.text()
      throw new Error(`Error in retrieving data: ${text}`)
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
