import { Check, CheckCheck, SquareArrowRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import useJoinRoom from '@/hooks/useJoinRoom';
import { Button } from './ui/button';
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

interface CredddVerifiedSheetProps {
  isOpen: boolean;
  joinableRoom: {
    id: string;
    displayName: string;
  } | null;
  onClose: () => void;
}

const CredddVerifiedSheet = (props: CredddVerifiedSheetProps) => {
  const { isOpen, joinableRoom, onClose } = props;
  const { data: signedInUser } = useSignedInUser();
  const { data: joinedRooms } = useJoinedRooms(signedInUser?.id || null);

  const { mutateAsync: joinRoom, isPending: isJoining } = useJoinRoom();
  const router = useRouter();

  const onJoinClick = useCallback(
    async (roomId: string) => {
      await joinRoom(roomId);
      router.push(`/rooms/${roomId}`);
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
            Creddd verified
          </SheetTitle>
          <SheetDescription className="text-center">
            You can start chatting in the following room
          </SheetDescription>
        </SheetHeader>
        {joinableRoom ? (
          <div
            key={joinableRoom.id}
            className="flex flex-col items-center justify-between border-b border-gray-200 py-3"
          >
            <div className="w-full flex flex-row gap-x-4 items-center">
              <div className="w-[50%] text-center">
                {joinableRoom.displayName}
              </div>
              <JoinButton
                onClick={() => onJoinClick(joinableRoom.id)}
                isJoining={isJoining}
                alreadyJoined={
                  joinedRoomsIds?.includes(joinableRoom.id) || false
                }
              />
            </div>
          </div>
        ) : (
          <></>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CredddVerifiedSheet;
