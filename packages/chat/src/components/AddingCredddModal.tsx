import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
} from '@/components/ui/dialog';
import theme from '@/lib/theme';
import { Check, Loader2 } from 'lucide-react';

interface AddingCredddModalProps {
  isOpen: boolean;
  hasSignedMessage: boolean;
}

const AddingCredddModal = (props: AddingCredddModalProps) => {
  const { isOpen, hasSignedMessage } = props;
  return (
    <Dialog open={isOpen}>
      <DialogContent className="flex flex-col items-center">
        <DialogHeader>
          <DialogDescription>
            Adding creddd....this may take a minute
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-y-3">
          <div className="flex flx-row items-center">
            {hasSignedMessage ? (
              <>
                <Check className="w-4 h-4 mr-2" color={theme.orange}></Check>
                Signed message
              </>
            ) : (
              <>
                <Loader2
                  className="animate-spin w-4 h-4 mr-2"
                  color={theme.orange}
                ></Loader2>
                <div>Waiting for signature...</div>
              </>
            )}
          </div>
          {hasSignedMessage ? (
            <div className="flex flx-row items-center">
              <Loader2
                className="animate-spin w-4 h-4 mr-2"
                color="purple"
                strokeWidth={3}
              ></Loader2>
              <div>Generating zero knowledge proof</div>
            </div>
          ) : (
            <></>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddingCredddModal;
