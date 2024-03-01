/* eslint-disable react/jsx-key */
/** @jsxImportSource frog/jsx */
import { Button, Frog } from 'frog';
import { handle } from 'frog/next';
import prisma from '@/lib/prisma';
import { adminMint } from '@/lib/zora/zora';
import { getCustodyAddress } from '@/lib/neynar';

const TEXT_COLOR = '#FDA174';

const app = new Frog({
  basePath: '/api',
  // Supply a Hub API URL to enable frame verification.
  hubApiUrl: 'https://api.hub.wevm.dev',
  verify: process.env.VERCEL_ENV === 'production',
});

/**
 * Check if the user is eligible to mint the NFT.
 */
const isEligible = async (fid: number) => {
  const attestationExists = await prisma.fidAttestation.findFirst({
    where: {
      fid,
    },
  });

  return !!attestationExists;
};

app.frame('/', c => {
  return c.res({
    action: '/check',
    image: (
      <div
        style={{
          color: TEXT_COLOR,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 60,
        }}
      >
        Mint the creddd genesis NFT
      </div>
    ),
    intents: [<Button action="/check">Check eligibility</Button>],
  });
});

app.frame('/check', async c => {
  const { frameData } = c;

  if (!frameData) {
    throw new Error('No frame data');
  }

  const canMint = await isEligible(frameData.fid);

  if (canMint) {
    // The use has creddd.
    // We can mint the NFT.
    return c.res({
      action: '/mint',
      image: (
        <div
          style={{
            color: TEXT_COLOR,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 40,
          }}
        >
          Creddd found! <br />
          You are eligible to mint.
        </div>
      ),
      intents: [<Button action="/mint">Mint</Button>],
    });
  } else {
    return c.res({
      image: (
        <div
          style={{
            color: TEXT_COLOR,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            paddingLeft: 20,
            paddingRight: 20,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 40,
          }}
        >
          No creddd found.
          <br /> Add creddd to your Farcaster account to
          <br />
          become eligible to mint.
        </div>
      ),
      intents: [
        <Button.Link href="https://creddd.xyz">Add credddd</Button.Link>,
      ],
    });
  }
});

app.frame('/mint', async c => {
  const { frameData } = c;

  if (!frameData) {
    throw new Error('No frame data');
  }

  const canMint = await isEligible(frameData.fid);

  if (!canMint) {
    throw new Error('User is not eligible to mint');
  }

  // Get the custody address of the user.
  // The NFT will be minted to this address.
  const custodyAddress = await getCustodyAddress(frameData.fid);

  // Mint the NFT to the custody address.
  await adminMint(custodyAddress);

  return c.res({
    image: (
      <div
        style={{
          color: TEXT_COLOR,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          paddingLeft: 20,
          paddingRight: 20,
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 40,
        }}
      >
        Minted!
      </div>
    ),
    intents: [
      <Button.Link href={`https://zora.co/${custodyAddress}`}>
        View on Zora
      </Button.Link>,
    ],
  });
});

export const GET = handle(app);
export const POST = handle(app);
