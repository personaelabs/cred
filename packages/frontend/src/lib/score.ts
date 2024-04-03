import prisma from '@/lib/prisma';

interface LeaderboardResult {
  fid: number;
  score: number;
  creddd: string[];
}

const K_WHALE = 100;
const K_EARLY = 10;
const K_BELIEVER = 1; // NOTE: applies to $TICKER too for now

const K_NFT = 200000;

export async function getLeaderboardUsers(): Promise<LeaderboardResult[]> {
  const result = await prisma.$queryRaw<LeaderboardResult[]>`
   SELECT
      fid,
      SUM(
        CASE WHEN "Group"."typeId" = 'AllHolders' THEN
          score * ${K_NFT} --- k for 'AllHolders'
        WHEN "Group"."typeId" = 'EarlyHolder' THEN
          score * ${K_EARLY} --- k for 'EarlyHolder'
        WHEN "Group"."typeId" = 'Whale' THEN
          score * ${K_WHALE} --- k for 'Whale'
        when "Group"."typeId" = 'Believer' THEN
          score * ${K_BELIEVER} --- k for 'Believer'
        when "Group"."typeId" = 'Believer' THEN
          score * ${K_BELIEVER} --- k for 'Believer'
        ELSE
          0
        END) AS score,
      ARRAY_AGG("Group"."displayName") AS creddd
    FROM
      "FidAttestation"
      LEFT JOIN "MerkleTree" ON "FidAttestation"."treeId" = "MerkleTree".id
      LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
    GROUP BY
      "FidAttestation".fid
    ORDER BY
      score DESC
    LIMIT 10
  `;

  return result;
}
