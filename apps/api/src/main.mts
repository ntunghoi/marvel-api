import dotenv from 'dotenv'
import { Env } from '@humanwhocodes/env'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'
import { MarvelClient } from './services/marvel-service.mjs'

dayjs.extend(utc)
dayjs.extend(timezone)

dotenv.config()
const env = new Env()
type Config = {
  marvel: {
    privateKey: string
    publicKey: string
  }
}
const loadConfig = (): Config => {
  try {
    const marvelPrivateKey = env.require('MARVEL_PRIVATE_KEY')
    const marvelPublicKey = env.require('MARVEL_PUBLIC_KEY')
    return {
      marvel: {
        privateKey: marvelPrivateKey,
        publicKey: marvelPublicKey,
      },
    }
  } catch (error) {
    throw new Error(`Error in loading configuration: ${error}`)
  }
}
const main = async () => {
  try {
    const config = loadConfig()
    const marvelClient = new MarvelClient({
      publicKey: config.marvel.publicKey,
      privateKey: config.marvel.privateKey,
    })
    await marvelClient.getComicCharacters({
      name: 'X-Men (Ultimate)',
      modifiedSince: new Date('1969-09-24'),
    })
  } catch (error) {
    console.log(`Error in running the application: ${error}`)
  }
}

await main()
