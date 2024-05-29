import { useMutation } from '@tanstack/react-query';
import useSignedInUser from './useSignedInUser';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { Message, MessageVisibility, messageConverter } from '@cred/shared';
import db from '@/lib/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import useRoom from './useRoom';

const makeMessagePublic = async ({
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

  await updateDoc(messageRef, {
    visibility: MessageVisibility.PUBLIC,
  });
};

const sendMessage = async ({
  roomId,
  message,
  mentions,
  replyTo,
  senderId,
  imageUris,
  visibility,
}: {
  roomId: string;
  message: string;
  mentions: string[];
  replyTo: string | null;
  senderId: string;
  imageUris: string[];
  visibility: MessageVisibility;
}) => {
  const storage = getStorage();
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
    visibility,
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
};

const useSendMessage = (roomId: string) => {
  const { data: signedInUser } = useSignedInUser();
  const { data: room } = useRoom(roomId);

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

      if (!room) {
        throw new Error('Room not found');
      }

      const isSingedInUserAdmin = room.writerIds.includes(signedInUser.id);
      // If the user is a writer, the message can be public
      const visibility = isSingedInUserAdmin
        ? MessageVisibility.PUBLIC
        : MessageVisibility.ONLY_ADMINS;

      await sendMessage({
        roomId,
        message,
        mentions,
        replyTo,
        senderId: signedInUser.id,
        imageUris,
        visibility,
      });

      // If the user is an admin and the message is a reply, make the replied public
      if (isSingedInUserAdmin && replyTo) {
        await makeMessagePublic({ roomId, messageId: replyTo });
      }
    },
    onSuccess: () => {},
  });
};

export default useSendMessage;
