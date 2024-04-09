'use client';
import { Button } from '@/components/ui/button';
import { useConnectedAccounts } from '@/context/ConnectWalletContext';
import { useAccount } from 'wagmi';

interface ConnectWalletButtonProps {
  label: string;
}

const ConnectWalletButton = (props: ConnectWalletButtonProps) => {
  const { label } = props;
  const { switchAccounts, switchWallet, connector, openConnectModal } =
    useConnectedAccounts();

  const { isConnecting } = useAccount();

  if (isConnecting) {
    return <></>;
  }

  if (connector) {
    return (
      <div className="flex flex-col items-center gap-[4px]">
        <Button variant="link" onClick={switchAccounts}>
          Switch connected accounts
        </Button>
        <div className="flex flex-row items-center gap-[6px]">
          <div className="text-sm">
            Connected to <span className="font-bold">{connector?.name}</span>
          </div>
          <Button variant="link" className="font-normal" onClick={switchWallet}>
            Use a different wallet
          </Button>
        </div>
      </div>
    );
  } else {
    return (
      <>
        <div className="flex flex-col items-center gap-[14px]">
          <div className="opacity-80">{label}</div>
          <div className="opacity-80">
            <div>Your Ethereum addresses are kept private.</div>
            <div>
              <b>Even Personae can’t see your addresses.</b>
            </div>
          </div>
          <Button onClick={openConnectModal}>Connect wallet</Button>
        </div>
      </>
    );
  }
};

export default ConnectWalletButton;
