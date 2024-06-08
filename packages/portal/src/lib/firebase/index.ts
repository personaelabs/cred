import { initializeApp } from 'firebase/app';
import lakshman from './firebase.lakshman';
import dan from './firebase.dan';
import prod from './firebase.prod';
import staging from './firebase.staging';

const NEXT_PUBLIC_PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!NEXT_PUBLIC_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not defined');
}

let config;
switch (NEXT_PUBLIC_PROJECT_ID) {
  case dan.projectId:
    config = dan;
    break;
  case prod.projectId:
    config = prod;
    break;
  case staging.projectId:
    config = staging;
    break;
  case lakshman.projectId:
    config = lakshman;
    break;
  default:
    throw new Error(`Unknown project ID: ${NEXT_PUBLIC_PROJECT_ID}`);
}

const app = initializeApp(config);

export default app;
