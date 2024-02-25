pnpm -F db migrate:prod && \
pnpm -F indexer exec ts-node ./scripts/populate.ts && \
pnpm -F indexer exec ts-node ./src/syncTransfersOnce.ts && \
(pnpm -F indexer exec ts-node ./src/syncTransfersLoop.ts &
cargo run --release --bin indexer-rs)
