'use client';
import useMessages from '@/hooks/useMessages';
import useSendMessage from '@/hooks/useSendMessage';
import useSignedInUser from '@/hooks/useSignedInUser';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import ChatMessage from '@/components/ChatMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessageInput from '@/components/ChatMessageInput';
import MobileHeader2 from '@/components/MobileHeader2';

const Room = () => {
  const params = useParams<{ roomId: string }>();
  const { messages, error, hasNextPage, isFetchingNextPage } = useMessages(
    params.roomId
  );
  const { data: signedInUser } = useSignedInUser();
  const { mutate: sendMessage } = useSendMessage(params.roomId);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (error) {
      console.error('Error fetching messages', error);
    }
  }, [error]);

  useEffect(() => {
    const element = bottomRef.current;
    element?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onSendClick = useCallback(
    (_message: string) => {
      sendMessage(_message);
    },
    [sendMessage]
  );

  const onScroll = useCallback(
    (event: any) => {
      console.log('onScroll');
      if (hasNextPage && !isFetchingNextPage) {
        const isAtTop = event.currentTarget.scrollTop === 0;
        console.log(event.currentTarget, isAtTop);
        //    fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage]
  );

  if (!signedInUser || !messages) {
    return <div className="bg-background h-[100%]"></div>;
  }

  return (
    <div className="h-[100%]">
      <MobileHeader2 title="Chat"></MobileHeader2>
      <div className="bg-background h-[100%] flex flex-col justify-end">
        <div>
          <ScrollArea
            className="bg-background py-4"
            onScroll={onScroll}
            onScrollCapture={onScroll}
          >
            {messages.map((message, i) => (
              <div
                // key={message.id}
                key={i}
                ref={i === messages.length - 1 ? bottomRef : null}
              >
                <ChatMessage
                  {...message}
                  isSender={message.user.id === signedInUser.fid?.toString()}
                  renderAvatar={
                    i === 0 || message.user.id !== messages[i - 1].user.id
                  }
                />
              </div>
            ))}
          </ScrollArea>
          <ChatMessageInput onSend={onSendClick}></ChatMessageInput>
        </div>
      </div>
    </div>
  );
};

export default Room;
