'use client';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { setDoNotShowAgain } from '@/lib/utils';
import { ModalType } from '@/types';

interface MessageAsBuyerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MessageAsBuyerModal = (props: MessageAsBuyerModalProps) => {
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
              Your messages will be only visible to rep holders in this room.
            </li>
            <li>
              Once a rep holder replies to you message, it wll become visible to
              everyone in the room.
            </li>
          </ul>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            className="opacity-60"
            onClick={() => {
              setDoNotShowAgain(ModalType.MESSAGE_AS_BUYER);
              onClose();
            }}
          >
            Don&apos;t show this again
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

export default MessageAsBuyerModal;
