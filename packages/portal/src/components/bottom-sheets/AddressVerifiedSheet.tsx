import { Check, CheckCheck, SquareArrowRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import useJoinRoom from '@/hooks/useJoinRoom';
import { Button } from '../ui/button';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useJoinedRooms from '@/hooks/useJoinedRooms';
import useSignedInUser from '@/hooks/useSignedInUser';

interface JoinButtonProps {
  onClick: () => void;
  isJoining: boolean;
  alreadyJoined: boolean;
}

const JoinButton = (props: JoinButtonProps) => {
  const { onClick, isJoining, alreadyJoined } = props;

  return (
    <Button
      disabled={isJoining || alreadyJoined}
      onClick={() => {
        onClick();
      }}
    >
      {alreadyJoined ? (
        <Check className="w-3 h-3 mr-2"></Check>
      ) : (
        <SquareArrowRight className="w-4 h-4 mr-2"></SquareArrowRight>
      )}
      {alreadyJoined ? 'Joined' : 'Join'}
    </Button>
  );
};

interface AddressVerifiedSheetProps {
  isOpen: boolean;
  joinableRooms: {
    id: string;
    displayName: string;
  }[];
  onClose: () => void;
}

const AddressVerifiedSheet = (props: AddressVerifiedSheetProps) => {
  const { isOpen, joinableRooms, onClose } = props;
  const { data: signedInUser } = useSignedInUser();
  const { data: joinedRooms } = useJoinedRooms(signedInUser?.id || null);

  const { mutateAsync: joinRoom, isPending: isJoining } = useJoinRoom();
  const router = useRouter();

  const onJoinClick = useCallback(
    async (roomId: string) => {
      await joinRoom(roomId);
      router.push(`/chats/${roomId}`);
    },
    [joinRoom, router]
  );

  const joinedRoomsIds = joinedRooms?.map(room => room.id) || [];

  return (
    <Sheet
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent side="bottom" className="h-[300px]">
        <SheetHeader>
          <SheetTitle className="flex flex-row justify-center gap-x-2 items-center">
            <CheckCheck className="ml-2 w-5 h-5 text-purple-600"></CheckCheck>
            Address verified
          </SheetTitle>
          <SheetDescription>
            You can start chatting in the following portals
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col h-[60%] overflow-auto mt-4">
          {joinableRooms.map(room => (
            <div
              key={room.id}
              className="flex flex-col items-center justify-between border-b border-gray-200 py-3"
            >
              <div className="w-full flex flex-row gap-x-4 items-center">
                <div className="w-[50%] text-center">{room.displayName}</div>
                <JoinButton
                  onClick={() => onJoinClick(room.id)}
                  isJoining={isJoining}
                  alreadyJoined={joinedRoomsIds?.includes(room.id) || false}
                />
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddressVerifiedSheet;
