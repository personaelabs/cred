'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAccount } from 'wagmi';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const PaymentModal = (props: PaymentModalProps) => {
  const { address } = useAccount();

  return (
    <Dialog open={props.isOpen}>
      <DialogContent>
        <DialogTitle>Create account</DialogTitle>
        <div>Account creation incurs a fee of 0.0005ETH ~= $10.</div>
        <div>
          We recommend making this payment from an address that isn’t link to
          your main Ethereum address.
        </div>
        <div className="flex flex-col gap-[4px]">
          <div>You are about to send a transaction from</div>
          <div>
            <b> {address}</b>
          </div>
          <div>
            <Button className="p-0" variant="link">
              Switch account
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={props.onClose}>
            Cancel
          </Button>
          <Button onClick={props.onConfirm}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
