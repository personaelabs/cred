'use client';
import useMessages from '@/hooks/useMessages';
import useSendMessage from '@/hooks/useSendMessage';
import useSignedInUser from '@/hooks/useSignedInUser';
import {
  MainContainer,
  MessageInput,
  MessageContainer,
  MessageList,
} from '@minchat/react-chat-ui';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const Room = () => {
  const params = useParams<{ roomId: string }>();
  const {
    data: messages,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(params.roomId);
  const { data: signedInUser } = useSignedInUser();
  const { mutate: sendMessage } = useSendMessage(params.roomId);

  useEffect(() => {
    if (error) {
      console.error('Error fetching messages', error);
    }
  }, [error]);

  if (!signedInUser || !messages) {
    return <div className="bg-background h-[100%]"></div>;
  }

  return (
    <MainContainer
      style={{
        height: '100%',
        backgroundColor: '#1e1e1e',
        color: '#fff',
        overflow: 'auto',
      }}
    >
      <MessageContainer>
        <MessageList
          onScrollToTop={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          currentUserId={signedInUser.fid!.toString()}
          messages={messages.pages.flatMap(page => page.messages).reverse()}
          customLoaderComponent={
            <div>
              <Loader2 size={32} />
            </div>
          }
          customEmptyMessagesComponent={<div></div>}
        />
        <MessageInput
          showAttachButton={false}
          mobileView
          showSendButton={true}
          placeholder="Type message here"
          onSendMessage={text => {
            sendMessage(text);
          }}
        />
      </MessageContainer>
    </MainContainer>
  );
};

export default Room;
