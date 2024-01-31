# Cred

## Development

### 1. Set up the environment variables

Set the following environment variables in `packages/frontend/.env.local`.

```
ACCESS_TOKEN=
ACCESS_TOKEN_SECRET=
API_KEY=
API_KEY_SECRET=
PERSONAE_ACCESS_TOKEN=
PERSONAE_ACCESS_TOKEN_SECRET=
```

### 2. Run database migrations

```
pnpm -F db start
```

### 3. Start the ngrok https tunnel

Start an https tunnel using ngrok. This is required to receive callbacks from Twitter during the OAuth flow.

```
pnpm -F frontend exec ngrok http 3000 --hostname=[HOSTNAME] --authtoken [AUTH TOKEN]
```

## 3. Run the app

```
pnpm -F frontend dev
```
