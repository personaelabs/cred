'use client';
import useMessages, { PAGE_SIZE } from '@/hooks/useMessages';
import useSendMessage from '@/hooks/useSendMessage';
import useSignedInUser from '@/hooks/useSignedInUser';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import ChatMessage from '@/components/ChatMessage/ChatMessage';
import ChatMessageInput from '@/components/ChatMessageInput';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import Link from 'next/link';
import useRoom from '@/hooks/useRoom';
import InfiniteScroll from 'react-infinite-scroll-component';
import { MessageInput, MessageWithUserData } from '@/types';
import { ChevronDown, Users } from 'lucide-react';
import useUpdateReadTicket from '@/hooks/useUpdateReadTicket';
import { Skeleton } from '@/components/ui/skeleton';
import ClickableBox from '@/components/ClickableBox';
import useDeleteMessage from '@/hooks/useDeleteMessage';
import useSendMessageReaction from '@/hooks/useSendMessageReaction';
import PinnedMessage from '@/components/PinnedMessage';
import { toast } from 'sonner';

/**
 * Chat room page
 */
const Chat = () => {
  const [showBackToBottomButton, setShowBackToBottomButton] = useState(false);
  const params = useParams<{ roomId: string }>();

  const chatMessageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(
    null
  );

  // Function to scroll to a specific index
  const scrollToMessage = useCallback((messageId: string) => {
    const messageRef = chatMessageRefs.current.get(messageId);
    if (messageRef) {
      messageRef.scrollIntoView({ behavior: 'smooth' });
      setScrollToMessageId(messageId);
    }
  }, []);

  const { data: signedInUser } = useSignedInUser();
  const { mutateAsync: sendMessage, reset: resetSendMessageState } =
    useSendMessage(params.roomId);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const { mutate: updateReadTicket, latestReadMessageCreatedAt } =
    useUpdateReadTicket(params.roomId);

  const { setOptions } = useHeaderOptions();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data: room } = useRoom(params.roomId);
  const [replyTo, setReplyTo] = useState<MessageWithUserData | null>(null);

  const {
    messages,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMessages({
    roomId: params.roomId,
  });

  const { mutateAsync: deleteMessage } = useDeleteMessage(params.roomId);

  const { mutateAsync: sendMessageReaction } = useSendMessageReaction();

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
    if (room) {
      setOptions({
        title: room.name,
        description: `${room.joinedUserIds.length} member${room.joinedUserIds.length > 1 ? 's' : ''}`,
        headerRight: (
          <ClickableBox>
            <Link href={`/portals/${params.roomId}/about`}>
              <Users className="w-5 h-5"></Users>
            </Link>
          </ClickableBox>
        ),
        showBackButton: true,
        backTo: '/',
      });
    }
  }, [params.roomId, room, setOptions]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const onSendClick = useCallback(
    async (input: Omit<MessageInput, 'replyTo'>) => {
      await sendMessage({ ...input, replyTo: replyTo ? replyTo.id : null });
      setReplyTo(null);

      scrollToBottom();

      resetSendMessageState();
    },
    [replyTo, resetSendMessageState, scrollToBottom, sendMessage]
  );

  const resetFocusedMessage = useCallback(() => {
    setScrollToMessageId(null);
  }, []);

  const isPortalClosed = room?.isOpenUntil
    ? room.isOpenUntil < new Date()
    : false;

  if (!signedInUser || !messages) {
    return <div className="bg-background h-full"></div>;
  }

  const isReadOnly = !room?.writerIds.includes(signedInUser?.id || '');

  return (
    <div className="relative h-full">
      <div className="bg-background h-full flex flex-col justify-end">
        {room?.pinnedMessage ? (
          <PinnedMessage message={room?.pinnedMessage || ''}></PinnedMessage>
        ) : (
          <></>
        )}
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
          onScroll={e => {
            if (e.currentTarget.scrollTop < -700 && !showBackToBottomButton) {
              setShowBackToBottomButton(true);
            } else if (
              e.currentTarget.scrollTop >= -700 &&
              showBackToBottomButton
            ) {
              setShowBackToBottomButton(false);
            }
          }}
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
                fetchNextPage();
              }}
              scrollableTarget="scrollableDiv"
              className="h-full"
            >
              {messages.map((message, i) => (
                <div
                  key={message.id}
                  className="w-full"
                  ref={el => {
                    if (el) {
                      chatMessageRefs.current.set(message.id, el);
                    }
                    if (i === messages.length - 1) {
                      // bottomRef.current = el;
                    }
                  }}
                >
                  <ChatMessage
                    isReadOnly={isPortalClosed}
                    message={message}
                    roomId={params.roomId}
                    isFocused={scrollToMessageId === message.id}
                    resetFocus={resetFocusedMessage}
                    {...message}
                    isSender={message.user.id === signedInUser.id.toString()}
                    onReplySelect={message => {
                      const index = messages.length - i;
                      if (index > PAGE_SIZE) {
                        toast.warning(
                          `You can only reply to the last ${PAGE_SIZE} messages`
                        );
                      } else {
                        setReplyTo(message);
                        inputRef.current?.focus();
                      }
                    }}
                    onViewReplyClick={messageId => {
                      scrollToMessage(messageId);
                    }}
                    onDeleteClick={messageId => {
                      deleteMessage(messageId);
                    }}
                    onReactionClick={reaction => {
                      sendMessageReaction({
                        roomId: params.roomId,
                        messageId: message.id,
                        reaction,
                      });
                    }}
                  />
                </div>
              ))}
              <div ref={bottomRef}></div>
            </InfiniteScroll>
          )}
        </div>
        <div className="mb-[6px]">
          {isPortalClosed || isReadOnly ? (
            <></>
          ) : (
            <ChatMessageInput
              inputRef={inputRef}
              roomId={params.roomId}
              replyToText={replyTo ? replyTo.text : undefined}
              onSend={onSendClick}
              onCancelReply={() => {
                setReplyTo(null);
              }}
            ></ChatMessageInput>
          )}
        </div>
      </div>
      {showBackToBottomButton && (
        <div
          className="absolute p-1 right-[10px] bottom-20 rounded-full border-2 border-white bg-secondary"
          onClick={scrollToBottom}
        >
          <ChevronDown />
        </div>
      )}
    </div>
  );
};

export default Chat;
