import db from '@/lib/firestore';
import { roomReadTicketConverter } from '@cred/shared';
import { useQuery } from '@tanstack/react-query';
import { collection, doc, getDoc } from 'firebase/firestore';
import useSignedInUser from './useSignedInUser';

export const getReadTicket = async ({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) => {
  const readTicketsRef = collection(
    db,
    'rooms',
    roomId,
    'readTickets'
  ).withConverter(roomReadTicketConverter);

  const readTicketRef = doc(readTicketsRef, userId);
  const readTicket = await getDoc(readTicketRef);

  return readTicket.data() || null;
};

const useReadTicket = (roomId: string) => {
  const { data: signedInUser } = useSignedInUser();

  return useQuery({
    queryKey: ['read-ticket', { roomId }],
    queryFn: async () => {
      if (!signedInUser) {
        throw new Error('User not signed in');
      }

      return await getReadTicket({
        roomId,
        userId: signedInUser.id,
      });
    },
    enabled: !!signedInUser,
  });
};

export default useReadTicket;
