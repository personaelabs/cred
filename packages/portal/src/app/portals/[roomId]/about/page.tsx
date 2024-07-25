'use client';
import AvatarWithFallback from '@/components/AvatarWithFallback';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useRoom from '@/hooks/useRoom';
import useSignedInUser from '@/hooks/useSignedInUser';
import useUsers from '@/hooks/useUsers';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { User } from '@cred/shared';
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
      {user.isMod ? (
        <div className="text-xs opacity-80 text-primary mt-1 mr-1 text-center">
          mod
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

/**
 * Room info page.
 * Shows the room name, key sell price, rep holders and lurkers.
 */
const RoomInfo = () => {
  const params = useParams<{ roomId: string }>();

  const { data: room } = useRoom(params.roomId);
  const router = useRouter();
  const { setOptions } = useHeaderOptions();
  const { data: signedInUser } = useSignedInUser();

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

  const insiders = roomUsersResult?.data.filter(user =>
    room.writerIds.includes(user.id)
  );
  const lurkers = roomUsersResult?.data.filter(
    user =>
      room.readerIds.includes(user.id) && !room.writerIds.includes(user.id)
  );

  return (
    <Scrollable>
      <div className="flex flex-col items-center py-5 h-full w-full overflow-auto">
        <div className="text-xl mt-4 px-4">{room.name}</div>
        <div className="flex flex-col items-center mt-2"></div>
        <div className="mt-8">
          {insiders.length > 0 ? (
            <div className="text-center text-gray-400">insiders</div>
          ) : (
            <></>
          )}
          <div className="mt-2">
            {insiders.map(user => {
              return (
                <div key={user!.id}>
                  <RoomUserListItem user={user}></RoomUserListItem>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-8">
          {lurkers.length ? (
            <div className="text-center text-gray-400">lurkers</div>
          ) : (
            <></>
          )}
          <div className="mt-2">
            {lurkers.map(user => {
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
