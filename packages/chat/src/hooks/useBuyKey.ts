import { useCallback } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { CredAbi, CRED_CONTRACT_ADDRESS } from '@cred/shared';
import { readContract } from '@wagmi/core';
import wagmiConfig from '../lib/wagmiConfig';

const useBuyKey = () => {
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();

  const buyKey = useCallback(async () => {
    if (!address) {
      throw new Error('No connected address found.');
    }

    const value = await readContract(wagmiConfig, {
      abi: CredAbi,
      address: CRED_CONTRACT_ADDRESS,
      functionName: 'getBuyPrice',
      args: [BigInt(1)],
    });

    if (!value) {
      throw new Error('Failed to get price of.');
    }

    const result = await writeContractAsync({
      abi: CredAbi,
      address: CRED_CONTRACT_ADDRESS,
      functionName: 'buyToken',
      args: [address, BigInt(1), '0x'],
      value,
    });

    return result;
  }, [address, writeContractAsync]);

  return { ...writeContractAsync, buyKey };
};

export default useBuyKey;
