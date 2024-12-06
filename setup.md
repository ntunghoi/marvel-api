## Environment setup

```bash
# Initialize yarn
yarn init

# setup Nx
npx nx@latest init

# Generate a project for the API module
yarn proto-loader-gen-types --longs=String --enums=String --defaults --oneofs --grpcLib=@grpc/grpc-js --outDir=apps/api/src/protos/gen apps/api/src/protos/*.proto

node proto-codemod.mjs
```
