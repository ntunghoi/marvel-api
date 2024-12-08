import { Env } from '@humanwhocodes/env'

export type Config = {
  serverHostPort: string
}

export const loadConfig = (env: Env): Config => {
  try {
    const serverHostPort = env.require('SERVER_HOST_PORT')

    return {
      serverHostPort,
    }
  } catch (error) {
    throw new Error(`Error in loading configuration: ${error}`)
  }
}
