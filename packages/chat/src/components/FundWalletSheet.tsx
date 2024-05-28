/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';

interface FundWalletSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const FundWalletSheet = (props: FundWalletSheetProps) => {
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
      <SheetContent side="bottom" className="h-[240px]">
        <SheetHeader>
          <SheetTitle className="text-center flex flex-row justify-center">
            Deposit ETH on
            <div className="text-md flex flex-row items-center">
              <img src="/base.png" alt="base" className="w-4 h-4 mx-1"></img>
              Base
            </div>
          </SheetTitle>
          <SheetDescription className="text-center">
            You don`t have enough ETH to purchase the key.
          </SheetDescription>
        </SheetHeader>
        <div className="w-full mt-8 flex flex-col items-center justify-center">
          <Link href="/settings/wallet">
            <Button
              onClick={() => {
                onClose();
              }}
            >
              Deposit
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FundWalletSheet;
