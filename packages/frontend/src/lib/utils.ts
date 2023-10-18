import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Hex } from 'viem';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Append the "0x" prefix to the string if it doesn't have it
export const toPrefixedHex = (str: String): Hex => {
  return (str.includes('0x') ? str : '0x' + str) as Hex;
};
