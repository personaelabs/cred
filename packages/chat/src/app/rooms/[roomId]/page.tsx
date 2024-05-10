'use client';
import useMessages from '@/hooks/useMessages';
import useSendMessage from '@/hooks/useSendMessage';
import useSignedInUser from '@/hooks/useSignedInUser';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import ChatMessage from '@/components/ChatMessage';
import ChatMessageInput from '@/components/ChatMessageInput';
import Avatar from '@/components/Avatar';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import * as logger from '@/lib/logger';

const Room = () => {
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();

  const { data: signedInUser } = useSignedInUser();
  const { mutate: sendMessage } = useSendMessage(params.roomId);
  const { setOptions } = useHeaderOptions();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { messages, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useMessages({
      roomId: params.roomId,
    });

  useEffect(() => {
    setOptions({
      title: searchParams.get('name') || '',
      headerRight: (
        <Avatar
          size={30}
          imageUrl={searchParams.get('imageUrl')}
          alt="profile image"
          name={searchParams.get('name') || ''}
        ></Avatar>
      ),
      showBackButton: true,
    });
  }, [searchParams, setOptions]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching messages', error);
    }
  }, [error]);

  useEffect(() => {
    if (
      messages &&
      messages[messages.length - 1]?.user.id === signedInUser?.fid?.toString()
    ) {
      const element = bottomRef.current;
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, signedInUser?.fid]);

  const onScroll = useCallback(
    (e: any) => {
      const currentScrollTop = e.target.scrollTop;
      if (hasNextPage && !isFetchingNextPage && currentScrollTop === 0) {
        logger.log(`Fetching next page of messages for room ${params.roomId}`);
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, params.roomId]
  );

  const onSendClick = useCallback(
    (_message: string) => {
      sendMessage(_message);
    },
    [sendMessage]
  );

  if (!signedInUser || !messages) {
    return <div className="bg-background h-[100%]"></div>;
  }

  return (
    <div className="h-[100%]">
      <div className="bg-background h-[100%] flex flex-col justify-end">
        <div className="bg-background py-4 overflow-y-auto" onScroll={onScroll}>
          {messages.map((message, i) => (
            <div key={i} ref={i === messages.length - 1 ? bottomRef : null}>
              <ChatMessage
                {...message}
                isSender={message.user.id === signedInUser.fid?.toString()}
                renderAvatar={
                  i === 0 || message.user.id !== messages[i - 1].user.id
                }
              />
            </div>
          ))}
        </div>
        <ChatMessageInput onSend={onSendClick}></ChatMessageInput>
      </div>
    </div>
  );
};

export default Room;
