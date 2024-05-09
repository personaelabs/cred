import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Firestore, addDoc, collection, updateDoc } from 'firebase/firestore';
import { Room } from '@cred/shared';
import useSignedInUser from './useSignedInUser';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import db from '@/lib/firestore';

const createGroupRoom = async (
  db: Firestore,
  name: string,
  imageUri: string | null,
  creatorFid: number,
  invitedFids: number[]
) => {
  const roomData: Omit<Room, 'id'> = {
    name,
    fids: [creatorFid],
    adminFids: [creatorFid],
    invitedFids: invitedFids.filter(fid => fid !== creatorFid),
    imageUrl: null,
  };
  console.log(`Creating group room ${JSON.stringify(roomData)}`);

  const room = await addDoc(collection(db, 'rooms'), roomData);

  // Upload image to storage
  if (imageUri) {
    const storage = getStorage();
    const imageBlobResult = await fetch(imageUri);
    const imageBlob = await imageBlobResult.blob();
    const storageRef = ref(storage, room.id);
    const uploadResult = await uploadBytes(storageRef, imageBlob);
    const uploadedImageUrl = await getDownloadURL(uploadResult.ref);

    await updateDoc(room, { imageUrl: uploadedImageUrl });
  }

  return room.id;
};

const useCreateGroupRoom = () => {
  const queryClient = useQueryClient();
  const { data: signedInUser } = useSignedInUser();

  return useMutation({
    mutationFn: async ({
      name,
      fids,
      imageUri,
    }: {
      name: string;
      fids: number[];
      imageUri: string | null;
    }) => {
      if (!signedInUser) {
        throw new Error('User not signed in');
      }

      return await createGroupRoom(db, name, imageUri, signedInUser.fid!, fids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export default useCreateGroupRoom;
