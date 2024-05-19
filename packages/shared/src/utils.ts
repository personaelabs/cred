export const getRoomTokenId = (roomId: string) => {
  switch (roomId) {
    case 'test':
      return BigInt(1);
    case 'test-notification':
      return BigInt(2);
    default:
      return BigInt(`0x${roomId}`);
  }
};

export const tokenIdToRoomId = (tokenId: bigint) => {
  switch (tokenId) {
    case BigInt(1):
      return 'test';
    case BigInt(2):
      return 'test-notification';
    default:
      return tokenId.toString(16).padStart(64, '0');
  }
};
