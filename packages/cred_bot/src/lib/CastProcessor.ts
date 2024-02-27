import { PrismaClient } from '@prisma/client';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

const CREDBOT_FID = 345834;
const PERSONAE_CHANNEL_NAME = 'personae';

const IS_PROD =
  process.env.NODE_ENV === 'production' &&
  process.env.IS_PULL_REQUEST !== 'true';

console.log('IS_PROD:', IS_PROD);

interface Cast {
  fid: string;
  timestamp: Date;
  hash: string;
  text: string;
  parent_hash: string | null;
  parent_fid: string | null;
}

class CastProcessor {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   *  We determne which casts are relevant to our interests by checking the mentions column for our @credbot user ID.
   * @param lastProcessedTimestamp
   * @returns The timestamp of the most recent processed cast or null if no new casts were processed.
   */
  public async processNewCasts(): Promise<void> {
    // Use a longer interval in development and PR environments to avoid rate limiting.
    const interval = IS_PROD ? 1500 : 5000;

    setInterval(async () => {
      const startTime = new Date();
      try {
        // Keep fetching the latest 5 mentions every 1.5 seconds.
        const result = await neynarClient.fetchMentionAndReplyNotifications(
          CREDBOT_FID,
          {
            limit: 5,
          }
        );

        const newCasts =
          result.result.notifications?.filter(notification =>
            notification.mentionedProfiles.some(p => p.fid === CREDBOT_FID)
          ) || [];

        for (const cast of newCasts) {
          if (!(await this.isCastProcessed(cast.hash))) {
            await this.prisma.processedCast.upsert({
              where: {
                hash: cast.hash,
              },
              create: {
                hash: cast.hash,
                originalText: cast.text,
                timestamp: cast.timestamp,
                status: 'pending', // Iniitally pending, so we know we at least saw it, before we attempt to engage further.
                actionDetails: '{}',
              },
              update: {
                hash: cast.hash,
                originalText: cast.text,
                timestamp: cast.timestamp,
                status: 'pending', // Iniitally pending, so we know we at least saw it, before we attempt to engage further.
              },
            });

            // OK now what is this?
            // If `cast.text` has "boost" in it, then we want to boost it.
            // Normalize for case-insensitivity
            if (cast.text.toLowerCase().includes('boost')) {
              await this.bootCast({
                fid: cast.author.fid.toString(),
                timestamp: new Date(cast.timestamp),
                hash: cast.hash,
                text: cast.text,
                parent_fid: cast.parentAuthor.fid?.toString() || null,
                parent_hash: cast.parentHash,
              });
            } else if (cast.text.toLowerCase().includes('flex')) {
              await this.flexCast({
                fid: cast.author.fid.toString(),
                timestamp: new Date(cast.timestamp),
                hash: cast.hash,
                text: cast.text,
                parent_fid: cast.parentAuthor.fid?.toString() || null,
                parent_hash: cast.parentHash,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error processing new casts:', error);
      }
      const endTime = new Date();
      console.log(`Processed in ${endTime.getTime() - startTime.getTime()}ms`);
    }, interval);
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

      const newMessage = `user @${userResp.result.user.username} verified: https://creddd.xyz/user/${cast.parent_fid}`;
      if (IS_PROD) {
        // We only send the message in production until we have a dedicated dev bot.
        await neynarClient.publishCast(process.env.SIGNER_UUID!, newMessage, {
          embeds: [{ cast_id: { fid: Number(cast.fid), hash: cast.hash } }],
          channelId: PERSONAE_CHANNEL_NAME,
        });
      }

      // Log new message.
      console.log('New message:', newMessage);

      await this.prisma.processedCast.update({
        where: {
          hash: cast.hash,
        },
        data: {
          status: 'boosted',
          processedTime: new Date(),
        },
      });
    } catch (error) {
      console.error('Error processing new casts:', error);
      await this.prisma.processedCast.update({
        where: {
          hash: cast.hash,
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

      const userResp = await neynarClient.lookupUserByFid(
        Number(cast.parent_fid)
      );

      const newMessage = `user @${userResp.result.user.username} verified: https://creddd.xyz/user/${cast.parent_fid}`;
      if (IS_PROD) {
        await neynarClient.publishCast(process.env.SIGNER_UUID!, newMessage, {
          replyTo: cast.parent_hash as string,
        });
      }

      // Log new message.
      console.log('New message:', newMessage);

      await this.prisma.processedCast.update({
        where: {
          hash: cast.hash,
        },

        data: {
          status: 'flexed',
          processedTime: new Date(),
        },
      });
    } catch (error) {
      console.error('Error processing new casts:', error);
      await this.prisma.processedCast.update({
        where: {
          hash: cast.hash,
        },
        data: {
          status: 'error-in-flex',
          processingError: JSON.stringify(error),
        },
      });
    }
  }

  private async isCastProcessed(hash: string): Promise<boolean> {
    const count = await this.prisma.processedCast.count({
      where: {
        hash,
      },
    });
    return count > 0;
  }
}

export default CastProcessor;
