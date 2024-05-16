protoc \
    --plugin="protoc-gen-ts=./node_modules/.bin/protoc-gen-ts" \
    --plugin="protoc-gen-grpc=./node_modules/.bin/grpc_tools_node_protoc_plugin" \
    -I "../protobufs/services" \
    --ts_opt=esModuleInterop=true \
    --js_out="import_style=commonjs,binary:./src/proto" \
    --ts_out="service=grpc-node,mode=grpc-js:./src/proto" \
    --grpc_out="grpc_js:./src/proto" \
    groups.proto group_data.proto
   