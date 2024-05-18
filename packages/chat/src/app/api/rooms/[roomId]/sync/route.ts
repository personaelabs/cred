import { NextRequest } from 'next/server';
import viemClient from '@/lib/backend/viemClient';
import { addReaderToRoom } from '@/lib/backend/room';
import { SyncRoomRequestBody } from '@/types';
import { getUserByAddress } from '@/lib/backend/user';
import { Hex } from 'viem';

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
  const { roomId } = params;
  const body = (await req.json()) as SyncRoomRequestBody;

  const result = await viemClient.waitForTransactionReceipt({
    hash: body.buyTransactionHash,
  });
  // TODO: Wait for transaction confirmation and add user to room

  // result.logs.forEach((log) => log.topics);i
  if (result.logs.length === 0) {
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
    return Response.json(
      {
        error: 'Unexpected event signature',
      },
      { status: 400 }
    );
  }

  const to = log.topics[3];

  if (!to) {
    return Response.json(
      {
        error: "No 'to' address found in log",
      },
      { status: 400 }
    );
  }

  const toAddress: Hex = `0x${to.slice(26)}`;
  const user = await getUserByAddress(toAddress);

  if (!user) {
    return Response.json(
      {
        error: 'User not found',
      },
      { status: 400 }
    );
  }

  await addReaderToRoom({
    roomId,
    userId: user.id,
  });

  return Response.json({}, { status: 200 });
}
