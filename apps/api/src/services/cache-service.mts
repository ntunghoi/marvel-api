import { RedisClientType } from '@redis/client'
import redis from 'redis'

export interface CacheService {
  get: (key: string, isHardReload: boolean) => Promise<string | null>
  set: (key: string, value: string) => Promise<void>
  del: (key: string) => Promise<void>
}

export class LocalCacheService implements CacheService {
  _inMemCache = new Map<string, string>()
  _mutex = Promise.resolve()

  async get(key: string, isHardReload: boolean = false) {
    console.log(`Local Cache: ${[...this._inMemCache.keys()]}`)

    return isHardReload ? null : this._inMemCache.get(key) ?? null
  }

  async set(key: string, value: string) {
    await this._mutex
    this._mutex = (async () => {
      try {
        this._inMemCache.set(key, value)

        return Promise.resolve()
      } catch (error) {
        this._mutex = Promise.resolve()
        throw error
      }
    })()
  }

  async del(key: string) {
    await this._mutex
    this._mutex = (async () => {
      try {
        this._inMemCache.delete(key)
        return Promise.resolve()
      } catch (error) {
        this._mutex = Promise.resolve()
        throw error
      }
    })()
  }
}

export class RemoteCacheService implements CacheService {
  _cachePromise: Promise<
    RedisClientType<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>
    >
  >
  _cacheClient: RedisClientType

  constructor(host: string, port: number) {
    this._cacheClient = redis.createClient({ url: `redis://${host}:${port}` })
    this._cachePromise = this._cacheClient.connect()
  }

  async get(key: string, isHardReload: boolean = false) {
    await this._cachePromise
    return isHardReload
      ? this._cacheClient.del(key).then(() => null)
      : this._cacheClient.get(key)
  }

  async set(key: string, value: string) {
    await this._cachePromise
    await this._cacheClient.set(key, value)
  }

  async del(key: string) {
    await this._cachePromise
    await this._cacheClient.del(key)
  }
}
