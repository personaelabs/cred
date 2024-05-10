'use client';
import useMessages from '@/hooks/useMessages';
import useSendMessage from '@/hooks/useSendMessage';
import useSignedInUser from '@/hooks/useSignedInUser';
import { useParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import ChatMessage from '@/components/ChatMessage';
import ChatMessageInput from '@/components/ChatMessageInput';
import Avatar from '@/components/Avatar';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import * as logger from '@/lib/logger';
import Link from 'next/link';
import useRoom from '@/hooks/useRoom';
import InfiniteScroll from 'react-infinite-scroll-component';

const Room = () => {
  const params = useParams<{ roomId: string }>();

  const { data: signedInUser } = useSignedInUser();
  const { mutate: sendMessage } = useSendMessage(params.roomId);
  const { setOptions } = useHeaderOptions();

  const { data: room } = useRoom(params.roomId);

  const { messages, error, hasNextPage, fetchNextPage } = useMessages({
    roomId: params.roomId,
  });

  useEffect(() => {
    if (room) {
      setOptions({
        title: room.name,
        headerRight: (
          <Link href={`/rooms/${params.roomId}/roomInfo`}>
            <Avatar
              size={30}
              imageUrl={room.imageUrl}
              alt="profile image"
              name={room.name}
            ></Avatar>
          </Link>
        ),
        showBackButton: true,
      });
    }
  }, [params.roomId, room, setOptions]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching messages', error);
    }
  }, [error]);

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
        <div
          className="flex flex-col-reverse bg-background py-4 overflow-auto w-[100%] h-[100%]"
          id="scrollableDiv"
        >
          <InfiniteScroll
            loader={<></>}
            endMessage={<></>}
            dataLength={messages.length}
            hasMore={hasNextPage}
            inverse={true}
            next={() => {
              console.log('next');
              logger.log('next');
              fetchNextPage();
            }}
            scrollThreshold={0.5}
            scrollableTarget="scrollableDiv"
          >
            {messages.map((message, i) => (
              <div key={message.id} className="w-[100%]">
                <ChatMessage
                  {...message}
                  isSender={message.user.id === signedInUser.fid?.toString()}
                  renderAvatar={
                    i === 0 || message.user.id !== messages[i - 1].user.id
                  }
                />
              </div>
            ))}
          </InfiniteScroll>
        </div>
        <ChatMessageInput onSend={onSendClick}></ChatMessageInput>
      </div>
    </div>
  );
};

export default Room;
