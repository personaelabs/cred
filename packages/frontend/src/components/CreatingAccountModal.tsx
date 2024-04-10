'use client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface CreatingAccountModalProps {
  isOpen: boolean;
}

const CreatingAccountModal = (props: CreatingAccountModalProps) => {
  return (
    <Dialog open={props.isOpen}>
      <DialogContent className="flex flex-col items-center">
        <Loader2
          className="animate-spin w-[48px] h-[48px]"
          color="#FDA174"
        ></Loader2>
        <div>Creating account....</div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatingAccountModal;
