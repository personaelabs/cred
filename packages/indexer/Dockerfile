FROM node:18.17.0

WORKDIR /usr/src/app

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Make sure Rust is in the PATH
ENV PATH="/root/.cargo/bin:${PATH}"

# Verify installations
RUN node --version
RUN npm --version
RUN rustc --version