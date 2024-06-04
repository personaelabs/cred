'use client';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { setDoNotShowAgain } from '@/lib/utils';
import { ModalType } from '@/types';

interface MessageAsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MessageAsAdminModal = (props: MessageAsAdminModalProps) => {
  const { isOpen, onClose } = props;
  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader className="opacity-60">
          <DialogTitle>Message visibility</DialogTitle>
        </DialogHeader>
        <div>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              You are an admin is this room. You can view all messages in this
              room.
            </li>
            <li>
              Messages from non-admin are only visible to admins by default.
            </li>
            <li>
              Once you reply to a message sent from a non-admin, it`ll become
              visible to everyone in the room.
            </li>
          </ul>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            className="opacity-60"
            onClick={() => {
              setDoNotShowAgain(ModalType.REPLY_AS_ADMIN);
              onClose();
            }}
          >
            Don`t show this again
          </Button>
          <Button
            onClick={() => {
              onClose();
            }}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageAsAdminModal;
