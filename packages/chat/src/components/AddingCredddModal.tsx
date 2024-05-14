import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface AddingCredddModalProps {
  isOpen: boolean;
}

const AddingCredddModal = (props: AddingCredddModalProps) => {
  return (
    <Dialog open={props.isOpen}>
      <DialogContent className="flex flex-col items-center">
        <Loader2
          className="animate-spin w-[48px] h-[48px]"
          color="#FDA174"
        ></Loader2>
        <div>Adding creddd....this may take a minute</div>
      </DialogContent>
    </Dialog>
  );
};

export default AddingCredddModal;
