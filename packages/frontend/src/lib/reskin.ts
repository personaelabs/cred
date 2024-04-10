import { FcUserSignInInfo } from '@/app/types';

const RESKIN_CUSTODY_MNEMONIC_KEY = 'reskinCustodyMnemonic';
const RESKIN_FC_SIGN_IN_INFO_KEY = 'reskinFcSignInInfo';

/**
 *  Saves the Reskin FC sign in info to localStorage
 */
export const saveReskinFcSignInInfo = (info: FcUserSignInInfo) => {
  localStorage.setItem(RESKIN_FC_SIGN_IN_INFO_KEY, JSON.stringify(info));
};

/**
 * Returns the Reskin FC sign in info from localStorage
 */
export const getReskinFcSignInInfo = (): FcUserSignInInfo | null => {
  const info = localStorage.getItem(RESKIN_FC_SIGN_IN_INFO_KEY);
  if (info) {
    return JSON.parse(info);
  }
  return null;
};

/**
 * Saves the mnemonic for the Reskin custody account to localStorage
 */
export const saveReskinCustodyMnemonic = (mnemonic: string) => {
  localStorage.setItem(RESKIN_CUSTODY_MNEMONIC_KEY, mnemonic);
};

/**
 * Returns the mnemonic for the Reskin custody account from localStorage
 */
export const getReskinCustodyMnemonic = (): string | null => {
  return localStorage.getItem(RESKIN_CUSTODY_MNEMONIC_KEY);
};

/**
 * Deletes the mnemonic and sign in info for the Reskin custody account from localStorage
 */
export const deleteCustodyAccount = () => {
  localStorage.removeItem(RESKIN_FC_SIGN_IN_INFO_KEY);
  localStorage.removeItem(RESKIN_CUSTODY_MNEMONIC_KEY);
};
