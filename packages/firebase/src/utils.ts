export const getProjectIdFromGitBranch = (branch: string) => {
  return branch.replaceAll('/', '-');
};
