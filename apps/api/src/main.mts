import dotenv from 'dotenv'
import { Env } from '@humanwhocodes/env'
import gRPC from '@grpc/grpc-js'
import protoLoader from '@grpc/proto-loader'

import { GetComicCharactersRequest } from './protos/gen/services/marvel/v1/GetComicCharactersRequest.mjs'
import { GetComicCharactersResponse } from './protos/gen/services/marvel/v1/GetComicCharactersResponse.mjs'
import { ProtoGrpcType } from './protos/gen/marvel.mjs'
import { MarvelServiceHandlers } from './protos/gen/services/marvel/v1/MarvelService.mjs'
import { GetComicCharacterRequest } from './protos/gen/services/marvel/v1/GetComicCharacterRequest.mjs'
import { GetComicCharacterResponse } from './protos/gen/services/marvel/v1/GetComicCharacterResponse.mjs'

import { Config, loadConfig } from './config.mjs'
import { RedisClient } from './services/redis-service.mjs'
import { MarvelServer } from './marvel-server.mjs'
import {
  LocalCacheService,
  RemoteCacheService,
} from './services/cache-service.mjs'

dotenv.config()
const env = new Env()

const startServer = async (config: Config) => {
  const cacheService = config.isLocalCache
    ? new LocalCacheService()
    : new RemoteCacheService(config.redis.host, config.redis.port)
  const redisClient = new RedisClient(config.redis.host, config.redis.port)
  const marvelServer = new MarvelServer(config, cacheService)
  redisClient.subscribe(config.redis.channelName, marvelServer.onChangeNotified)

  const packageDef = protoLoader.loadSync(config.protoPath)
  const proto = gRPC.loadPackageDefinition(
    packageDef
  ) as unknown as ProtoGrpcType

  const marvelServieHandlers: MarvelServiceHandlers = {
    getComicCharacters: (
      call: gRPC.ServerUnaryCall<
        GetComicCharactersRequest,
        GetComicCharactersResponse
      >,
      callback: gRPC.sendUnaryData<GetComicCharactersResponse>
    ) => {
      marvelServer.getComicCharacters(call, callback)
    },

    getComicCharacter: (
      call: gRPC.ServerUnaryCall<
        GetComicCharacterRequest,
        GetComicCharacterResponse
      >,
      callback: gRPC.sendUnaryData<GetComicCharacterResponse>
    ) => {
      marvelServer.getComicCharacter(call, callback)
    },

    getChangeNotifications: (call) => {
      marvelServer.getChangeNotifications(call)
    },
  }

  const server = new gRPC.Server()
  server.addService(
    proto.services.marvel.v1.MarvelService.service,
    marvelServieHandlers
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

const main = async () => {
  try {
    const config = loadConfig(env)

    await startServer(config)
  } catch (error) {
    console.error(error)
  }
}

await main()
