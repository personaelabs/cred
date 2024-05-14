'use client';
import useMessages, { toMessageType } from '@/hooks/useMessages';
import useSendMessage from '@/hooks/useSendMessage';
import useSignedInUser from '@/hooks/useSignedInUser';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import ChatMessage from '@/components/ChatMessage';
import ChatMessageInput from '@/components/ChatMessageInput';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import * as logger from '@/lib/logger';
import Link from 'next/link';
import useRoom from '@/hooks/useRoom';
import InfiniteScroll from 'react-infinite-scroll-component';
import { type ChatMessage as IChatMessage } from '@/types';
import { Users } from 'lucide-react';

const Room = () => {
  const params = useParams<{ roomId: string }>();

  const { data: signedInUser } = useSignedInUser();
  const {
    mutate: sendMessage,
    isSuccess,
    reset,
    error: sendError,
  } = useSendMessage(params.roomId);
  const { setOptions } = useHeaderOptions();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data: room } = useRoom(params.roomId);
  const [replyTo, setReplyTo] = useState<IChatMessage | null>(null);
  const [fromMessage, setFromMessage] = useState<IChatMessage | null>(null);

  const { messages, error, hasNextPage, fetchNextPage } = useMessages({
    roomId: params.roomId,
    initMessage: fromMessage,
  });

  useEffect(() => {
    if (sendError) {
      console.error('Error sending message', sendError);
    }
  }, [sendError]);

  useEffect(() => {
    if (room) {
      setOptions({
        title: room.name,
        headerRight: (
          <Link href={`/rooms/${params.roomId}/roomInfo`}>
            <Users className="w-5 h-5"></Users>
          </Link>
        ),
        showBackButton: true,
        backTo: '/rooms',
      });
    }
  }, [params.roomId, room, setOptions]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching messages', error);
    }
  }, [error]);

  useEffect(() => {
    if (isSuccess) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      reset();
    }
  }, [isSuccess, reset]);

  const onSendClick = useCallback(
    (_message: string) => {
      sendMessage({
        message: _message,
        replyTo: replyTo ? replyTo.id : null,
      });
      setReplyTo(null);
    },
    [replyTo, sendMessage]
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
            className="h-full"
          >
            {messages.map((message, i) => (
              <div
                key={message.id}
                className="w-[100%]"
                ref={i === messages.length - 1 ? bottomRef : null}
              >
                <ChatMessage
                  roomId={params.roomId}
                  {...message}
                  isSender={message.user.id === signedInUser.id.toString()}
                  renderAvatar={
                    i === 0 || message.user.id !== messages[i - 1].user.id
                  }
                  onReplySelect={message => {
                    setReplyTo(message);
                  }}
                  onViewReplyClick={_message => {
                    setFromMessage(toMessageType(_message));
                    // const snapshot =  QueryDocumentSnapshot()
                    // setFromMessage(message.id);
                  }}
                />
              </div>
            ))}
          </InfiniteScroll>
        </div>
        <ChatMessageInput
          replyTo={replyTo ? replyTo.text : undefined}
          onSend={onSendClick}
          onCancelReply={() => {
            setReplyTo(null);
          }}
        ></ChatMessageInput>
      </div>
    </div>
  );
};

export default Room;
