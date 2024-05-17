import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
} from 'firebase/firestore';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Message, messageConverter } from '@cred/shared';
import db from '@/lib/firestore';
import { useEffect, useState } from 'react';
import useSignedInUser from './useSignedInUser';
import { ChatMessage } from '@/types';
import useUsers from './useUsers';

export const toMessageType = (message: Message): ChatMessage => {
  return {
    user: {
      id: message.userId.toString(),
      name: '',
      avatarUrl: '',
    },
    id: message.id,
    text: message.body,
    createdAt: (message.createdAt || new Date()) as Date,
    replyToId: message.replyTo,
  };
};

const PAGE_SIZE = 20;
const getMessages = async (roomId: string, lastMessage: ChatMessage | null) => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages').withConverter(
    messageConverter
  );

  const q = lastMessage
    ? query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastMessage.createdAt),
        limit(PAGE_SIZE)
      )
    : query(messagesRef, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

  const docs = (await getDocs(q)).docs;
  const messages = docs.map(doc => toMessageType(doc.data()));

  return messages;
};

const useListenToMessages = ({ roomId }: { roomId: string }) => {
  const queryClient = useQueryClient();
  const { data: signedInUser } = useSignedInUser();
  const [newMessages, setNewMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (signedInUser) {
      const messagesRef = query(
        collection(db, 'rooms', roomId, 'messages').withConverter(
          messageConverter
        ),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(messagesRef, async snapshot => {
        for (const change of snapshot.docChanges()) {
          const docData = change.doc.data();
          if (change.type === 'added') {
            const message = toMessageType(docData);
            setNewMessages(prev => [...prev, message]);
          }
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [roomId, signedInUser, queryClient]);

  return { newMessages };
};

const useMessages = ({
  roomId,
  initMessage,
}: {
  roomId: string;
  initMessage: ChatMessage | null;
}) => {
  // Start listening for new messages after the first fetch
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);

  const { newMessages } = useListenToMessages({
    roomId,
  });

  const result = useInfiniteQuery({
    queryKey: ['messages', { roomId }],
    queryFn: async ({ pageParam }: { pageParam: ChatMessage | null }) => {
      const messages = await getMessages(roomId, pageParam);
      return messages;
    },
    initialPageParam: initMessage,
    getNextPageParam: (lastPage, _) => lastPage[lastPage.length - 1],
    // staleTime: Infinity,
  });

  // Merge new messages with the existing messages
  useEffect(() => {
    const fetchedMessages = result.data?.pages.flat().reverse() || [];

    const _allMessages = newMessages
      ? [...fetchedMessages, ...newMessages]
      : fetchedMessages;

    setAllMessages(
      _allMessages.filter(
        (msg, index, self) => index === self.findIndex(t => t.id === msg.id)
      )
    );
  }, [result.data, newMessages]);

  // Get user images
  const usersQueryResult = useUsers(allMessages.map(m => m.user.id));

  // Merge user data with messages
  const messagesWithUserData = allMessages.map(msg => {
    const user = usersQueryResult.data?.find(
      u => u?.id?.toString() === msg.user.id
    );

    return {
      ...msg,
      user: {
        ...msg.user,
        name: user?.displayName || '',
        avatarUrl: user?.pfpUrl || '',
      },
    };
  });

  return { ...result, messages: messagesWithUserData };
};

export default useMessages;
