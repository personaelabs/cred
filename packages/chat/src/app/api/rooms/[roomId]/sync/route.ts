import { NextRequest } from 'next/server';
import viemClient from '@/lib/backend/viemClient';
import {
  addReaderToRoom,
  getUserByAddress,
  removeUserFromRoom,
} from '@cred/firebase';
import { SyncRoomRequestBody } from '@/types';
import { Hex, decodeEventLog, parseAbi, zeroAddress } from 'viem';
import { tokenIdToRoomId } from '@cred/shared';
import { logger } from '@cred/shared';

const TRANSFER_SINGLE_EVENT_SIG =
  '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62';

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      roomId: string;
    };
  }
) {
  const body = (await req.json()) as SyncRoomRequestBody;

  const result = await viemClient.waitForTransactionReceipt({
    hash: body.buyTransactionHash,
  });

  if (result.logs.length === 0) {
    logger.error('No logs found', {
      txHash: body.buyTransactionHash,
    });
    return Response.json(
      {
        error: 'No logs found',
      },
      { status: 400 }
    );
  }

  const log = result.logs[0];

  const eventSig = log.topics[0];

  if (eventSig !== TRANSFER_SINGLE_EVENT_SIG) {
    logger.error(`Unexpected event signature ${eventSig}`, {
      txHash: log.transactionHash,
    });
    return Response.json(
      {
        error: 'Unexpected event signature',
      },
      { status: 400 }
    );
  }

  const eventLog = decodeEventLog({
    abi: parseAbi([
      'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
    ]),
    data: log.data,
    topics: log.topics,
  });

  const from = eventLog.args.from;
  const to = eventLog.args.to;
  const tokenId = eventLog.args.id;

  if (!tokenId) {
    logger.error('No tokenId found in log', {
      txHash: log.transactionHash,
    });
    return Response.json(
      {
        error: 'No tokenId found in log',
      },
      { status: 400 }
    );
  }

  const roomId = tokenIdToRoomId(BigInt(tokenId));

  if (params.roomId !== roomId) {
    logger.error(`Room ID does not match: ${params.roomId} !== ${roomId}`);
    return Response.json(
      {
        error: 'Room ID does not match',
      },
      { status: 400 }
    );
  }

  if (to !== zeroAddress) {
    const transferToUser = await getUserByAddress(to.toLowerCase() as Hex);

    if (!transferToUser) {
      logger.error(`"to" User not found: ${from}`, {
        txHash: log.transactionHash,
      });
      return Response.json(
        {
          error: '"to" User not found',
        },
        { status: 400 }
      );
    }

    await addReaderToRoom({
      roomId,
      userId: transferToUser.id,
    });
  }

  if (from !== zeroAddress) {
    const transferFromUser = await getUserByAddress(from.toLowerCase() as Hex);

    if (!transferFromUser) {
      logger.error(`"from" User not found: ${from}`, {
        txHash: log.transactionHash,
      });
      return Response.json(
        {
          error: '"from" User not found',
        },
        { status: 400 }
      );
    }

    await removeUserFromRoom({
      roomId,
      userId: transferFromUser.id,
    });
  }

  return Response.json({}, { status: 200 });
}
