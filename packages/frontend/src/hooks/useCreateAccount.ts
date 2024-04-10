'use client';
import { useConfig, useSwitchChain, useWriteContract } from 'wagmi';
import { mnemonicToAccount } from 'viem/accounts';
import { english, generateMnemonic } from 'viem/accounts';

import {
  ID_GATEWAY_ADDRESS,
  KEY_GATEWAY_ADDRESS,
  ID_REGISTRY_ADDRESS,
} from '@/lib/farcaster/farcaster';
import idGatewayAbi from '@/lib/farcaster/IdGatewayAbi.json';
import keyGatewayAbi from '@/lib/farcaster/KeyGatewayAbi.json';
import {
  ID_GATEWAY_EIP_712_DOMAIN,
  ID_GATEWAY_REGISTER_TYPE,
  IdGatewayRegisterMessage,
} from '@/lib/farcaster/idGateway';
import { readContract, waitForTransactionReceipt } from 'viem/actions';
import { buildSiwfMessage, generateRandomString } from '@/lib/utils';
import { Hex } from 'viem';
import { useReskinFcUser } from '@/context/ReskinFcUserContext';
import { saveReskinCustodyMnemonic } from '@/lib/reskin';

const PERSONAE_ADDRESS = '0x141b63D93DaF55bfb7F396eEe6114F3A5d4A90B2';

const useCreateAccount = () => {
  const { writeContractAsync } = useWriteContract();
  const config = useConfig({});
  const { onReskinUserSignIn } = useReskinFcUser();
  const { switchChainAsync } = useSwitchChain();

  const createAccount = async () => {
    await switchChainAsync({
      chainId: 10,
    });

    const mnemonic = generateMnemonic(english);
    const custodyAccount = mnemonicToAccount(mnemonic);

    const custodyAddress = custodyAccount.address;

    saveReskinCustodyMnemonic(mnemonic);

    const client = config.getClient({
      chainId: 10,
    });

    const nonce = (await readContract(client, {
      address: KEY_GATEWAY_ADDRESS,
      abi: keyGatewayAbi,
      functionName: 'nonces',
      args: [custodyAddress],
    })) as bigint | null;

    if (nonce === null) {
      throw new Error('Failed to get nonce');
    }

    const price = (await readContract(client, {
      address: ID_GATEWAY_ADDRESS,
      abi: idGatewayAbi,
      functionName: 'price',
    })) as bigint | null;

    if (price === null) {
      throw new Error('Failed to get price');
    }

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // set the signatures' deadline to 1 hour from now

    const message: IdGatewayRegisterMessage = {
      to: custodyAddress,
      recovery: PERSONAE_ADDRESS,
      nonce,
      deadline,
    };

    const registerSig = await custodyAccount.signTypedData({
      primaryType: 'Register',
      types: { Register: [...ID_GATEWAY_REGISTER_TYPE] },
      domain: ID_GATEWAY_EIP_712_DOMAIN,
      message,
    });

    const args = [custodyAddress, PERSONAE_ADDRESS, deadline, registerSig];

    const txHash = await writeContractAsync({
      address: ID_GATEWAY_ADDRESS,
      functionName: 'registerFor',
      abi: idGatewayAbi,
      args,
      value: price,
    });

    const transactionReceipt = await waitForTransactionReceipt(client, {
      hash: txHash,
    });

    if (transactionReceipt.status === 'reverted') {
      throw new Error('Transaction reverted');
    }

    const registerLog = transactionReceipt.logs.find(
      log =>
        log.address === ID_REGISTRY_ADDRESS.toLowerCase() &&
        log.topics[0] ===
          '0xf2e19a901b0748d8b08e428d0468896a039ac751ec4fec49b44b7b9c28097e45'
    );

    if (!registerLog) {
      throw new Error('Failed to get register log');
    }

    const fid = parseInt(registerLog.topics[2] as Hex);

    const siwfNonce = generateRandomString(10); // TODO: generate this on the server side

    const siwfMessage = buildSiwfMessage({
      domain: 'creddd.xyz',
      address: custodyAddress,
      siweUri: 'http://creddd.xyz/login',
      nonce: siwfNonce,
      issuedAt: new Date().toISOString(),
      fid,
    });

    const siwfSig = await custodyAccount.signMessage({
      message: siwfMessage,
    });

    // TODO: Update the user metadata

    onReskinUserSignIn({
      custodyAddress,
      fid,
      message: siwfMessage,
      signature: siwfSig,
      nonce: siwfNonce,
    });
  };

  return { createAccount };
};

export default useCreateAccount;
