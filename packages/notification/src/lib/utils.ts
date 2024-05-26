import { app } from '@cred/firebase';

// @ts-ignore
const projectId = app.options.credential.projectId;

export const IS_PROD =
  (process.env.RENDER === 'true' && process.env.IS_PULL_REQUEST !== 'true') ||
  projectId === 'staging-423405';

console.log('projectId', projectId);
console.log('IS_PROD', IS_PROD);
