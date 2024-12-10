import { RedisClientType } from '@redis/client'
import redis from 'redis'

export type RedisClientListener = {
  onError: (error: any) => void
  onConnect: () => void
  onDisconected: (op: string) => void
  onClose: () => void
}

export class RedisClient {
  _isConnected: boolean
  _redisClientPromise: Promise<
    RedisClientType<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>
    >
  >
  _redisClient: RedisClientType
  _redisClientListener: RedisClientListener

  constructor(
    host: string,
    port: number,
    redisClientListener?: RedisClientListener
  ) {
    try {
      this._isConnected = false
      this._redisClientListener = redisClientListener
      this._redisClient = redis.createClient({
        url: `redis://${host}:${port}`,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 50) {
              throw new Error('Exceed number of Redis connect retry')
            } else if (retries > 25) {
              return 30 * 1000
            }
            if (retries > 10) {
              return 15 * 1000
            }

            return 10 * 100
          },
        },
      })
      this._redisClient.on('error', (error) => {
        this._isConnected = false
        if (this._redisClientListener) {
          this._redisClientListener.onError(error)
        }
      })
      this._redisClient.on('connect', () => {
        this._isConnected = true
        if (this._redisClientListener) {
          this._redisClientListener.onConnect()
        }
      })
      this._redisClientPromise = this._redisClient.connect()
    } catch (error) {
      console.log('`Error in setting up Redis client: %o', error)
    }
  }

  async get(key: string) {
    if (this._redisClientPromise) {
      await this._redisClientPromise
    }
    if (this._isConnected) {
      return this._redisClient.get(key)
    }

    this._redisClientListener.onDisconected('get')
    return null
  }

  async set(key: string, value: string) {
    if (this._redisClientPromise) {
      await this._redisClientPromise
    }
    if (this._isConnected) {
      await this._redisClient.set(key, value)
    } else {
      this._redisClientListener.onDisconected('set')
    }
  }

  async del(key: string) {
    if (this._redisClientPromise) {
      await this._redisClientPromise
    }
    if (this._isConnected) {
      await this._redisClient.del(key)
    } else {
      this._redisClientListener.onDisconected('del')
    }
  }

  subscribe = async (channel: string, callback: (message: string) => void) => {
    if (this._redisClientPromise) {
      await this._redisClientPromise
    }
    if (this._isConnected) {
      await this._redisClient.subscribe(channel, callback)
    } else {
      this._redisClientListener.onDisconected('subscribe')
    }
  }

  close = async () => {
    this._redisClientListener.onClose()
    if (this._redisClientPromise) {
      await this._redisClientPromise
    }
    if (this._isConnected) {
      await this._redisClient.disconnect()
    }
  }
}
