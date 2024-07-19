import { useState } from 'react';
import MessageReactionsModal from '../modals/MessageReactionsModal';

interface MessageReactionsProps {
  isSender: boolean;
  roomId: string;
  messageId: string;
  reactions: {
    [key: string]: string;
  };
}

const MessageReactions = (props: MessageReactionsProps) => {
  const { roomId, isSender, messageId, reactions } = props;
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);

  return (
    <>
      <div
        className={`mt-[-12px] flex flex-row mx-2 ${isSender ? 'justify-end' : 'justify-start'}`}
        onClick={() => {
          setIsReactionsModalOpen(true);
        }}
      >
        {Object.entries(reactions).map(([_userId, reaction], i) => (
          <div
            key={i}
            className={`flex flex-row items-center ${i !== 0 ? 'ml-[-4px]' : ''}`}
          >
            {reaction}
          </div>
        ))}
      </div>
      <MessageReactionsModal
        isOpen={isReactionsModalOpen}
        onClose={() => {
          setIsReactionsModalOpen(false);
        }}
        roomId={roomId}
        messageId={messageId}
        reactions={reactions}
      ></MessageReactionsModal>
    </>
  );
};

export default MessageReactions;
