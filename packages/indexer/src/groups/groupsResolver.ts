import { GroupSpec } from '../types';
import devResolver from './resolvers/devResolver';
import earlyHoldersResolver from './resolvers/earlyHoldersResolver';

/**
 * Combine and return all group resolvers
 */
const groupsResolver = async (): Promise<GroupSpec[]> => {
  const devGroup = await devResolver();
  const earlyHolderGroups = await earlyHoldersResolver();

  return [devGroup, ...earlyHolderGroups];
};

export default groupsResolver;
