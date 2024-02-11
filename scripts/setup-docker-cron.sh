curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
export PATH="$HOME/.cargo/bin:$PATH" && \
source "$HOME/.cargo/env" && \
# Build the merkle-tree Neon module
pnpm -F merkle-tree exec pnpm install && \

# Run db migrations 
pnpm -F db migrate:prod && \

# Run the cron job
pnpm -F indexer exec ts-node ./src/indexMerkleTree.ts