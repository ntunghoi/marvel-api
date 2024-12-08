import path from 'path'
import { fileURLToPath } from 'url'
import { Env } from '@humanwhocodes/env'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type Config = {
  redis: {
    host: string
    port: number
    channelName: string
  }
  marvel: {
    privateKey: string
    publicKey: string
  }
  hostPort: string
  protoPath: string
}

export const loadConfig = (env: Env): Config => {
  try {
    const redisHost = env.require('REDIS_HOST')
    const redisPort = parseInt(env.require('REDIS_PORT'))
    const redisChannelName = env.require('REDIS_CHANNEL_NAME')
    const marvelPrivateKey = env.require('MARVEL_PRIVATE_KEY')
    const marvelPublicKey = env.require('MARVEL_PUBLIC_KEY')
    const hostPort = env.require('HOST_PORT')
    const protoPath = env.require('PROTO_PATH')

    return {
      redis: {
        host: redisHost,
        port: redisPort,
        channelName: redisChannelName,
      },
      marvel: {
        privateKey: marvelPrivateKey,
        publicKey: marvelPublicKey,
      },
      hostPort,
      protoPath: path.resolve(__dirname, protoPath),
    }
  } catch (error) {
    throw new Error(`Error in loading configuration: ${error}`)
  }
}
