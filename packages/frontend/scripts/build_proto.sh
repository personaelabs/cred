protoc \
    --plugin="protoc-gen-ts=./node_modules/.bin/protoc-gen-ts" \
    --proto_path="./protobufs/schemas" \
    --ts_opt=esModuleInterop=true \
    --js_out="import_style=commonjs,binary:./src/proto" \
    --ts_out="./src/proto" \
   address_to_groups.proto