import { copyTextToClipboard } from '@/lib/utils';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { toast } from 'sonner';

interface ConnectFromDifferentDeviceSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectFromDifferentDeviceSheet = (
  props: ConnectFromDifferentDeviceSheetProps
) => {
  const { isOpen, onClose } = props;
  return (
    <Sheet
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent side="bottom" className="h-[300px]">
        <SheetHeader>
          <SheetTitle>Connect on a different device</SheetTitle>
          <SheetDescription>
            You can login to your account from a different device and connect
            your addresses.
            <br></br>
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 w-full flex flex-col items-center">
          <Button
            onClick={async () => {
              await copyTextToClipboard(window.location.origin);
              toast.success('Copied login url');
            }}
          >
            Copy login url
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ConnectFromDifferentDeviceSheet;
