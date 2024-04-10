// Content in this file was copied from https://github.com/farcasterxyz/hub-monorepo/blob/main/packages/core/src/eth/contracts/idGateway.ts#L5
import { ID_GATEWAY_ADDRESS } from './farcaster';

export const ID_GATEWAY_EIP_712_DOMAIN = {
  name: 'Farcaster IdGateway',
  version: '1',
  chainId: 10,
  verifyingContract: ID_GATEWAY_ADDRESS,
} as const;

export const ID_GATEWAY_REGISTER_TYPE = [
  { name: 'to', type: 'address' },
  { name: 'recovery', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
] as const;

export const ID_GATEWAY_EIP_712_TYPES = {
  domain: ID_GATEWAY_EIP_712_DOMAIN,
  types: { Register: ID_GATEWAY_REGISTER_TYPE },
} as const;

export type IdGatewayRegisterMessage = {
  /** FID custody address */
  to: `0x${string}`;

  /** FID recovery address */
  recovery: `0x${string}`;

  /** IdGateway nonce for signer address */
  nonce: bigint;

  /** Unix timestamp when this message expires */
  deadline: bigint;
};
