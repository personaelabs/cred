import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';

interface MintInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MintInstructionModal = (props: MintInstructionModalProps) => {
  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={isOpen => {
        if (!isOpen) props.onClose();
      }}
    >
      <DialogContent>
        <DialogTitle>Creddd added!</DialogTitle>
        <div className="flex flex-col gap-4 justify-center items-center">
          You are now eligible to mint the creddd genesis NFT.
          <div className="flex justify-center">
            <Button
              onClick={() => {
                window.open('https://warpcast.com/dantehrani.eth/0xe62d1e66');
              }}
            >
              Mint
              <ExternalLink className="ml-2 w-4 h-4"></ExternalLink>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MintInstructionModal;
