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
      logo: 'https://storage.googleapis.com/personae-images/anon.png',
      requirements: ['Requirement 1', 'Requirement 2'],
    },
    resolveMembers: membersResolver,
  };
};

export default groupResolver;
