curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
export PATH="$HOME/.cargo/bin:$PATH" && \
source "$HOME/.cargo/env" && \
pnpm -F merkle-tree exec pnpm install