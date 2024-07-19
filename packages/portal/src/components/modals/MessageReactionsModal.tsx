'use client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import useUsers from '@/hooks/useUsers';
import AvatarWithFallback from '../AvatarWithFallback';
import useSignedInUser from '@/hooks/useSignedInUser';
import useDeleteMessageReaction from '@/hooks/useDeleteMessageReaction';
import { X } from 'lucide-react';

interface MessageReactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  messageId: string;
  reactions: Record<string, string>;
}

/**
 * Modal for displaying reactions to a message
 */
const MessageReactionsModal = (props: MessageReactionsModalProps) => {
  const { isOpen, onClose, roomId, messageId, reactions } = props;
  const { data: users } = useUsers(Object.keys(reactions));
  const { data: signedInUser } = useSignedInUser();
  const { mutateAsync: deleteMessageReaction } = useDeleteMessageReaction();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="w-[240px] flex flex-col items-center gap-y-3">
        {Object.entries(reactions).map(([userId, reaction]) => {
          const user = users?.find(u => u.id === userId);
          return user ? (
            <div
              key={userId}
              className="flex w-full items-center space-x-2 justify-between"
            >
              <div className="flex flex-row items-center gap-x-2">
                <AvatarWithFallback
                  name={user.displayName}
                  imageUrl={user.pfpUrl}
                  size={32}
                  alt="user image"
                ></AvatarWithFallback>
                <div className="text-sm">{user.displayName}</div>
              </div>
              <div className="flex flex-row items-center gap-x-2">
                <div>{reaction}</div>
                {signedInUser?.id === userId ? (
                  <X
                    className="cursor-pointer"
                    onClick={async () => {
                      await deleteMessageReaction({
                        roomId,
                        messageId,
                      });
                    }}
                  ></X>
                ) : (
                  <></>
                )}
              </div>
            </div>
          ) : (
            <></>
          );
        })}
      </DialogContent>
    </Dialog>
  );
};

export default MessageReactionsModal;
