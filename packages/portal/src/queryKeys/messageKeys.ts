const messageKeys = {
  roomMessages: (roomId: string) => ['messages', { roomId }],
  roomLatestMessage: (roomId: string) => ['latest-message', { roomId }],
  readTicket: (roomId: string) => ['read-ticket', { roomId }],
};

export default messageKeys;
