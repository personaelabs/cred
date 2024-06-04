import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import theme from '@/lib/theme';

interface ProcessingTxSheetProps {
  isOpen: boolean;
}

const ProcessingTxSheet = (props: ProcessingTxSheetProps) => {
  const { isOpen } = props;

  return (
    <Sheet open={isOpen}>
      <SheetContent side="bottom" className="h-[300px]">
        <SheetHeader>
          <SheetTitle className="text-center">
            Processing transaction
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center justify-center h-[80%]">
          <Loader2
            color={theme.orange}
            className="w-[61%] h-[61%] animate-spin"
            strokeWidth={0.61}
          ></Loader2>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProcessingTxSheet;
