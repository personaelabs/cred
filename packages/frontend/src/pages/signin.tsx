import { Button } from '@/components/ui/button';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { SiweMessage } from 'siwe';
import { Hex } from 'viem';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';

const domain = 'https://creddd.xyz';
const statement = 'Sign in to creddd';

const createSIWEMessage = (address: Hex) => {
  const message = new SiweMessage({
    domain,
    address,
    statement,
    uri: origin,
    version: '1',
    chainId: 1,
  });
  return message.prepareMessage();
};

const SignInPage = () => {
  const { openConnectModal } = useConnectModal();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [isAddressConnected, setIsAddressConnected] = useState(false);
  const router = useRouter();

  const { signMessage, data, status } = useSignMessage({
    message: address ? createSIWEMessage(address) : '',
  });

  useEffect(() => {
    if (openConnectModal) {
      setIsAddressConnected(false);
    } else {
      setIsAddressConnected(true);
    }
  }, [openConnectModal]);

  useEffect(() => {
    if (address && data) {
      localStorage.setItem('signedInAddress', JSON.stringify({ address, sig: data }));

      disconnect();
      router.push('/');
    }
  }, [status, router, data, disconnect, address]);

  return (
    <div className="flex flex-col items-center">
      <h1 className="mt-4 text-2xl font-semibold">Creddd</h1>
      <div className="mt-12 flex flex-col">
        <Button
          disabled={isAddressConnected}
          onClick={() => {
            if (openConnectModal) {
              openConnectModal();
            }
          }}
        >
          {isAddressConnected ? 'Connected' : 'Connect wallet'}
        </Button>
        <Button
          disabled={status === 'success'}
          className="mt-4"
          onClick={() => {
            if (address) {
              signMessage();
            }
          }}
        >
          Sign message
        </Button>
      </div>
    </div>
  );
};

export default SignInPage;
