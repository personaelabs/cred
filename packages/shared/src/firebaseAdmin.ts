import { applicationDefault, initializeApp } from 'firebase-admin/app';
// import { getProjectIdFromGitBranch } from './utils';

export const initAdminApp = () => {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS must be set');
  }

  const app = initializeApp({
    credential: applicationDefault(),
  });

  /*
  const RENDER_GIT_BRANCH = process.env.RENDER_GIT_BRANCH;

  if (
    RENDER_GIT_BRANCH &&
    app.options.projectId !== getProjectIdFromGitBranch(RENDER_GIT_BRANCH)
  ) {
    throw new Error(
      `RENDER_GIT_BRANCH ${RENDER_GIT_BRANCH} does not match PROJECT_ID ${app.options.projectId}`
    );
  }
  */

  return app;
};
