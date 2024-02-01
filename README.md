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

## OAuth and zero-knowledge attestation

- A user is authenticated by an ECDSA public key generated using the Web Crypto API. We’ll call this ECDSA key pair “signer”.
- A user can authorize [creddd.xyz](http://creddd.xyz) to Tweet on their behalf using OAuth. [creddd.xyz](http://creddd.xyz) links a Twitter account to a signer during the OAuth process. The user can Tweet through [creddd.xyz](http://creddd.xyz) by signing their Tweets.
- A user must attest their signer with a credible Ethereum address. [creddd.xyz](http://creddd.xyz) doesn’t allow Tweeting if the signer isn’t attested.
