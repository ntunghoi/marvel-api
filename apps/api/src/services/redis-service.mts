import { RedisClientType } from '@redis/client'
import redis from 'redis'

export class RedisClient {
  _promise: Promise<
    RedisClientType<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>
    >
  >
  _redisClient: RedisClientType

  constructor(host: string, port: number) {
    this._redisClient = redis.createClient({ url: `redis://${host}:${port}` })

    this._promise = this._redisClient.connect()
  }

  subscribe = async (channel: string, callback: (message: string) => void) => {
    await this._promise
    this._redisClient.subscribe(channel, callback)
  }
}
