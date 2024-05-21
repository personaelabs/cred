export const IS_PROD =
  process.env.RENDER === 'true' && process.env.IS_PULL_REQUEST !== 'true';
