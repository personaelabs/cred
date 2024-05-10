import {
  QueryDocumentSnapshot,
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
import * as logger from '@/lib/logger';
import { useEffect, useState } from 'react';
import useSignedInUser from './useSignedInUser';
import { ChatMessage } from '@/types';
import useUsers from './useUsers';

const toMessageType = (message: Message): ChatMessage => {
  return {
    user: {
      id: message.fid.toString(),
      name: '',
      avatarUrl: '',
    },
    id: message.id,
    text: message.body,
    createdAt: (message.createdAt || new Date()) as Date,
  };
};

const getMessages = async (
  roomId: string,
  lastDoc: QueryDocumentSnapshot | null
) => {
  logger.log(`Getting messages for room ${roomId} from ${lastDoc?.id}`);
  const messagesRef = collection(db, 'rooms', roomId, 'messages').withConverter(
    messageConverter
  );

  const q = lastDoc
    ? query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(10)
      )
    : query(messagesRef, orderBy('createdAt', 'desc'), limit(10));

  const docs = (await getDocs(q)).docs;
  console.log(`Got ${docs.length} messages`);
  const messages = docs.map(doc => toMessageType(doc.data()));

  return { messages, lastDoc: docs[messages.length - 1] || null };
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
            setNewMessages(prev => [message, ...prev]);
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

const useMessages = ({ roomId }: { roomId: string }) => {
  // Start listening for new messages after the first fetch
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);

  const { newMessages } = useListenToMessages({
    roomId,
  });

  const result = useInfiniteQuery({
    queryKey: ['messages', { roomId }],
    queryFn: async ({
      pageParam,
    }: {
      pageParam: QueryDocumentSnapshot | null;
    }) => {
      const messages = await getMessages(roomId, pageParam);
      return messages;
    },
    initialPageParam: null,
    getNextPageParam: ({ lastDoc }, _) => lastDoc,
    // staleTime: Infinity,
  });

  // Merge new messages with the existing messages
  useEffect(() => {
    const fetchedMessages = result.data?.pages.flatMap(p => p.messages) || [];

    const _allMessages = newMessages
      ? [...fetchedMessages, ...newMessages]
      : fetchedMessages;

    setAllMessages(
      _allMessages
        .filter(
          (msg, index, self) => index === self.findIndex(t => t.id === msg.id)
        )
        .sort(
          (a, b) =>
            (a.createdAt as Date).getTime() - (b.createdAt as Date).getTime()
        )
    );
  }, [result.data, newMessages]);

  // Get user images
  const usersQueryResult = useUsers(allMessages.map(m => m.user.id));

  // Merge user data with messages
  const messagesWithUserData = allMessages.map(msg => {
    const user = usersQueryResult.find(
      u => u.data?.fid.toString() === msg.user.id
    );
    return {
      ...msg,
      user: {
        ...msg.user,
        name: user?.data?.displayName || '',
        avatarUrl: user?.data?.pfpUrl || '',
      },
    };
  });

  return { ...result, messages: messagesWithUserData };
};

export default useMessages;
