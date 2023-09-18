import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { MembershipProver } from '@personaelabs/spartan-ecdsa';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });

  return (
    <main className="flex min-h-screen w-full justify-center bg-gray-50">
      <ConnectButton></ConnectButton>
    </main>
  );
}
