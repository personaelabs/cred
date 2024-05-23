import { useSendTransaction } from '@privy-io/react-auth';
import { useMutation } from '@tanstack/react-query';
import { Hex } from 'viem';

const useWithdrawal = () => {
  const { sendTransaction } = useSendTransaction();

  return useMutation({
    mutationFn: async ({ to, amount }: { to: Hex; amount: bigint }) => {
      const txReceipt = await sendTransaction({
        to,
        value: amount,
      });

      return txReceipt;
    },
  });
};

export default useWithdrawal;
