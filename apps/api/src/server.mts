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
import { GetComicCharacterRequest } from './protos/gen/services/marvel/v1/GetComicCharacterRequest.mjs'
import { GetComicCharacterResponse } from './protos/gen/services/marvel/v1/GetComicCharacterResponse.mjs'

const ENUM_ORDER_BY = ['name', 'modified', '-name', '-modified']

class MarvelProxy {
  _redisClient: RedisClient
  _marvelClient: MarvelClient

  constructor(config: Config, redisClient: RedisClient) {
    this._redisClient = redisClient
    this._marvelClient = new MarvelClient({
      publicKey: config.marvel.publicKey,
      privateKey: config.marvel.privateKey,
    })
  }

  getComicCharacters(
    call: gRPC.ServerUnaryCall<
      GetComicCharactersRequest,
      GetComicCharactersResponse
    >,
    callback: gRPC.sendUnaryData<GetComicCharactersResponse>
  ) {
    const {
      name,
      nameStartsWith,
      modifiedSince,
      comics,
      series,
      events,
      stories,
      orderBy,
      limit,
      offset,
    } = call.request
    this._marvelClient
      .getComicCharacters({
        name,
        nameStartsWith,
        modifiedSince: modifiedSince
          ? new Date(modifiedSince.seconds as number)
          : null,
        comics: comics?.split(',') ?? null,
        series: series?.split(',') ?? null,
        events: events?.split(',') ?? null,
        stories: stories?.split(',') ?? null,
        orderBy: ENUM_ORDER_BY[orderBy],
        limit,
        offset,
      })
      .then((response) => {
        callback(null, {
          code: response.code,
          status: response.status,
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

  getComicCharacter(
    call: gRPC.ServerUnaryCall<
      GetComicCharacterRequest,
      GetComicCharacterResponse
    >,
    callback: gRPC.sendUnaryData<GetComicCharacterResponse>
  ) {
    const characterId = call.request.characterId
    if (!characterId) {
      throw new Error(`Missing character ID`)
    }

    const isHardReload = call.request.isHardReload
    this._redisClient
      .readCache(characterId.toString(), isHardReload)
      .then((value) => {
        if (value !== null) {
          console.log('From cache')
          callback(null, JSON.parse(value))
        } else {
          this._marvelClient
            .getComicCharacter({ characterId: call.request.characterId })
            .then((response) => {
              const value = {
                code: response.code,
                status: response.status,
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
              }
              this._redisClient.writeCache(
                characterId.toString(),
                JSON.stringify(value)
              )
              callback(null, value)
            })
        }
      })
  }

  getChangeNotifications(call) {
    calls.push(call)
  }
}

const calls = new Array<
  gRPC.ServerWritableStream<
    GetChangeNotificationRequest__Output,
    GetChangeNotificationResponse
  >
>()

export const startServer = async (config: Config) => {
  const redisClient = new RedisClient(config.redis.host, config.redis.port)
  redisClient.subscribe(config.redis.channelName, (message: string) => {
    console.log('Message: %o', message)
    calls.forEach((call) => {
      call.write({ characterId: message })
    })
  })

  const marvelProxy = new MarvelProxy(config, redisClient)
  const packageDef = protoLoader.loadSync(config.protoPath)
  const proto = gRPC.loadPackageDefinition(
    packageDef
  ) as unknown as ProtoGrpcType

  const marvelServer: MarvelServiceHandlers = {
    getComicCharacters: (
      call: gRPC.ServerUnaryCall<
        GetComicCharactersRequest,
        GetComicCharactersResponse
      >,
      callback: gRPC.sendUnaryData<GetComicCharactersResponse>
    ) => {
      marvelProxy.getComicCharacters(call, callback)
    },

    getComicCharacter: (
      call: gRPC.ServerUnaryCall<
        GetComicCharacterRequest,
        GetComicCharacterResponse
      >,
      callback: gRPC.sendUnaryData<GetComicCharacterResponse>
    ) => {
      marvelProxy.getComicCharacter(call, callback)
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
