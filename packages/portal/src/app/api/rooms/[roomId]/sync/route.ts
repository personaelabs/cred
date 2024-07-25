import { NextRequest } from 'next/server';
import viemClient from '@/lib/backend/viemClient';
import { addReaderToRoom, getUserByAddress } from '@cred/firebase-admin';
import { SyncRoomRequestBody } from '@/types';
import { Hex, decodeEventLog, parseAbi, zeroAddress } from 'viem';
import { tokenIdToRoomId } from '@cred/shared';
import logger from '@/lib/backend/logger';

const KEY_PURCHASED_EVENT_SIG =
  '0x226015c06d85264c96d322315dda5847b00015b94f0e0619f813b521dea64883';

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
    hash: body.txHash,
  });

  if (result.logs.length === 0) {
    logger.error('No logs found', {
      txHash: body.txHash,
    });
    return Response.json(
      {
        error: 'No logs found',
      },
      { status: 400 }
    );
  }

  const log = result.logs.find(
    log => log.topics[0] === KEY_PURCHASED_EVENT_SIG
  );

  if (!log) {
    logger.error(`No log with KeyPurchased event sig`, {
      txHash: result.transactionHash,
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
      'event KeyPurchased(address indexed purchaser, uint256 indexed keyId)',
    ]),
    data: log.data,
    topics: log.topics,
  });

  const purchaser = eventLog.args.purchaser;
  const keyId = eventLog.args.keyId;

  const roomId = tokenIdToRoomId(BigInt(keyId));

  if (params.roomId !== roomId) {
    logger.error(`Room ID does not match: ${params.roomId} !== ${roomId}`);
    return Response.json(
      {
        error: 'Room ID does not match',
      },
      { status: 400 }
    );
  }

  if (purchaser !== zeroAddress) {
    const purchaserUser = await getUserByAddress(
      purchaser.toLowerCase() as Hex
    );

    if (!purchaserUser) {
      logger.error(`"purchaser" User not found: ${purchaser}`, {
        txHash: log.transactionHash,
      });
      return Response.json(
        {
          error: '"purchaser" User not found',
        },
        { status: 400 }
      );
    }

    await addReaderToRoom({
      roomId,
      userId: purchaserUser.id,
    });
  }

  return Response.json({}, { status: 200 });
}
