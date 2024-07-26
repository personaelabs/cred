import { CheckCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import Link from 'next/link';

interface CredddVerifiedSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const CredddVerifiedSheet = (props: CredddVerifiedSheetProps) => {
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
          <SheetTitle className="flex flex-row justify-center gap-x-2 items-center">
            <CheckCheck className="ml-2 w-5 h-5 text-purple-600"></CheckCheck>
            Rep verified
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center justify-center h-full">
          <Link href="/">
            <Button>Browse eligible portals</Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CredddVerifiedSheet;
