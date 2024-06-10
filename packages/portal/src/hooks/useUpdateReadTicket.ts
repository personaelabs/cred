import db from '@/lib/firestore';
import { RoomReadTicket, roomReadTicketConverter } from '@cred/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, doc, setDoc } from 'firebase/firestore';
import useSignedInUser from './useSignedInUser';
import { useState } from 'react';
import messageKeys from '@/queryKeys/messageKeys';

const updateReadTicket = async ({
  roomId,
  userId,
  latestReadMessageCreatedAt,
}: {
  roomId: string;
  userId: string;
  latestReadMessageCreatedAt: Date;
}) => {
  const readTicketsRef = collection(
    db,
    'rooms',
    roomId,
    'readTickets'
  ).withConverter(roomReadTicketConverter);

  const readTicketRef = doc(readTicketsRef, userId);

  const data: RoomReadTicket = {
    userId,
    latestReadMessageCreatedAt,
  };

  await setDoc(readTicketRef, data);
  return data;
};

const useUpdateReadTicket = (roomId: string) => {
  const { data: signedInUser } = useSignedInUser();
  const [latestReadMessageCreatedAt, setLatestReadMessageCreatedAt] =
    useState<Date | null>(null);
  const queryClient = useQueryClient();

  const result = useMutation({
    mutationFn: async (latestReadMessageCreatedAt: Date) => {
      if (!signedInUser) {
        throw new Error('User not signed in');
      }

      setLatestReadMessageCreatedAt(latestReadMessageCreatedAt);

      const updatedData = await updateReadTicket({
        roomId,
        userId: signedInUser.id,
        latestReadMessageCreatedAt,
      });

      await queryClient.setQueryData(
        messageKeys.readTicket(roomId),
        updatedData
      );
    },
    onSuccess: () => {
      if (!signedInUser) {
        throw new Error('User not signed in');
      }
    },
  });

  return {
    ...result,
    latestReadMessageCreatedAt,
  };
};

export default useUpdateReadTicket;
