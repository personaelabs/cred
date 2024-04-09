import { CreateAccountArgs } from '@/app/types';
import { parseEther } from 'viem';
import { useSendTransaction } from 'wagmi';

const useCreateAccount = () => {
  const { sendTransactionAsync } = useSendTransaction();

  const createAccount = async (_args: CreateAccountArgs) => {
    // create account with selected creddd
    // Check that the transaction gets confirmed
    // Check for payment

    const _result = await sendTransactionAsync({
      to: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8', // dantehrani.eth
      value: parseEther('0.0005'),
    });

    // Submit the tx hash
  };

  return { createAccount };
};

export default useCreateAccount;
