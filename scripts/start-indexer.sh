pnpm -F db migrate:prod && \
pnpm -F indexer exec ts-node ./src/syncTransfers.ts && \
pnpm -F indexer exec ts-node ./src/indexMerkleTree.ts