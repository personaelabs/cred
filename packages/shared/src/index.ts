export * from './types';
export * from './converters/userConverter';
export * from './converters/messageConverter';
export * from './converters/notificationTokensConvert';
export * from './converters/roomConverter';
export * from './converters/idempotencyKeyConverter';
export * from './converters/newRoomNotifyIdempotencyKeyConverter';
export * from './converters/roomReadTicketConverter';
export * from './converters/userCredddConverter';
export * from './converters/inviteCodeConverter';
export * from './utils';
export { createRpcClient } from './jsonrpc';
export { default as PortalAbi } from './abi/Portal';
export { initLogger } from './logger';

export const PORTAL_CONTRACT_ADDRESS =
  '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

export const PORTAL_SEPOLIA_CONTRACT_ADDRESS =
  '0xb8B0c71AA4e96F002BCd4dE6582B61c80e373E24';
