import { highlightText } from '@/lib/utils';
import { useLongPress } from 'use-long-press';
import { MessageVisibility } from '@cred/shared';
import { MessageWithUserData } from '@/types';

interface ChatBubbleProps {
  message: MessageWithUserData;
  roomId: string;
  isSender: boolean;
  onLongPress: () => void;
  onViewReplyClick: (_replyId: string) => void;
  isFocused: boolean;
}

const ChatBubble = (props: ChatBubbleProps) => {
  const { isSender, message, onLongPress, isFocused } = props;

  const bind = useLongPress(() => {
    onLongPress();
  });

  return (
    <div
      {
        // Bind the long press event to the ChatBubble component
        ...bind()
      }
      className={`flex flex-col mx-2 mt-2 ${isSender ? 'items-end' : 'items-start'}`}
      // This is triggered when the user right-clicks on the ChatBubble on desktop
      onContextMenu={e => {
        e.preventDefault();
        onLongPress();
      }}
    >
      <div
        className={`select-none ${message.text ? '' : 'hidden'} ${isFocused ? 'animate-pulse-once' : ''} text-md px-4 py-2 ${message.visibility === MessageVisibility.PUBLIC ? 'bg-primary' : 'bg-gray-500'} text-[#000000] text-opacity-80 rounded-lg shadow-md text-left inline`}
        dangerouslySetInnerHTML={{
          // Highlight the text in the message and render
          __html: highlightText(message.text),
        }}
      ></div>
    </div>
  );
};

export default ChatBubble;
