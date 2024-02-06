import { GroupSpec } from '../types';
import devResolver from './resolvers/devResolver';
import earlyHoldersResolver from './resolvers/earlyHoldersResolver';

/**
 * Resolver that returns all groups
 */
const groupsResolver = async (): Promise<GroupSpec[]> => {
  const devGroup = await devResolver();
  const earlyHolderGroups = await earlyHoldersResolver();

  return [devGroup, ...earlyHolderGroups];
};

export default groupsResolver;
