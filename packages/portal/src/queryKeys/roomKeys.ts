const roomKeys = {
  all: ['rooms'] as const,
  room: (roomId: string) => ['room', { roomId }],
  joinedRooms: ['joined-rooms'] as const,
  roomKeyBuyPrice: (roomId: string) => ['buy-price', { roomId }],
  roomKeySellPrice: (roomId: string) => ['sell-price', { roomId }],
  roomKeyBalance: ({
    address,
    tokenId,
  }: {
    address: string | null;
    tokenId: bigint | null;
  }) => ['room-key-balance', { address, tokenId }],
};

export default roomKeys;
