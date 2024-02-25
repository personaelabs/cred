# Compile proto files for the frontend
protoc \
    --plugin="protoc-gen-ts=./node_modules/.bin/protoc-gen-ts" \
    --proto_path="./packages/protobufs/schemas" \
    --ts_opt=esModuleInterop=true \
    --js_out="import_style=commonjs,binary:./packages/frontend/src/proto" \
    --ts_out="./packages/frontend/src/proto" \
   ./packages/protobufs/schemas/address_to_groups.proto \
   ./packages/protobufs/schemas/merkle_proof.proto \
&& 
# Compile proto files for the indexer
protoc \
    --plugin="protoc-gen-ts=./node_modules/.bin/protoc-gen-ts" \
    --proto_path="./packages/protobufs/schemas" \
    --ts_opt=esModuleInterop=true \
    --js_out="import_style=commonjs,binary:./packages/indexer/src/proto" \
    --ts_out="./packages/indexer/src/proto" \
   ./packages/protobufs/schemas/transfer_event.proto \
   ./packages/protobufs/schemas/merkle_proof.proto


