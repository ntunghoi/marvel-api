import protoLoader from '@grpc/proto-loader'
import gRPC from '@grpc/grpc-js'
import { Config } from './config.mjs'
import { ProtoGrpcType } from './protos/gen/marvel.mjs'
import { MarvelServiceHandlers } from './protos/gen/services/marvel/v1/MarvelService.mjs'
import { GetComicCharactersRequest } from './protos/gen/services/marvel/v1/GetComicCharactersRequest.mjs'
import { GetComicCharactersResponse } from './protos/gen/services/marvel/v1/GetComicCharactersResponse.mjs'
import { GetChangeNotificationRequest__Output } from './protos/gen/services/marvel/v1/GetChangeNotificationRequest.mjs'
import { GetChangeNotificationResponse } from './protos/gen/services/marvel/v1/GetChangeNotificationResponse.mjs'
import { RedisClient } from './services/redis-service.mjs'
import { MarvelClient } from './services/marvel-service.mjs'

class MarvelProxy {
  _marvelClient: MarvelClient

  constructor(config: Config) {
    this._marvelClient = new MarvelClient({
      publicKey: config.marvel.publicKey,
      privateKey: config.marvel.privateKey,
    })
  }

  getComicCharacters(
    _: gRPC.ServerWritableStream<
      GetComicCharactersRequest,
      GetComicCharactersResponse
    >,
    callback: gRPC.sendUnaryData<GetComicCharactersResponse>
  ) {
    this._marvelClient.getComicCharacters({}).then((response) => {
      callback(null, {
        copyright: response.copyright,
        attributionText: response.attributionText,
        attributionHTML: response.attributionHTML,
        data: {
          limit: response.data?.limit,
          count: response.data?.count,
          offset: response.data?.offset,
          results: response.data.results.map((result) => ({
            id: result.id,
            name: result.name,
            description: result.description,
            modified: {
              seconds: result.modified.toDate().getTime(),
            },
            thumbnail: {
              path: result.thumbnail?.path,
              extension: result.thumbnail.extension,
            },
            resourceURI: result.resourceURI,
            comics: {
              available: result.comics.available,
              collectionURL: result.comics.collectionURI,
              items: result.comics.items.map((item) => ({
                resourceURI: item.resourceURI,
                name: item.name,
              })),
              returned: result.comics.returned,
            },
            series: {
              available: result.series.available,
              collectionURL: result.series.collectionURI,
              items: result.series.items.map((item) => ({
                resourceURI: item.resourceURI,
                name: item.name,
              })),
              returned: result.series.returned,
            },
            stories: {
              available: result.stories.available,
              collectionURL: result.stories.collectionURI,
              items: result.stories.items.map((item) => ({
                resourceURI: item.resourceURI,
                name: item.name,
              })),
              returned: result.stories.returned,
            },
            events: {
              available: result.events.available,
              collectionURL: result.events.collectionURI,
              items: result.events.items.map((item) => ({
                resourceURI: item.resourceURI,
                name: item.name,
              })),
              returned: result.events.returned,
            },
            urls: result.urls.map((url) => ({
              type: url.type,
              url: url.url,
            })),
          })),
        },
      })
    })
  }

  getChangeNotifications(call) {
    calls.push(call)
    /*
    items.forEach((item) => {
      call.write({
        remarks: `Item: ${item}`,
      })
    })
    */
  }
}

const calls = new Array<
  gRPC.ServerWritableStream<
    GetChangeNotificationRequest__Output,
    GetChangeNotificationResponse
  >
>()
//const items = Array.from(['A', 'B', 'C'])
/*
const marvelServer: MarvelServiceHandlers = {
  getComicCharacters: (
    _: gRPC.ServerWritableStream<
      GetComicCharactersRequest,
      GetComicCharactersResponse
    >,
    callback: gRPC.sendUnaryData<GetComicCharactersResponse>
  ) => {
    callback(null, {
      copyright: 'Copyright',
      attributionText: 'Attribution Text',
      attributionHTML: 'Attribution HTML',
    })
  },

  getChangeNotifications: (call) => {
    calls.push(call)
  },
}
  */

export const startServer = async (config: Config) => {
  const marvelProxy = new MarvelProxy(config)
  const redisClient = new RedisClient(config.redis.host, config.redis.port)
  redisClient.subscribe(config.redis.channelName, (message: string) => {
    console.log('Message: %o', message)
    calls.forEach((call) => {
      call.write({ remarks: message })
    })
  })
  const packageDef = protoLoader.loadSync(config.protoPath)
  const proto = gRPC.loadPackageDefinition(
    packageDef
  ) as unknown as ProtoGrpcType

  const marvelServer: MarvelServiceHandlers = {
    getComicCharacters: (
      call: gRPC.ServerWritableStream<
        GetComicCharactersRequest,
        GetComicCharactersResponse
      >,
      callback: gRPC.sendUnaryData<GetComicCharactersResponse>
    ) => {
      marvelProxy.getComicCharacters(call, callback)
    },

    getChangeNotifications: (call) => {
      marvelProxy.getChangeNotifications(call)
    },
  }

  const server = new gRPC.Server()
  server.addService(
    proto.services.marvel.v1.MarvelService.service,
    marvelServer
  )

  server.bindAsync(
    config.hostPort,
    gRPC.ServerCredentials.createInsecure(),
    (error: Error | null, port: number) => {
      if (error) {
        console.error(`Error in binding address for server: ${error}`)
      } else {
        console.log(`Server bound on port: ${port}`)
      }
    }
  )
}
