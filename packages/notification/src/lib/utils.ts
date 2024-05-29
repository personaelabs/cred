import { app } from '@cred/firebase';
import { logger } from '@cred/shared';

// @ts-ignore
const projectId = app.options.credential.projectId;

// Dry run mode is enabled when running on a pull request or on a non-render environment
export const DRY_RUN =
  process.env.IS_PULL_REQUEST === 'true' || process.env.RENDER !== 'true';

logger.info(`Google Cloud project ID: ${projectId}`);
logger.info(`Running in ${DRY_RUN ? 'dry run' : 'production'} mode`);
