/* eslint-disable @next/next/no-img-element */

import { type ChatMessage } from '@/types';

type ChatMessageProps = ChatMessage & {
  isSender: boolean;
  renderAvatar: boolean;
};

const ChatMessage = (props: ChatMessageProps) => {
  const { isSender } = props;

  // Send reply to chat

  return (
    <div
      className={`flex items-end ${isSender ? 'flex-row-reverse' : 'flex-row'} mt-2`}
    >
      {!isSender ? (
        <img
          src={props.user.avatarUrl}
          alt="profile image"
          className="w-[40px] h-[40px] rounded-full object-cover"
        ></img>
      ) : (
        <></>
      )}
      <div className="max-w-[70%]">
        <div className="mx-2 text-md px-4 py-2 bg-[#FDA174] text-[#000000] text-opacity-80 rounded-lg shadow-md w-max">
          {props.text}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
