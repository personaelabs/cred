import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { copyTextToClipboard, cutoffMessage } from '@/lib/utils';
import { DialogTitle } from '@radix-ui/react-dialog';
import { Copy } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface AddRepFromAnotherDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: string;
}

const AddRepFromAnotherDeviceModal = (
  props: AddRepFromAnotherDeviceModalProps
) => {
  const { isOpen, onClose, link } = props;

  const onCopyLinkClick = useCallback(async () => {
    await copyTextToClipboard(link);
    toast.success('Copied lnk');
  }, [link]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={_open => {
        if (!_open) {
          onClose();
        }
      }}
    >
      <DialogContent className="flex flex-col items-center w-[90%]">
        <DialogHeader>
          <DialogTitle className="opacity-60">
            Add rep from another device
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center">
          <div>Open this link on the device you want to add rep from</div>
          <div
            className="flex flex-row items-center hover:cursor-pointer mt-4"
            onClick={onCopyLinkClick}
          >
            <div className="underline text-primary">
              {cutoffMessage(link, 20)}
            </div>
            <Copy className="ml-2 w-4 h-4"></Copy>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddRepFromAnotherDeviceModal;
