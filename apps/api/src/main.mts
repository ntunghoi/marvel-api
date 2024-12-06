/*
import dotenv from 'dotenv'
import { Env } from '@humanwhocodes/env'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'
import { MarvelClient } from './services/marvel-service.mjs'

dayjs.extend(utc)
dayjs.extend(timezone)

dotenv.config()
const env = new Env()
type Config = {
  marvel: {
    privateKey: string
    publicKey: string
  }
}
const loadConfig = (): Config => {
  try {
    const marvelPrivateKey = env.require('MARVEL_PRIVATE_KEY')
    const marvelPublicKey = env.require('MARVEL_PUBLIC_KEY')
    return {
      marvel: {
        privateKey: marvelPrivateKey,
        publicKey: marvelPublicKey,
      },
    }
  } catch (error) {
    throw new Error(`Error in loading configuration: ${error}`)
  }
}
const main = async () => {
  try {
    const config = loadConfig()
    const marvelClient = new MarvelClient({
      publicKey: config.marvel.publicKey,
      privateKey: config.marvel.privateKey,
    })
    await marvelClient.getComicCharacters({
      name: 'X-Men (Ultimate)',
      modifiedSince: new Date('1969-09-24'),
    })
  } catch (error) {
    console.log(`Error in running the application: ${error}`)
  }
}

await main()
*/
/*
import {
  sendUnaryData,
  Server,
  ServerCredentials,
  ServerUnaryCall,
} from '@grpc/grpc-js'
import {
  GetComicCharactersRequest,
  GetComicCharactersResponse,
  GetComicCharactersResponseSchema,
} from './protos/gen/marvel_pb.mjs'
import { create } from '@bufbuild/protobuf'

const getComicCharacters = (
  call: ServerUnaryCall<GetComicCharactersRequest, GetComicCharactersResponse>,
  callbackl: sendUnaryData<GetComicCharactersResponse>
): void => {
  const response = create(GetComicCharactersResponseSchema, {
    copyright: 'Copyright',
    attributionText: 'Attribution Text',
    attributionHTML: 'Attribution HTML',
  })

  callbackl(null, response)
}

const server = new Server()

server.addService(MarvelServiceService, { getComicCharacters })

server.bindAsync('0.0.0.0:4000', ServerCredentials.createInsecure(), () => {
  server.start()

  console.log('server is running on 0.0.0.0:4000')
})
*/

import path from 'path'
import { fileURLToPath } from 'url'
import gRPC from '@grpc/grpc-js'
import protoLoader from '@grpc/proto-loader'
import { ProtoGrpcType } from './protos/gen/marvel.mjs'
import { MarvelServiceHandlers } from './protos/gen/services/marvel/v1/MarvelService.mjs'
import { GetComicCharactersRequest } from './protos/gen/services/marvel/v1/GetComicCharactersRequest.mjs'
import { GetComicCharactersResponse } from './protos/gen/services/marvel/v1/GetComicCharactersResponse.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
}

const packageDef = protoLoader.loadSync(
  path.resolve(__dirname, '../../../apps/api/src/protos/marvel.proto')
)
const proto = gRPC.loadPackageDefinition(packageDef) as unknown as ProtoGrpcType

const server = new gRPC.Server()
server.addService(proto.services.marvel.v1.MarvelService.service, marvelServer)

server.bindAsync(
  '0.0.0.0:4000',
  gRPC.ServerCredentials.createInsecure(),
  (error: Error | null, port: number) => {
    if (error) {
      console.error(`Error in binding address for server: ${error}`)
    } else {
      console.log(`Server bound on port: ${port}`)
    }
  }
)
