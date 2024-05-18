import { useReadContract } from 'wagmi';
import { CredAbi, CRED_CONTRACT_ADDRESS } from '@cred/shared';

const useKeyPrice = (_roomId: string) => {
  return useReadContract({
    abi: CredAbi,
    address: CRED_CONTRACT_ADDRESS,
    functionName: 'getBuyPrice',
    args: [BigInt(1)],
  });
};

export default useKeyPrice;
