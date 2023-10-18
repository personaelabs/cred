#!/bin/bash

# Compile circuit for the web
wasm-pack build ./packages/circuit/ --target bundler --out-dir circuit-web && \ 
rm ./packages/circuit/circuit-web/.gitignore &&  \
pnpm -F frontend i --no-cache && \
rm -rf packages/frontend/.next \
