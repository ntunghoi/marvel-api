## Environment setup

```bash
# Initialize yarn
yarn init

# setup Nx
npx nx@latest init

# Generate a project for the API module
yarn nx generate @nx/node:application apps/api --e2eTestRunner none --directory apps/api --bundler esbuild --framework none --verbose

yarn nx run api:serve

yarn nx generate @nx/node:application apps/terminal-client --e2eTestRunner none --directory apps/terminal-client --bundler esbuild --framework none --verbose

yarn nx run terminal-client:serve

yarn proto-loader-gen-types --longs=String --enums=String --defaults --oneofs --grpcLib=@grpc/grpc-js --outDir=apps/api/src/protos/gen apps/api/src/protos/*.proto

node proto-codemod.mjs
```

## Redis

```bash
brew install redis
brew services start redis
brew services info redis
brew services stop redis
redis-cli INFO

redis-cli -h 0.0.0.0 -p 6379
> PUBSUB CHANNELS
> publish MARVEL_UPDATE_CHANNEL <message>

> KEYS *
> DEL [...<key>]
```

## Demo

```bash
yarn nx run api:serve
yarn nx run terminal-client:serve
```
