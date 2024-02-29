import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, InfoIcon } from 'lucide-react';
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';

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
          You are now eligible to mint the creddd NFT.
          <div className="flex justify-center">
            <Button
              onClick={() => {
                window.open(
                  'https://zora.co/collect/zora:0xcce6fae76656e038abee27a40e9209b7dfae5f74/1'
                );
              }}
            >
              Mint on Zora
              <ExternalLink className="ml-2 w-4 h-4"></ExternalLink>
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="ml-2 w-4 h-4"></InfoIcon>
                </TooltipTrigger>
                <TooltipContent>
                  You can mint from your Farcaster custody address, or one of
                  the connected addresses.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MintInstructionModal;
