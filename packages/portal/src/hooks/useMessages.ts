import { getDocs, onSnapshot } from 'firebase/firestore';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Message } from '@cred/shared';
import { useEffect, useState } from 'react';
import useSignedInUser from './useSignedInUser';
import { MessageWithUserData } from '@/types';
import useRoom from './useRoom';
import { buildMessageQuery } from '@/lib/utils';
import useUsers from './useUsers';

export const toMessageWithUserData = (
  message: Message
): MessageWithUserData => {
  return {
    user: {
      id: message.userId.toString(),
      name: '',
      avatarUrl: '',
    },
    id: message.id,
    text: message.body,
    createdAt: new Date((message.createdAt || new Date()) as Date),
    replyToId: message.replyTo,
    images: message.images,
    visibility: message.visibility,
    reactions: message.reactions,
  };
};

const PAGE_SIZE = 20;
const getMessages = async ({
  isSingedInUserAdmin,
  signedInUserId,
  roomId,
  lastMessage,
}: {
  isSingedInUserAdmin: boolean;
  signedInUserId: string;
  roomId: string;
  lastMessage: MessageWithUserData | null;
}) => {
  const q = buildMessageQuery({
    isAdminView: isSingedInUserAdmin,
    viewerId: signedInUserId,
    roomId,
    pageSize: PAGE_SIZE,
    from: lastMessage?.createdAt ? new Date(lastMessage.createdAt) : undefined,
  });

  const docs = (await getDocs(q)).docs;
  const messages = docs.map(doc => toMessageWithUserData(doc.data()));

  return messages;
};

const useListenToMessages = ({
  roomId,
  isSingedInUserAdmin,
  signedInUserId,
  enabled,
}: {
  roomId: string;
  isSingedInUserAdmin: boolean;
  signedInUserId: string | null;
  enabled: boolean;
}) => {
  const queryClient = useQueryClient();
  const [newMessages, setNewMessages] = useState<MessageWithUserData[]>([]);
  const [removedMessages, setRemovedMessages] = useState<string[]>([]);
  const [updatedMessages, setUpdatedMessages] = useState<MessageWithUserData[]>(
    []
  );

  useEffect(() => {
    if (signedInUserId && enabled) {
      const q = buildMessageQuery({
        isAdminView: isSingedInUserAdmin,
        viewerId: signedInUserId,
        roomId,
        pageSize: 10,
      });

      const unsubscribe = onSnapshot(
        q,
        async snapshot => {
          for (const change of snapshot.docChanges()) {
            const docData = change.doc.data();
            if (change.type === 'added') {
              const message = toMessageWithUserData(docData);
              setNewMessages(prev => [...prev, message]);
            } else if (change.type === 'removed') {
              setRemovedMessages(prev => [...prev, docData.id]);
            } else if (change.type === 'modified') {
              const message = toMessageWithUserData(docData);
              setUpdatedMessages(prev => [
                ...prev.filter(m => m.id !== message.id),
                message,
              ]);
            }
          }
        },
        err => {
          console.error(err);
        }
      );
      return () => {
        unsubscribe();
      };
    }
  }, [roomId, queryClient, isSingedInUserAdmin, signedInUserId, enabled]);

  return { newMessages, removedMessages, updatedMessages };
};

const useMessages = ({ roomId }: { roomId: string }) => {
  const { data: signedInUser } = useSignedInUser();
  const { data: room } = useRoom(roomId);

  const isSingedInUserAdmin =
    signedInUser && room ? room.writerIds.includes(signedInUser.id) : false;

  const result = useInfiniteQuery({
    queryKey: ['messages', { roomId }],
    queryFn: async ({
      pageParam,
    }: {
      pageParam: MessageWithUserData | null;
    }) => {
      const messages = await getMessages({
        signedInUserId: signedInUser!.id,
        roomId,
        lastMessage: pageParam,
        isSingedInUserAdmin,
      });

      return messages;
    },
    initialPageParam: null,
    enabled: !!signedInUser && !!room,
    getNextPageParam: (lastPage, _) => lastPage[lastPage.length - 1],
  });

  const { newMessages, removedMessages, updatedMessages } = useListenToMessages(
    {
      roomId,
      isSingedInUserAdmin,
      signedInUserId: signedInUser?.id || null,
      enabled: !!result.data,
    }
  );

  // Merge the new messages to the existing messages
  const fetchedMessages = result.data?.pages.flat() || [];

  const _allMessages = newMessages
    ? [...fetchedMessages, ...newMessages]
    : fetchedMessages;

  const messages = _allMessages
    // Remove duplicates
    .filter(
      (msg, index, self) => index === self.findIndex(t => t.id === msg.id)
    )
    // Remove deleted messages
    .filter(msg => !removedMessages.includes(msg.id))
    // Update edited messages
    .map(msg => updatedMessages.find(m => m.id === msg.id) || msg)
    // Sort by createdAt
    .sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  // Get user images
  const usersQueryResult = useUsers(messages.map(m => m.user.id));

  // Merge user data with messages
  const messagesWithUserData = messages.map(msg => {
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
