import {
  CRED_CONTRACT_ADDRESS as _CRED_CONTRACT_ADDRESS,
  CRED_SEPOLIA_CONTRACT_ADDRESS,
} from '@cred/shared';
import { getChain } from './utils';
import { baseSepolia } from 'viem/chains';

export const CRED_CONTRACT_ADDRESS =
  getChain().id === baseSepolia.id
    ? CRED_SEPOLIA_CONTRACT_ADDRESS
    : _CRED_CONTRACT_ADDRESS;
