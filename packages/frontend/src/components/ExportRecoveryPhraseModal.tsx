'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { useReskinFcUser } from '@/context/ReskinFcUserContext';
import { getReskinCustodyMnemonic } from '@/lib/reskin';
import { Copy, Loader2 } from 'lucide-react';
import { useState } from 'react';
import copy from 'copy-to-clipboard';
import { toast } from 'sonner';

interface ExportRecoveryPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DialogBody = () => {
  const { signedInUser } = useReskinFcUser();
  const [revealRecoveryPhrase, setRevealRecoveryPhrase] =
    useState<boolean>(false);

  if (!signedInUser) {
    return <Loader2></Loader2>;
  }

  const mnemonic = getReskinCustodyMnemonic();

  return (
    <>
      Backup and import the recovery phrase to Warpcast to start casting
      {revealRecoveryPhrase ? (
        <div className="flex flex-col items-center">
          <div className="text-center text-[#f0f0f0] bg-[#383838] p-4 rounded-lg w-full">
            <div>{mnemonic}</div>
            <Button
              variant="link"
              onClick={() => {
                copy(mnemonic as string);
                toast.success('Copied recovery phrase');
              }}
            >
              <Copy className="mr-2 mt-[1px] w-3 h-3" />
              copy
            </Button>
          </div>
          <div className="flex flex-col items-center">
            <Button
              variant="link"
              onClick={() => {
                setRevealRecoveryPhrase(false);
              }}
            >
              hide recovery phrase
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="link"
          onClick={() => {
            setRevealRecoveryPhrase(true);
          }}
        >
          show recovery phrase
        </Button>
      )}
    </>
  );
};

const ExportRecoveryPhraseModal = (props: ExportRecoveryPhraseModalProps) => {
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
        <DialogTitle>Export recovery phrase</DialogTitle>
        <DialogBody />
        <DialogFooter>
          <Button variant="ghost" onClick={props.onClose}>
            I backed up my recovery phrase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportRecoveryPhraseModal;
