#!/bin/bash

# Check if Rust is installed
if ! command -v rustc &> /dev/null
then
    echo "Rust is not installed. Installing Rust..."
    
    # Install Rust
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    
    echo "Rust installation completed."
else
    echo "Rust is already installed."
fi && \
# Install protobuf
brew install protobuf@3 && brew link --overwrite protobuf@3 && \
# Install dependencies
pnpm i