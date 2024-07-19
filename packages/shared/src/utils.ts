export const getRoomTokenId = (roomId: string) => {
  switch (roomId) {
    case 'test':
      return BigInt(1);
    case 'test-notification':
      return BigInt(2);
    case 'ethcc-2024':
      return BigInt(3);
    case 'personae':
      return BigInt(4);
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
    case BigInt(3):
      return 'ethcc-2024';
    case BigInt(4):
      return 'personae';
    default:
      return tokenId.toString(16).padStart(64, '0');
  }
};

export const ETH_CC_ROOM_ID = 'ethcc-2024';
export const ETH_CC_ROOM_CREDDD = [
  '098661fd283ac040760e2459aa905ab4eea5af0f1bc4b8ac215bf0aaf9a27b57', // arbitrum aslon
  '0f52c884729bb73f81eafc295e9c8fd492475e28e3cbedba5eed4932049caa70', // base salon
  '5fdd60351ea294f4092f692d4a813419ecba6f6ebb7d6316a2cd90fff4249e0c', // optimism salon
  'b796c128590828f60d84a50abefea8728e3124096614830b371407ab91c86132', // blast salon
  '3c674ad1bf73d3950d1734f4cdc37cd69aec58e9b47c2f19e3784f7e957545a6', // eth salon,
  '0676adf3eb3332e1e2f80daca621727a80f9e1bb793e6864a85656f61489467c', // creddd team
];
