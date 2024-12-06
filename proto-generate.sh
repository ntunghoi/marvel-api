#!/bin/sh

yarn proto-loader-gen-types --longs=String --enums=String --defaults --oneofs --grpcLib=@grpc/grpc-js --outDir=apps/api/src/protos/gen apps/api/src/protos/*.proto

node proto-codemod.mjs 'apps/api/src/protos/gen'

protoc -I=./apps/api/src/protos \
  marvel.proto \
  --plugin=protoc-gen-js=./node_modules/.bin/protoc-gen-ts \
  --js_out=import_style=es6:./apps/terminal-client/src/gen

node proto-codemod.mjs 'apps/terminal-client/src/gen'