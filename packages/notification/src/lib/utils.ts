import { app } from '@cred/firebase';

// @ts-ignore
const projectId = app.options.credential.projectId;

console.log('projectId', projectId);

export const IS_PROD =
  process.env.RENDER === 'true' &&
  (projectId === 'cred-279bb' || projectId === 'staging-423405');
