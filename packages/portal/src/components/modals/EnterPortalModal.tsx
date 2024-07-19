import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Room } from '@cred/shared';
import { DialogTitle } from '@radix-ui/react-dialog';
import { useRouter } from 'next/navigation';
import useSignedInUser from '@/hooks/useSignedInUser';
import useJoinRoom from '@/hooks/useJoinRoom';
import { useCallback } from 'react';
import useBuyPrice from '@/hooks/useBuyPrice';
import { formatEther } from 'viem';
import useBuyKey from '@/hooks/useBuyKey';

interface EnterPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

const EnterPortalModal = (props: EnterPortalModalProps) => {
  const { isOpen, onClose, room } = props;
  const { data: signedInUser } = useSignedInUser();

  const router = useRouter();
  const { mutateAsync: joinRoom, isPending: isJoining } = useJoinRoom();
  const { data: buyPrice } = useBuyPrice(room.id);
  const {
    mutateAsync: buyKey,
    isPending: isBuyingKey,
    reset: resetBuyKey,
  } = useBuyKey(room.id);

  const onEnterClick = useCallback(async () => {
    await joinRoom(room.id);
    router.push(`/chats/${room.id}`);
  }, [room.id, joinRoom, router]);

  const onBuyClick = useCallback(async () => {
    await buyKey();
    resetBuyKey();
    onClose();
  }, [buyKey, onClose, resetBuyKey]);

  if (!signedInUser) {
    return <></>;
  }

  const canUserEnter =
    room.writerIds.includes(signedInUser.id) ||
    room.readerIds.includes(signedInUser.id);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        onClose();
      }}
    >
      <DialogContent className="flex flex-col items-center w-[90%]">
        <DialogHeader>
          <DialogTitle>Enter {room.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-y-6">
          <div className="text-center">
            <div className="opacity-60">Eligibility</div>
            <div className="italic">{room.eligibility}</div>
          </div>
          <div className="flex flex-col gap-y-2">
            {canUserEnter ? (
              <Button disabled={isJoining} onClick={onEnterClick}>
                Enter portal
              </Button>
            ) : (
              <>
                <Button
                  type="submit"
                  onClick={() => {
                    router.push('settings/add-creddd');
                  }}
                >
                  Check eligibility
                </Button>
                <Button
                  variant="secondary"
                  onClick={onBuyClick}
                  disabled={isBuyingKey}
                >
                  Buy read access for {buyPrice ? formatEther(buyPrice) : ''}
                  ETH
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnterPortalModal;
