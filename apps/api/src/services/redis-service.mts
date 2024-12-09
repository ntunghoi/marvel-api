import { RedisClientType } from '@redis/client'
import redis from 'redis'

export class RedisClient {
  _pubSubPromise: Promise<
    RedisClientType<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>
    >
  >
  _pubSubClient: RedisClientType

  constructor(host: string, port: number) {
    this._pubSubClient = redis.createClient({ url: `redis://${host}:${port}` })
    this._pubSubPromise = this._pubSubClient.connect()
  }

  subscribe = async (channel: string, callback: (message: string) => void) => {
    await this._pubSubPromise
    this._pubSubClient.subscribe(channel, callback)
  }
}
