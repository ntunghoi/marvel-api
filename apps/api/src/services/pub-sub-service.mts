import { RedisClient } from './redis-client.mjs'

export class PubSubService {
  _redisClient: RedisClient

  constructor(
    host: string,
    port: number,
    registerOnExitListener: (onExitListener: () => void) => void
  ) {
    this._redisClient = new RedisClient(host, port, {
      onError: (error) => {
        console.log(`Error in setting up pub-sub servie: %o`, error)
      },
      onConnect: () => {
        console.log(`PubSub Service is ready`)
      },
      onDisconected: (op) => {
        console.log(`PubSub Service is disconnected when calling ${op}`)
      },
      onClose: () => {
        console.log('PubSub Service is closed')
      },
    })
    registerOnExitListener(() => this._redisClient.close())
  }

  subscribe = async (channel: string, callback: (message: string) => void) => {
    await this._redisClient.subscribe(channel, callback)
  }
}
