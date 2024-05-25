import { useMutation, useQueryClient } from '@tanstack/react-query';
import useSignedInUser from './useSignedInUser';
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { Message, messageConverter } from '@cred/shared';
import db from '@/lib/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { getRoomLatestMessage } from './useRoomLatestMessage';

const sendMessage = async ({
  roomId,
  message,
  mentions,
  replyTo,
  senderId,
  imageUris,
}: {
  roomId: string;
  message: string;
  mentions: string[];
  replyTo: string | null;
  senderId: string;
  imageUris: string[];
}) => {
  const storage = getStorage();
  console.log(`Sending message ${message} to ${roomId}`);
  // Create the room if it doens't exit

  const messagesRef = collection(db, 'rooms', roomId, 'messages').withConverter(
    messageConverter
  );

  const data: Omit<Message, 'id'> = {
    roomId,
    body: message,
    mentions,
    userId: senderId,
    createdAt: serverTimestamp(),
    readBy: [],
    replyTo,
    images: [],
  };
  const messageDoc = await addDoc(messagesRef, data);

  const uploadImagesPromise = Promise.all(
    imageUris.map(async imageUri => {
      const imageBlobResult = await fetch(imageUri);
      const imageBlob = await imageBlobResult.blob();
      const storageRef = ref(storage, `/users/${senderId}/${uuidv4()}`);
      const uploadResult = await uploadBytes(storageRef, imageBlob);
      const uploadedImageUrl = await getDownloadURL(uploadResult.ref);
      return uploadedImageUrl;
    })
  );

  if (imageUris.length > 0) {
    toast.promise(uploadImagesPromise, {
      loading: 'Sending images...',
      error: 'Failed to send images',
    });
  }

  await updateDoc(messageDoc, {
    images: await uploadImagesPromise,
  });

  console.log(`Message sent to ${roomId}`);
};

const useSendMessage = (roomId: string) => {
  const { data: signedInUser } = useSignedInUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sendMessage', { roomId }],
    mutationFn: async ({
      replyTo,
      message,
      mentions,
      imageUris,
    }: {
      replyTo: string | null;
      message: string;
      mentions: string[];
      imageUris: string[];
    }) => {
      if (!signedInUser) {
        throw new Error('User not signed in');
      }

      await sendMessage({
        roomId,
        message,
        mentions,
        replyTo,
        senderId: signedInUser.id,
        imageUris,
      });
    },
    onSuccess: () => {
      queryClient.prefetchQuery({
        queryKey: ['latest-message', { roomId }],
        queryFn: async () => {
          return await getRoomLatestMessage(roomId);
        },
      });
    },
  });
};

export default useSendMessage;
