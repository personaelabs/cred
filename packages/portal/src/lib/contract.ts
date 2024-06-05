import {
  PORTAL_CONTRACT_ADDRESS as _PORTAL_CONTRACT_ADDRESS,
  PORTAL_SEPOLIA_CONTRACT_ADDRESS,
  PORTAL_CONTRACT_DEPLOYED_BLOCK as _PORTAL_CONTRACT_DEPLOYED_BLOCK,
  PORTAL_SEPOLIA_CONTRACT_DEPLOY_BLOCK,
} from '@cred/shared';
import { getChain } from './utils';
import { baseSepolia } from 'viem/chains';
import { parseAbiItem } from 'viem';

export const TRANSFER_SINGLE_EVENT = parseAbiItem(
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'
);

const chain = getChain();

export const PORTAL_CONTRACT_ADDRESS =
  chain.id === baseSepolia.id
    ? PORTAL_SEPOLIA_CONTRACT_ADDRESS
    : _PORTAL_CONTRACT_ADDRESS;

export const PORTAL_CONTRACT_DEPLOYED_BLOCK =
  chain.id === baseSepolia.id
    ? PORTAL_SEPOLIA_CONTRACT_DEPLOY_BLOCK
    : _PORTAL_CONTRACT_DEPLOYED_BLOCK;
