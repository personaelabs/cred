import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

const CREDBOT_FID = 345834;
const PERSONAE_CHANNEL_NAME = 'personae;';

function toHexString(byteArray: Uint8Array): string {
  return (
    '0x' +
    byteArray.reduce(
      (output, elem) => output + ('0' + elem.toString(16)).slice(-2),
      ''
    )
  );
}

interface Cast {
  id: number;
  fid: string;
  created_at: Date;
  hash: Uint8Array;
  text: string;
  parent_hash: Uint8Array;
  parent_fid: string;
}

class CastProcessor {
  private sourceDbConfig: any;
  private sourceClient: Client;
  private prisma: PrismaClient;

  constructor(dbConfig: any, prisma: PrismaClient) {
    this.sourceDbConfig = dbConfig;
    this.prisma = prisma;
    this.sourceClient = new Client(this.sourceDbConfig);
  }

  public async connectSourceClient(): Promise<void> {
    await this.sourceClient.connect();
  }

  public async disconnectSourceClient(): Promise<void> {
    await this.sourceClient.end();
  }

  /**
   *  We determne which casts are relevant to our interests by checking the mentions column for our @credbot user ID.
   * @param lastProcessedTimestamp
   * @returns The timestamp of the most recent processed cast or null if no new casts were processed.
   */
  public async processNewCasts(
    lastProcessedTimestamp: string
  ): Promise<string | null> {
    try {
      const newCastsQuery = `
                SELECT * 
                FROM casts 
                WHERE ${CREDBOT_FID} = ANY(mentions)
                AND created_at > $1
                ORDER BY created_at ASC;`;

      const { rows: newCasts } = await this.sourceClient.query<Cast>(
        newCastsQuery,
        [lastProcessedTimestamp]
      );

      for (const cast of newCasts) {
        if (!(await this.isCastProcessed(Number(cast.id)))) {
          await this.prisma.processedCast.upsert({
            where: {
              castId: Number(cast.id),
            },
            create: {
              hash: toHexString(cast.hash),
              originalText: cast.text,
              castId: Number(cast.id),
              castCreatedAt: cast.created_at,
              status: 'pending', // Iniitally pending, so we know we at least saw it, before we attempt to engage further.
              actionDetails: '{}',
            },
            update: {
              hash: toHexString(cast.hash),
              originalText: cast.text,
              castId: Number(cast.id),
              castCreatedAt: cast.created_at,
              status: 'pending', // Iniitally pending, so we know we at least saw it, before we attempt to engage further.
            },
          });

          // OK now what is this?
          // If `cast.text` has "boost" in it, then we want to boost it.
          // Normalize for case-insensitivity
          if (cast.text.toLowerCase().includes('boost')) {
            await this.bootCast(cast);
          } else if (cast.text.toLowerCase().includes('flex')) {
            await this.flexCast(cast);
          }
        } else {
          console.log(`Skipping already processed cast with ID: ${cast.id}`);
        }
      }

      // Return the timestamp of the most processed recent cast
      if (newCasts.length > 0) {
        return newCasts[newCasts.length - 1].created_at.toISOString();
      }
    } catch (error) {
      console.error('Error processing new casts:', error);
    }

    return null;
  }

  private async bootCast(cast: Cast): Promise<void> {
    try {
      // First check that the parent message's owner has creddd.
      // If there's no parent FID this isn't a reply, so we can't do anything.
      if (!cast.parent_fid) {
        console.log('No parent FID, skipping');
        return;
      }

      const hasFidAttestation = await this.prisma.fidAttestation.findFirst({
        where: {
          fid: Number(cast.parent_fid),
        },
      });

      if (!hasFidAttestation) {
        console.log('User does not have creddd, skipping');
        return;
      }

      const userResp = await neynarClient.lookupUserByFid(
        Number(cast.parent_fid)
      );

      // TODO: write this BOOST copy!
      const newMessage = `@${userResp.result.user.username} @ https://path/to/creddd/profile`;

      if (
        process.env.NODE_ENV !== 'production' ||
        process.env.IS_PULL_REQUEST === 'true' // Render sets `IS_PULL_REQUEST` to 'true' in PR builds
      ) {
        console.log('Skipping publishing cast in non-production environment');
      } else {
        await neynarClient.publishCast(process.env.SIGNER_UUID!, newMessage, {
          embeds: [
            {
              cast_id: { fid: Number(cast.fid), hash: toHexString(cast.hash) },
            },
          ],
          channelId: PERSONAE_CHANNEL_NAME,
        });

        await this.prisma.processedCast.update({
          where: {
            castId: Number(cast.id),
          },
          data: {
            status: 'boosted',
            processedTime: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Error processing new casts:', error);
      await this.prisma.processedCast.update({
        where: {
          castId: Number(cast.id),
        },
        data: {
          status: 'error-in-boosted',
          processingError: JSON.stringify(error),
        },
      });
    }
  }

  private async flexCast(cast: Cast): Promise<void> {
    try {
      // First check that the parent message's owner has creddd.
      // If there's no parent FID this isn't a reply, so we can't do anything.
      if (!cast.parent_fid) {
        console.log('No parent FID, skipping');
        return;
      }

      const hasFidAttestation = await this.prisma.fidAttestation.findFirst({
        where: {
          fid: Number(cast.parent_fid),
        },
      });

      if (!hasFidAttestation) {
        console.log('User does not have creddd, skipping');
        return;
      }

      const newMessage = `Look a this cool profile: @ https://test`;
      if (
        process.env.NODE_ENV !== 'production' ||
        process.env.IS_PULL_REQUEST === 'true' // Render sets `IS_PULL_REQUEST` to 'true' in PR builds
      ) {
        console.log('Skipping publishing cast in non-production environment');
      } else {
        console.log('Publishing cast in production environment');
        await neynarClient.publishCast(process.env.SIGNER_UUID!, newMessage, {
          replyTo: toHexString(cast.parent_hash),
        });

        await this.prisma.processedCast.update({
          where: {
            castId: Number(cast.id),
          },
          data: {
            status: 'flexed',
            processedTime: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Error processing new casts:', error);
      await this.prisma.processedCast.update({
        where: {
          castId: Number(cast.id),
        },
        data: {
          status: 'error-in-flex',
          processingError: JSON.stringify(error),
        },
      });
    }
  }

  private async isCastProcessed(castId: number): Promise<boolean> {
    const count = await this.prisma.processedCast.count({
      where: {
        castId: castId,
      },
    });
    return count > 0;
  }
}

export default CastProcessor;
