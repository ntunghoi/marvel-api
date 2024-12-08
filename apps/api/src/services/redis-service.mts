import { RedisClientType } from '@redis/client'
import redis from 'redis'

export class RedisClient {
  _cachePromise: Promise<
    RedisClientType<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>
    >
  >
  _pubSubPromise: Promise<
    RedisClientType<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>
    >
  >
  _cacheClient: RedisClientType
  _pubSubClient: RedisClientType

  constructor(host: string, port: number) {
    const url = `redis://${host}:${port}`

    this._cacheClient = redis.createClient({ url })
    this._cachePromise = this._cacheClient.connect()

    this._pubSubClient = redis.createClient({ url })
    this._pubSubPromise = this._pubSubClient.connect()
  }

  readCache = async (key: string, isHardReload: boolean = false) => {
    await this._cachePromise
    return isHardReload
      ? this._cacheClient.del(key).then(() => null)
      : this._cacheClient.get(key)
  }

  writeCache = async (key: string, value: string) => {
    await this._cachePromise
    await this._cacheClient.set(key, value)
  }

  deleteCache = async (key: string) => {
    await this._cachePromise
    await this._cacheClient.del(key)
  }

  subscribe = async (channel: string, callback: (message: string) => void) => {
    await this._pubSubPromise
    this._pubSubClient.subscribe(channel, callback)
  }
}
