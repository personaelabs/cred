'use client';
import AvatarWithFallback from '@/components/AvatarWithFallback';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useRoom from '@/hooks/useRoom';
import useSellPrice from '@/hooks/useSellPrice';
import useSignedInUser from '@/hooks/useSignedInUser';
import useUsers from '@/hooks/useUsers';
import { formatEthBalance } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useSellKey from '@/hooks/useSellKey';
import { KeyRound } from 'lucide-react';
import useKeyBalance from '@/hooks/useKeyBalance';
import { User, getRoomTokenId } from '@cred/shared';
import { Hex } from 'viem';
import Scrollable from '@/components/Scrollable';

const RoomUserListItem = ({ user }: { user: User }) => {
  return (
    <div className="flex items-center px-5 py-2 mt-1 border-b-2">
      <AvatarWithFallback
        imageUrl={user!.pfpUrl}
        alt="profile image"
        name={user!.displayName}
        size={40}
      ></AvatarWithFallback>
      <div className="ml-4 w-[160px]">{user!.displayName}</div>
    </div>
  );
};

const RoomInfo = () => {
  const params = useParams<{ roomId: string }>();

  const { data: room } = useRoom(params.roomId);
  const router = useRouter();
  const { setOptions } = useHeaderOptions();
  const { data: signedInUser } = useSignedInUser();
  const { data: keySellPrice } = useSellPrice(params.roomId);
  const { mutateAsync: sellKey } = useSellKey(params.roomId);
  const { data: keyBalance } = useKeyBalance({
    address: (signedInUser?.wallet?.address as Hex) || null,
    tokenId: getRoomTokenId(params.roomId),
  });

  useEffect(() => {
    if (room) {
      setOptions({
        title: room.name,
        showBackButton: true,
      });
    }
  }, [room, setOptions, router, params.roomId, signedInUser]);

  const roomUsersResult = useUsers(room?.joinedUserIds || []);

  if (!room) {
    return <></>;
  }

  const credddHolders = roomUsersResult?.data.filter(user =>
    room.writerIds.includes(user.id)
  );
  const purchasers = roomUsersResult?.data.filter(
    user =>
      room.readerIds.includes(user.id) && !room.writerIds.includes(user.id)
  );

  return (
    <Scrollable>
      <div className="flex flex-col items-center py-5 h-full w-full overflow-auto">
        <div className="text-xl mt-4 px-4">{room.name}</div>
        <div className="flex flex-col items-center mt-2">
          <div>
            <span className="text-blue-500">Key sell price</span>
            <span className="ml-2 opacity-60">
              {keySellPrice !== undefined ? formatEthBalance(keySellPrice) : ''}{' '}
              ETH
            </span>
          </div>
          {keyBalance && keyBalance > BigInt(0) ? (
            <div className="mt-1">
              <Button
                className="mt-4 text-blue-500"
                variant="secondary"
                onClick={async () => {
                  await sellKey();
                  router.replace(`/chats`);
                }}
              >
                <KeyRound className="mr-2 w-3 h-3"></KeyRound>
                Sell key
              </Button>
            </div>
          ) : (
            <></>
          )}
        </div>
        <div className="mt-8">
          {credddHolders.length > 0 ? (
            <div className="text-center text-gray-400">credddd holders</div>
          ) : (
            <></>
          )}
          <div className="mt-2">
            {credddHolders.map(user => {
              return (
                <div key={user!.id}>
                  <RoomUserListItem user={user}></RoomUserListItem>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-8">
          {purchasers.length ? (
            <div className="text-center text-gray-400">Purchasers</div>
          ) : (
            <></>
          )}
          <div className="mt-2">
            {purchasers.map(user => {
              return (
                <div key={user!.id}>
                  <RoomUserListItem user={user}></RoomUserListItem>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Scrollable>
  );
};

export default RoomInfo;
