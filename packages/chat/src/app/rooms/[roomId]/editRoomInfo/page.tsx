'use client';
import AvatarWithFallback from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useRoom from '@/hooks/useRoom';
import useUpdateRoom from '@/hooks/useUpdateRoom';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const EditRoomInfo = () => {
  const params = useParams<{ roomId: string }>();

  const { data: room } = useRoom(params.roomId);
  const { setOptions } = useHeaderOptions();
  const [updatedRoomName, setUpdatedRoomName] = useState(room?.name || '');
  const { mutate: updateRoom, isPending: isUpdating } = useUpdateRoom(
    params.roomId
  );

  useEffect(() => {
    if (room) {
      setOptions({
        title: room.name,
        showBackButton: true,
        headerRight: (
          <Button
            disabled={isUpdating}
            onClick={() => {
              updateRoom({
                newRoomName: updatedRoomName,
              });
            }}
            variant="link"
          >
            Save
          </Button>
        ),
      });
    }
  }, [
    isUpdating,
    params.roomId,
    room,
    setOptions,
    updateRoom,
    updatedRoomName,
  ]);

  if (!room) {
    return <></>;
  }

  return (
    <div className="flex flex-col items-center py-5">
      <AvatarWithFallback
        imageUrl={room.imageUrl}
        alt="Room image"
        name={room.name}
        size={80}
      ></AvatarWithFallback>
      <div>
        <Input
          className="text-xl mt-4"
          value={updatedRoomName}
          onChange={e => setUpdatedRoomName(e.target.value)}
        ></Input>
      </div>
    </div>
  );
};

export default EditRoomInfo;
