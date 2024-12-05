import { readFileSync, readdirSync, writeFileSync } from 'fs'
import path, { join } from 'path'
import { fileURLToPath } from 'url'

const relativePathToDirArg = process.argv[2] ?? 'apps/api/src/protos/gen'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const absolutePathToDir = join(__dirname, relativePathToDirArg)

readdirSync(absolutePathToDir)
  .filter((/** @type {string} */ filename) => filename.endsWith('.ts'))
  .forEach((filename) => {
    console.log(filename, absolutePathToDir)
    const pathToFile = join(absolutePathToDir, filename)

    const file = readFileSync(pathToFile, { encoding: 'utf-8' })

    // Looking for all relative import paths and appending ".js" to the end of the import path
    const modifiedFile = file.replaceAll(/(import .* '\.+\/.*)';/g, "$1.js';")

    writeFileSync(pathToFile, modifiedFile)
  })
