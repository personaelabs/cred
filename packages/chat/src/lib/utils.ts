import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Hex, formatEther, keccak256 } from 'viem';
import DOMPurify from 'isomorphic-dompurify';
import { base, baseSepolia } from 'viem/chains';
import {
  Timestamp,
  collection,
  limit,
  or,
  orderBy,
  query,
  startAt,
  where,
} from 'firebase/firestore';
import db from './firestore';
import { MessageVisibility, Room, messageConverter } from '@cred/shared';
import { BottomSheetType, ModalType } from '@/types';

const DO_NOT_SHOW_AGAIN_PREFIX = 'creddd.DO_NOT_SHOW_AGAIN:';

export const setDoNotShowAgain = (dialog: ModalType | BottomSheetType) => {
  localStorage.setItem(`${DO_NOT_SHOW_AGAIN_PREFIX}:${dialog}`, 'true');
};

export const canShowModal = (dialog: ModalType) => {
  return !localStorage.getItem(`${DO_NOT_SHOW_AGAIN_PREFIX}:${dialog}`);
};

export const isUserAdminInRoom = ({
  userId,
  room,
}: {
  userId: string;
  room: Room;
}) => {
  return room.writerIds.includes(userId);
};

/**
 * Builds a Firestore query to fetch messages for a room.
 * If the user is an admin, all messages are fetched.
 * If the user is not an admin, only public messages and messages from the user are fetched.
 */
export const buildMessageQuery = ({
  isAdminView,
  viewerId,
  roomId,
  pageSize,
  from,
}: {
  isAdminView: boolean;
  viewerId: string;
  roomId: string;
  pageSize: number;
  from?: Date;
}) => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages').withConverter(
    messageConverter
  );

  if (isAdminView) {
    // Get all messages in the room for admins
    return from
      ? query(
          messagesRef,
          orderBy('createdAt', 'desc'),
          startAt(Timestamp.fromDate(from)),
          limit(pageSize)
        )
      : query(messagesRef, orderBy('createdAt', 'desc'), limit(pageSize));
  }

  const onlyPublic = or(
    where('visibility', '==', MessageVisibility.PUBLIC),
    where('userId', '==', viewerId)
  );

  // Only get public messages and messages from the viewer
  // if the user is not an admin
  return from
    ? query(
        messagesRef,
        onlyPublic,
        orderBy('createdAt', 'desc'),
        startAt(Timestamp.fromDate(from)),
        limit(pageSize)
      )
    : query(
        messagesRef,
        onlyPublic,
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
};
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const extractLinks = (text: string) => {
  const urlPattern = /https?:\/\/[^\s/$.?#].[^\s]*/g;
  const urls = text.match(urlPattern);

  return urls || [];
};

export const formatEthBalance = (balance: bigint) => {
  const balanceInEth = formatEther(balance);
  const balanceNumber = parseFloat(balanceInEth);
  if (balanceNumber < 0.0001 && balanceNumber > 0) {
    return '< 0.0001';
  }

  if (balanceNumber === 0) {
    return '0';
  }

  return balanceNumber.toPrecision(3);
};

export const getChain = () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_CHAIN === 'sepolia'
  ) {
    return baseSepolia;
  }

  return base;
};

export const getRoomTokenId = (roomId: string) => {
  switch (roomId) {
    case 'test':
      return BigInt(1);
    case 'test-notification':
      return BigInt(2);
    default:
      return BigInt(`0x${roomId}`);
  }
};

export const highlightText = (text: string) => {
  return DOMPurify.sanitize(
    text
      .replace(/@[\w.-]+/g, '<span class="text-[#fed4bf]">$&</span>')
      .replace(
        /(https?:\/\/[^\s/$.?#].[^\s]*)/g,
        '<a href="$1" class="text-blue-800 break-all" target="_blank" rel="noopener noreferrer">$1</a>'
      )
  );
};

export const getMentionsFromText = (text: string) => {
  return text.match(/@[\w.-]+/g);
};

// This is the function we wrote earlier
export const copyTextToClipboard = async (text: string) => {
  if ('clipboard' in navigator) {
    return await navigator.clipboard.writeText(text);
  } else {
    return document.execCommand('copy', true, text);
  }
};

export const cutoffMessage = (message: string, length: number) => {
  if (message.length > length) {
    return `${message.slice(0, length)}...`;
  }
  return message;
};

export const trimAddress = (address: Hex, chars: number = 6) => {
  const start = address.substring(0, chars); // "0x" + first 4 chars
  const end = address.substring(address.length - (chars - 2)); // last 4 chars
  return `${start}...${end}`;
};

/**
 * - Copied from https://github.com/ethereumjs/ethereumjs-monorepo/blob/8ca49a1c346eb7aa61acf550f8fe213445ef71ab/packages/util/src/signature.ts#L46
 * - Returns if y is odd or not
 */
//
export const calculateSigRecovery = (v: bigint, chainId?: bigint): boolean => {
  if (v === BigInt(0) || v === BigInt(1)) {
    return v === BigInt(1) ? false : true;
  }

  if (chainId === undefined) {
    if (v === BigInt(27)) {
      return true;
    } else {
      return false;
    }
  }
  if (v === chainId * BigInt(2) + BigInt(35)) {
    return true;
  } else {
    return false;
  }
};

/**
 * Concatenate multiple Uint8Arrays into a single Uint8Array
 */
export const concatUint8Arrays = (arrays: Uint8Array[]) => {
  // Calculate combined length
  let totalLength = 0;
  for (const array of arrays) {
    totalLength += array.length;
  }

  // Create a new array with the total length
  const result = new Uint8Array(totalLength);

  // Copy each array into the result array
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }

  return result;
};

/**
 * Send a POST request with a JSON body to the specified URL.
 * The caller is responsible for handling errors.
 */
export const postJSON = async <T>({
  url,
  body,
  method,
}: {
  url: string;
  body: T;
  method: 'POST' | 'GET' | 'DELETE' | 'PUT' | 'PATCH';
}): Promise<Response> => {
  const result = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return result;
};

/**
 * Convert a `Hex` to a Buffer
 */
export const fromHexString = (hexString: Hex, size?: number): Buffer => {
  const padded = size
    ? hexString.slice(2).padStart(size * 2, '0')
    : hexString.slice(2);

  return Buffer.from(padded, 'hex');
};

export const getProofHash = (proof: Hex) => {
  return keccak256(proof);
};
