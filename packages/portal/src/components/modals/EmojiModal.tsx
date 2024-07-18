'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import data from '@emoji-mart/data';
// @ts-ignore
import Picker from '@emoji-mart/react';

interface EmojiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (_emoji: string) => void;
}

const EmojiModal = (props: EmojiModalProps) => {
  const { isOpen, onClose, onEmojiSelect } = props;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="bg-transparent border-0 items-center justify-center">
        <Picker
          data={data}
          onEmojiSelect={(e: any) => {
            onEmojiSelect(e.native);
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EmojiModal;
