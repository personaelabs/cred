/* eslint-disable react/jsx-key */
/** @jsxImportSource frog/jsx */
import { Button, Frog } from 'frog';
import { handle } from 'frog/next';
import prisma from '@/lib/prisma';
import { adminMint } from '@/lib/zora/zora';
import { getCustodyAddress } from '@/lib/neynar';

const TEXT_COLOR = '#FDA174';
const CONTAINER_STYLE = {
  color: TEXT_COLOR,
  display: 'flex',
  flexDirection: 'column' as any,
  width: '100%',
  paddingLeft: 20,
  paddingRight: 20,
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
};

const CREDDD_GENESIS_TOKEN_ID = 1;

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

/**
 * Check if the user has already minted the NFT.
 */
const hasMinted = async (tokenId: number, fid: number) => {
  const mingLog = await prisma.mintLog.findUnique({
    where: {
      fid_tokenId: {
        fid,
        tokenId,
      },
    },
  });

  return !!mingLog;
};

app.frame('/', c => {
  return c.res({
    action: '/check',
    image: (
      <div
        style={{
          ...CONTAINER_STYLE,
          fontSize: 60,
        }}
      >
        Mint the creddd genesis NFT
      </div>
    ),
    intents: [<Button action="/check">Check eligibility</Button>],
  });
});

/**
 * Check if the user is eligible to mint the NFT.
 * Renders a "Mint" button if the user is eligible,
 * otherwise renders a "Add creddd" button.
 */
app.frame('/check', async c => {
  const { frameData } = c;

  if (!frameData) {
    throw new Error('No frame data');
  }

  const alreadyMinted = await hasMinted(CREDDD_GENESIS_TOKEN_ID, frameData.fid);

  if (alreadyMinted) {
    const custodyAddress = await getCustodyAddress(frameData.fid);
    return c.res({
      image: (
        <div
          style={{
            ...CONTAINER_STYLE,
            fontSize: 40,
          }}
        >
          Already minted
        </div>
      ),
      intents: [
        <Button.Link href={`https://zora.co/${custodyAddress}`}>
          View on Zora
        </Button.Link>,
      ],
    });
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
            ...CONTAINER_STYLE,
            fontSize: 40,
          }}
        >
          Creddd found! <br />
          You are eligible to mint.
        </div>
      ),
      intents: [<Button>Mint</Button>],
    });
  } else {
    return c.res({
      image: (
        <div
          style={{
            ...CONTAINER_STYLE,
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

/**
 * Mint the NFT to the user's custody address
 * and render a "View on Zora" button.
 */
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

  // Check if the NFT has already been minted
  const alreadyMinted = await hasMinted(CREDDD_GENESIS_TOKEN_ID, frameData.fid);

  // Mint the NFT if it has not been minted already.
  if (!alreadyMinted) {
    // Mint the NFT to the custody address.
    await adminMint(custodyAddress);

    // Save the mint log.
    await prisma.mintLog.create({
      data: {
        tokenId: CREDDD_GENESIS_TOKEN_ID,
        fid: frameData.fid,
      },
    });
  }

  return c.res({
    image: (
      <div
        style={{
          ...CONTAINER_STYLE,
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

app.frame('/about', async c => {
  const { frameData } = c;

  if (!frameData) {
    throw new Error('No frame data');
  }

  return c.res({
    image: (
      <div
        style={{
          ...CONTAINER_STYLE,
          fontSize: 40,
        }}
      >
        About
      </div>
    ),
    intents: [<Button.Reset>Back</Button.Reset>],
  });
});

export const GET = handle(app);
export const POST = handle(app);
