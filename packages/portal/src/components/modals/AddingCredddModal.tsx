import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
} from '@/components/ui/dialog';
import theme from '@/lib/theme';
import { Check, Loader2 } from 'lucide-react';

interface AddStepListItemProps {
  completeMessage: string;
  pendingMessage: string;
  isDone: boolean;
}

const AddStepListItem = (props: AddStepListItemProps) => {
  const { completeMessage, pendingMessage, isDone } = props;

  return (
    <div className="flex flx-row items-center">
      {isDone ? (
        <>
          <Check className="w-4 h-4 mr-2" color={theme.orange}></Check>
          {completeMessage}
        </>
      ) : (
        <>
          <Loader2
            className="animate-spin w-4 h-4 mr-2"
            color={theme.orange}
          ></Loader2>
          <div>{pendingMessage}</div>
        </>
      )}
    </div>
  );
};

interface AddingCredddModalProps {
  isOpen: boolean;
  isProofSignatureReady: boolean;
  isPrivySignatureReady: boolean;
  isProofReady: boolean;
}

const AddingCredddModal = (props: AddingCredddModalProps) => {
  const { isOpen, isProofSignatureReady, isPrivySignatureReady, isProofReady } =
    props;
  return (
    <Dialog open={isOpen}>
      <DialogContent className="flex flex-col items-center w-[90%]">
        <DialogHeader>
          <DialogDescription>
            Adding rep....this may take a minute
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-y-3">
          <AddStepListItem
            completeMessage="Signed message with connected address"
            pendingMessage="Waiting for signature from connected address"
            isDone={isProofSignatureReady}
          ></AddStepListItem>
          {isProofSignatureReady ? (
            <AddStepListItem
              completeMessage="Generated zero-knowledge proof"
              pendingMessage="Generating zero-knowledge proof"
              isDone={isProofReady}
            ></AddStepListItem>
          ) : (
            <></>
          )}
          {isProofReady ? (
            <AddStepListItem
              completeMessage="Signed message with account"
              pendingMessage="Waiting for signature from account"
              isDone={isPrivySignatureReady}
            ></AddStepListItem>
          ) : (
            <></>
          )}
          {isPrivySignatureReady ? (
            <AddStepListItem
              completeMessage="Submitted proof"
              pendingMessage="Submitting"
              isDone={false}
            ></AddStepListItem>
          ) : (
            <></>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddingCredddModal;
