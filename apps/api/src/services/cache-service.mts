import { RedisClient } from './redis-client.mjs'

export interface CacheService {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string) => Promise<void>
  del: (key: string) => Promise<void>
}

export class LocalCacheService implements CacheService {
  _inMemCache = new Map<string, string>()
  _mutex = Promise.resolve()

  async get(key: string) {
    console.log(`Local Cache: ${[...this._inMemCache.keys()]}`)

    return this._inMemCache.get(key) ?? null
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
  _redisClient: RedisClient

  constructor(
    host: string,
    port: number,
    registerOnExitListener: (onExitListener: () => void) => void
  ) {
    this._redisClient = new RedisClient(host, port, {
      onError: (error) => {
        console.log('`Error in setting up remote cache service: %O', error)
      },
      onConnect: () => {
        console.log(`Remote cache service is ready`)
      },
      onDisconected: (op) => {
        console.log(`Remote cache service is disonnected when calling ${op}`)
      },
      onClose: () => {
        console.log('Remote cach service is closed')
      },
    })
    registerOnExitListener(() => this._redisClient.close())
  }

  async get(key: string) {
    return await this._redisClient.get(key)
  }

  async set(key: string, value: string) {
    await this._redisClient.set(key, value)
  }

  async del(key: string) {
    await this._redisClient.del(key)
  }
}
