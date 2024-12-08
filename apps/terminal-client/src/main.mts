import * as dotenv from 'dotenv'
import { Env } from '@humanwhocodes/env'
import * as grpc from '@grpc/grpc-js'
import { services } from './gen/marvel.mjs'

import { loadConfig } from './config.mjs'

dotenv.config()
const env = new Env()

const main = () => {
  try {
    const config = loadConfig(env)
    const marvelClient = new services.marvel.v1.MarvelServiceClient(
      config.serverHostPort,
      grpc.credentials.createInsecure()
    )

    const changeNotifications = marvelClient.getChangeNotifications(
      new services.marvel.v1.GetChangeNotificationRequest()
    )
    changeNotifications.on('close', () => {
      console.log('Change notification is done')
    })
    changeNotifications.on('data', (changeNotification) => {
      const characterId = changeNotification.characterId
      console.log(`Notification: ${characterId}`)
      const message = new services.marvel.v1.GetComicCharacterRequest()
      message.characterId = characterId
      message.isHardReload = true
      marvelClient.getComicCharacter(message, (_, data) => {
        console.log(JSON.stringify(data, null, 2))
      })
    })
    changeNotifications.on('end', () => {
      console.log('Change notification ended')
    })
    changeNotifications.on('remove', () => {
      console.log('Change notification removed')
    })
    changeNotifications.on('error', (error) => {
      console.log(`Change notification error: ${error}`)
    })
  } catch (error) {
    console.error(error)
  }
}

await main()
