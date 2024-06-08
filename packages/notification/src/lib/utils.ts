import { app } from '@cred/firebase-admin';
import logger from './logger';

// @ts-ignore
const projectId = app.options.credential.projectId;

// Dry run mode is enabled when running on a pull request or on a non-render environment
let DRY_RUN = false;

if (
  process.env.IS_PULL_REQUEST === 'true' &&
  process.env.RENDER_GIT_BRANCH !== 'staging'
) {
  DRY_RUN = true;
}

if (process.env.RENDER !== 'true') {
  DRY_RUN = true;
}
export { DRY_RUN };

logger.info(`Google Cloud project ID: ${projectId}`);
logger.info(`Running in ${DRY_RUN ? 'dry run' : 'production'} mode`);
