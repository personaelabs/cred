#!/bin/bash

# Compile circuit for node.js
wasm-pack build ./packages/circuit/ --target nodejs --out-dir circuit-node && \
pnpm -F circuit build && \ 
rm ./packages/circuit/circuit-node/.gitignore && \
pnpm -F frontend i --no-cache && \ 
rm -rf packages/frontend/.next