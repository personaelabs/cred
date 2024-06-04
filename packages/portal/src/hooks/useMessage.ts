import { collection, doc, getDoc } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { messageConverter } from '@cred/shared';
import db from '@/lib/firestore';

const getMessage = async ({
  roomId,
  messageId,
}: {
  roomId: string;
  messageId: string;
}) => {
  const messageRef = doc(
    collection(db, 'rooms', roomId, 'messages').withConverter(messageConverter),
    messageId
  );

  const message = (await getDoc(messageRef)).data();

  return message;
};

const useMessage = ({
  roomId,
  messageId,
}: {
  roomId: string;
  messageId: string | null;
}) => {
  return useQuery({
    queryKey: ['message', { roomId, messageId }],
    queryFn: async () => {
      if (messageId) {
        return getMessage({ roomId, messageId });
      }
    },
    enabled: !!roomId && !!messageId,
  });
};

export default useMessage;
