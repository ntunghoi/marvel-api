## Environment setup

```bash
# Initialize yarn
yarn init

# setup Nx
npx nx@latest init

yarn nx generate @nx/node:application apps/api --e2eTestRunner none --directory apps/api --bundler esbuild --framework none --verbose

yarn nx run api:serve

yarn nx generate @nx/node:application apps/terminal-client --e2eTestRunner none --directory apps/terminal-client --bundler esbuild --framework none --verbose

yarn nx run terminal-client:serve

# Generate a project for the API module
yarn proto-loader-gen-types --longs=String --enums=String --defaults --oneofs --grpcLib=@grpc/grpc-js --outDir=apps/api/src/protos/gen apps/api/src/protos/*.proto

node proto-codemod.mjs
```
