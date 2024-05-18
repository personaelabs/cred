import { useReadContract } from 'wagmi';
import { CredAbi, CRED_CONTRACT_ADDRESS } from '@cred/shared';
import { getRoomTokenId } from '@/lib/utils';

const useKeyPrice = (roomId: string) => {
  const roomIdBigInt = getRoomTokenId(roomId);

  return useReadContract({
    abi: CredAbi,
    address: CRED_CONTRACT_ADDRESS,
    functionName: 'getBuyPrice',
    args: [roomIdBigInt],
  });
};

export default useKeyPrice;
