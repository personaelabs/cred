import { GroupSpec } from '../types';
import devResolver from './resolvers/devResolver';
import zkForHumansResolver from './resolvers/zkForHumansResolver';

const spaces: GroupSpec[] = [
  {
    space: {
      handle: 'dev',
      displayName: 'Dev',
      logo: 'https://storage.googleapis.com/personae-images/anon.png',
      requirements: ['Requirement 1', 'Requirement 2'],
    },
    resolveMembers: devResolver,
  },
  {
    space: {
      displayName: 'the zkouncil',
      handle: 'zkouncil',
      logo: 'https://storage.googleapis.com/personae-images/zkouncil.jpeg',
      requirements: ['you write circuits'],
    },
    resolveMembers: zkForHumansResolver,
  },
];

export default spaces;
