import { DEV_ADDRESSES } from '../../utils';
import { Hex } from 'viem';
import { GroupSpec } from '../../types';

const membersResolver = async (): Promise<Hex[]> => {
  return DEV_ADDRESSES;
};

const groupResolver = async (): Promise<GroupSpec> => {
  return {
    group: {
      handle: 'dev',
      displayName: 'Dev',
    },
    resolveMembers: membersResolver,
  };
};

export default groupResolver;
