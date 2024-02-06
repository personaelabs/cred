import { GroupSpec } from '../types';
import devResolver from './resolvers/devResolver';
import cred2Resolver from './resolvers/credResolver';

const groups: GroupSpec[] = [
  {
    group: {
      handle: 'dev',
      displayName: 'Dev',
      logo: 'https://storage.googleapis.com/personae-images/anon.png',
      requirements: ['Requirement 1', 'Requirement 2'],
    },
    resolveMembers: devResolver,
  },
  {
    group: {
      displayName: 'cred 2.0',
      handle: 'cred-2',
      logo: 'https://storage.googleapis.com/personae-images/anon.png',
      requirements: ['you write circuits'],
    },
    resolveMembers: cred2Resolver,
  },
];

export default groups;
