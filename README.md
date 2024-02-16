# Cred

## Development

### Frontend

1. Run the setup script

```
sh ./scripts/setup.sh
```

2. Run the following command to start the database and run migrations. Make sure you have a Docker daemon running.

```
pnpm -F db start
```

3. Run the indexer to index the dev Merkle tree.

```
pnpm -F indexer exec ts-node ./src/indexMerkleTree.ts
```

4. Start the frontend.

```
pnpm -F frontend dev
```
