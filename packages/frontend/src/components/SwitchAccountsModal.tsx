import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

interface SwitchAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletName: string;
}

const SwitchAccountsModal = (props: SwitchAccountsModalProps) => {
  const { walletName } = props;
  return (
    <Dialog open={props.isOpen}>
      <DialogContent>
        <DialogTitle>Switch connected accounts</DialogTitle>
        <div className="text-center">
          Please switch accounts from the {walletName} app.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SwitchAccountsModal;
