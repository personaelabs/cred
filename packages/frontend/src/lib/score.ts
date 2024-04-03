import prisma from '@/lib/prisma';

interface LeaderboardResult {
  fid: number;
  score: number;
  creddd: string[];
}

const K_WHALE = 1e2;
const K_EARLY = 1e-1;
const K_BELIEVER = 1e-2; // NOTE: applies to $TICKER too for now
const K_NFT = 5e4;

// NOTE: this is to keep scores 5 digits for display purposes
const SCORE_NORM = 1e-6;

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
    LIMIT 15
  `;

  return result.map(record => ({
    fid: record.fid,
    score: record.score * SCORE_NORM,
    creddd: record.creddd,
  }));
}
