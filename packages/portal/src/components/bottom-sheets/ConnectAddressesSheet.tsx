import { Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useState } from 'react';

const DO_NOT_SHOW_SHEET_KEY = 'doNotShowConnectAddressesSheet';

const setDoNotShowAgain = () => {
  localStorage.setItem(DO_NOT_SHOW_SHEET_KEY, 'true');
};

const showSheet = () => {
  return localStorage.getItem(DO_NOT_SHOW_SHEET_KEY) !== 'true';
};

const ConnectAddressesSheet = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Sheet open={isOpen && showSheet()}>
      <SheetContent side="bottom" className="h-[300px]">
        <SheetHeader>
          <SheetTitle>Prove your onchain history to join portals</SheetTitle>
          <SheetDescription>
            You can also purchase keys to access portals.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col items-center justify-center mt-[40px] mb-4">
          <Button asChild>
            <Link
              href="/settings/connected-addresses"
              className="no-underline focus:no-underline focus:outline-none"
            >
              <Plus className="w-4 h-4 mr-2"></Plus>
              Connect address
            </Link>
          </Button>
        </div>
        <SheetFooter>
          <Button
            variant="link"
            className="text-gray-500 focus:outline-none"
            onClick={() => {
              setIsOpen(false);
              setDoNotShowAgain();
            }}
          >
            Don&apos;t show this again
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ConnectAddressesSheet;
