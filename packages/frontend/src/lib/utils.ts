import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Hex, bytesToHex } from 'viem';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Append the "0x" prefix to the string if it doesn't have it
export const toPrefixedHex = (str: String): Hex => {
  return (str.includes('0x') ? str : '0x' + str) as Hex;
};

export const trimAddress = (address: Hex): Hex => {
  return (address.slice(0, 6) + '...' + address.slice(-4)) as Hex;
};

// Get the signed in address from local storage
export const getSignedInAddress = (): {
  address: Hex;
  sig: Hex;
} | null => {
  const signedInAddress = localStorage.getItem('signedInAddress');
  if (signedInAddress) {
    return JSON.parse(signedInAddress);
  }

  return null;
};

// Get the verified addresses from local storage
export const getVerifiedAddresses = (): { address: Hex; sig: Hex }[] => {
  const verifiedAddresses = localStorage.getItem('verifiedAddresses');
  if (!verifiedAddresses) {
    return [];
  }
  return JSON.parse(verifiedAddresses);
};

// Save a verified address to local storage
export const saveVerifiedAddress = (address: Hex, sig: Hex) => {
  const verifiedAddresses = getVerifiedAddresses();
  verifiedAddresses.push({ address, sig });
  localStorage.setItem('verifiedAddresses', JSON.stringify(verifiedAddresses));
};

// Create a EIP-712 message for verifying address ownership
export const createVerificationMessage = (accountAddress: string) => {
  return {
    primaryType: 'Message',
    domain: {
      name: 'creddd',
      version: '1',
      chainId: 1,
      verifyingContract: '0x0000000000000000000000000000000000000000',
      salt: '0x3c8f67e5796abf1d99aa34c63d9c5bea7d6c5a4803dd22774db7d840683d9ca4',
    },
    types: {
      Message: [{ name: 'statement', type: 'string' }],
    },
    message: { statement: `I am creating a private link to ${accountAddress}` },
  };
};
