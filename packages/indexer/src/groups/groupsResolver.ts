import { GroupSpec } from '../types';
import devResolver from './resolvers/devResolver';
import earlyHoldersResolver from './resolvers/earlyHoldersResolver';
import whalesResolver from './resolvers/whaleResolver';

/**
 * Combine and return all group resolvers
 */
const groupsResolver = async (): Promise<GroupSpec[]> => {
  const devGroup = await devResolver();
  const earlyHolderGroups = await earlyHoldersResolver();
  const whaleGroups = await whalesResolver();

  return [devGroup, ...earlyHolderGroups, ...whaleGroups];
};

export default groupsResolver;
