import * as grpc from '@grpc/grpc-js'
import { services } from './gen/marvel.mjs'

const marvelClient = new services.marvel.v1.MarvelServiceClient(
  '0.0.0.0:4000',
  grpc.credentials.createInsecure()
)
marvelClient.getComicCharacters(
  new services.marvel.v1.GetComicCharactersRequest(),
  (error, response) => {
    console.log(`Response: ${JSON.stringify(response)}`)
  }
)
