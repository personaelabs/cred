import {
  QueryDocumentSnapshot,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from 'firebase/firestore';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Message, messageConverter } from '@cred/shared';
import db from '@/lib/firestore';
import MessageType from '@minchat/react-chat-ui/dist/types/MessageType';
import * as logger from '@/lib/logger';

const toMessageType = (message: Message): MessageType => {
  return {
    user: {
      id: message.fid.toString(),
      name: '',
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

/*
const useRealtimeMessages = (roomId: string) => {
  const queryClient = useQueryClient();
  const { data: signedInUser } = useSignedInUser();

  useEffect(() => {
    if (signedInUser) {
      const messagesRef = query(
        collection(db, 'rooms', roomId, 'messages').withConverter(
          messageConverter
        ),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(messagesRef, async snapshot => {
        const addedMessages: MessageType[] = [];
        for (const change of snapshot.docChanges()) {
          const docData = change.doc.data();
          if (change.type === 'added') {
            const message = toMessageType(docData);

            if (!addedMessages.some(m => m.id === message.id)) {
              addedMessages.push(message);
            }
          }
        }

        const messagesInCache = (queryClient.getQueryData([
          'messages',
          { roomId },
        ]) || []) as MessageType[];

        // Combine the new messages with the messages already in the cache.
        const messages = [
          ...addedMessages.filter(
            // Some messages are duplicated in the cache, so we need to check if
            // the message is already in the cache before adding it.
            m => !messagesInCache.some(mInCache => mInCache.id === m.id)
          ),
          ...messagesInCache,
        ];

        queryClient.setQueryData(['messages', { roomId }], messages);
        queryClient.invalidateQueries({ queryKey: ['messages', { roomId }] });
      });

      return () => {
        unsubscribe();
      };
    }
  }, [roomId, signedInUser, queryClient]);
};
*/

const useMessages = (roomId: string) => {
  // Start listening for new messages after the first fetch

  // useRealtimeMessages(roomId);

  return useInfiniteQuery({
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
};

export default useMessages;
