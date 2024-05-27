'use client';
import useMessages from '@/hooks/useMessages';
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
import { MessageInput, MessageWithUserData, ModalType } from '@/types';
import { Users } from 'lucide-react';
import useUpdateReadTicket from '@/hooks/useUpdateReadTicket';
import { Skeleton } from '@/components/ui/skeleton';
import ClickableBox from '@/components/ClickableBox';
import useDeleteMessage from '@/hooks/useDeleteMessage';
import { canShowModal, isUserAdminInRoom } from '@/lib/utils';
import MessageAsAdminModal from '@/components/MessageAsAdminModal';
import MessageAsBuyerModal from '@/components/MessageAsBuyerModal';

const Room = () => {
  const params = useParams<{ roomId: string }>();

  const { data: signedInUser } = useSignedInUser();
  const {
    mutate: sendMessage,
    isSuccess,
    reset,
    error: sendError,
  } = useSendMessage(params.roomId);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [isMessageAsAdminModalOpen, setIsMessageAsAdminModalOpen] =
    useState(false);
  const [isMessageAsBuyerModalOpen, setIsMessageAsBuyerModalOpen] =
    useState(false);

  const { mutate: updateReadTicket, latestReadMessageCreatedAt } =
    useUpdateReadTicket(params.roomId);

  const { setOptions } = useHeaderOptions();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data: room } = useRoom(params.roomId);
  const [replyTo, setReplyTo] = useState<MessageWithUserData | null>(null);
  const [fromMessage, _setFromMessage] = useState<MessageWithUserData | null>(
    null
  );

  const {
    messages,
    error,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMessages({
    roomId: params.roomId,
    initMessage: fromMessage,
  });

  const { mutateAsync: deleteMessage } = useDeleteMessage(params.roomId);

  useEffect(() => {
    if (signedInUser && room) {
      const isSignedInUserAdmin = isUserAdminInRoom({
        room,
        userId: signedInUser.id,
      });

      if (isSignedInUserAdmin) {
        if (canShowModal(ModalType.REPLY_AS_ADMIN)) {
          setIsMessageAsAdminModalOpen(true);
        }
      } else {
        if (canShowModal(ModalType.MESSAGE_AS_BUYER)) {
          setIsMessageAsBuyerModalOpen(true);
        }
      }
    }
  }, [signedInUser, room]);

  useEffect(() => {
    if (signedInUser) {
      const receivedMessages = messages.filter(
        message => message.user.id !== signedInUser.id
      );

      const latestMessage =
        (receivedMessages &&
          receivedMessages.length > 0 &&
          receivedMessages[receivedMessages.length - 1]) ||
        null;

      if (
        latestMessage &&
        latestMessage.createdAt !== latestReadMessageCreatedAt &&
        signedInUser
      ) {
        updateReadTicket(latestMessage.createdAt);
      }
    }
  }, [messages, latestReadMessageCreatedAt, updateReadTicket, signedInUser]);

  useEffect(() => {
    if (sendError) {
      console.error('Error sending message', sendError);
    }
  }, [sendError]);

  useEffect(() => {
    if (room) {
      setOptions({
        title: room.name,
        description: `${room.joinedUserIds.length} member${room.joinedUserIds.length > 1 ? 's' : ''}`,
        headerRight: (
          <ClickableBox>
            <Link href={`/rooms/${params.roomId}/roomInfo`}>
              <Users className="w-5 h-5"></Users>
            </Link>
          </ClickableBox>
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
    (input: Omit<MessageInput, 'replyTo'>) => {
      sendMessage({ ...input, replyTo: replyTo ? replyTo.id : null });
      setReplyTo(null);
    },
    [replyTo, sendMessage]
  );

  if (!signedInUser || !messages) {
    return <div className="bg-background h-full"></div>;
  }

  return (
    <div className="h-full">
      <div className="bg-background h-full flex flex-col justify-end">
        {isFetchingNextPage ? (
          <div className="space-y-2 w-full flex flex-col items-center mt-2">
            <Skeleton className="h-[30px] px-2 w-[96%]" />
            <Skeleton className="h-[30px] px-2 w-[96%]" />
          </div>
        ) : (
          <></>
        )}
        <div
          className="flex flex-col-reverse bg-background py-4 overflow-auto w-full h-full"
          id="scrollableDiv"
        >
          {!isFetching && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-gray-500">No messages</div>
            </div>
          ) : (
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
              scrollableTarget="scrollableDiv"
              className="h-full"
            >
              {messages.map((message, i) => (
                <div
                  key={message.id}
                  className="w-full"
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
                      inputRef.current?.focus();
                    }}
                    onViewReplyClick={_message => {
                      // setFromMessage(toMessageWithUserData(_message));
                      // const snapshot =  QueryDocumentSnapshot()
                      // setFromMessage(message.id);
                    }}
                    onDeleteClick={messageId => {
                      deleteMessage(messageId);
                    }}
                  />
                </div>
              ))}
            </InfiniteScroll>
          )}
        </div>
        <ChatMessageInput
          inputRef={inputRef}
          roomId={params.roomId}
          replyToText={replyTo ? replyTo.text : undefined}
          onSend={onSendClick}
          onCancelReply={() => {
            setReplyTo(null);
          }}
        ></ChatMessageInput>
      </div>
      <MessageAsAdminModal
        isOpen={isMessageAsAdminModalOpen}
        onClose={() => {
          setIsMessageAsAdminModalOpen(false);
        }}
      ></MessageAsAdminModal>
      <MessageAsBuyerModal
        isOpen={isMessageAsBuyerModalOpen}
        onClose={() => {
          setIsMessageAsBuyerModalOpen(false);
        }}
      ></MessageAsBuyerModal>
    </div>
  );
};

export default Room;
