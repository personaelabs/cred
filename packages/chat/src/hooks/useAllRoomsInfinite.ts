import db from '@/lib/firestore';
import { Room, roomConverter } from '@cred/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from 'firebase/firestore';

const PAGE_SIZE = 10;

const getRooms = async (lastVisible: Room | null) => {
  const roomsRef = collection(db, 'rooms').withConverter(roomConverter);
  console.log('lastVisible', lastVisible);
  const q = lastVisible
    ? query(
        roomsRef,
        orderBy('id'),
        startAfter(lastVisible.id),
        limit(PAGE_SIZE)
      )
    : query(roomsRef, limit(PAGE_SIZE));

  const docs = await getDocs(q);
  return docs.docs.map(doc => doc.data());
};

const useAllRooms = () => {
  return useInfiniteQuery({
    queryKey: ['all-rooms-2'],
    queryFn: async ({ pageParam }: { pageParam: Room | null }) => {
      const allRooms = await getRooms(pageParam);

      return allRooms;
    },
    initialPageParam: null,
    getNextPageParam: lastPage => {
      return lastPage[lastPage.length - 1];
    },
  });
};

export default useAllRooms;
