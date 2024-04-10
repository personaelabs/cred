'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteRecoveryPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const DeleteRecoveryPhraseModal = (props: DeleteRecoveryPhraseModalProps) => {
  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) {
          props.onClose();
        }
      }}
    >
      <DialogContent>
        <DialogTitle>Clear recovery phrase from browser</DialogTitle>
        <div>
          This will safely remove your recovery from this browser.<br></br>
          <br></br>
          Please make sure you have backed up your recovery phrase before
          proceeding.
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={props.onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={props.onDelete}>
            Clear recovery phrase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteRecoveryPhraseModal;
