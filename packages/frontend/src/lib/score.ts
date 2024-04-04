import prisma from '@/lib/prisma';

const K_WHALE = 1e2;
const K_EARLY = 1e-1;
const K_BELIEVER = 1e-2; // NOTE: applies to $TICKER too for now
const K_NFT = 5e4;

// NOTE: this is to keep scores 5 digits for display purposes
const SCORE_NORM = 1e-8;

interface ScoreResult {
  score: number;
}

export async function getUserScore(fid: number): Promise<number> {
  const result = await prisma.$queryRaw<ScoreResult[]>`
    WITH "user_creddd" AS (
      SELECT
        fid,
        "treeId"
      FROM
        "FidAttestation"
      WHERE fid = ${fid}
      UNION
      SELECT
        fid,
        "treeId"
      FROM
        "IntrinsicCreddd"
        WHERE fid = ${fid}
    )
   SELECT
      SUM(
        CASE WHEN "Group"."typeId" = 'AllHolders' THEN
          score * ${K_NFT} --- k for 'AllHolders'
        WHEN "Group"."typeId" = 'EarlyHolder' THEN
          score * ${K_EARLY} --- k for 'EarlyHolder'
        WHEN "Group"."typeId" = 'Whale' THEN
          score * ${K_WHALE} --- k for 'Whale'
        when "Group"."typeId" = 'Believer' THEN
          score * ${K_BELIEVER} --- k for 'Believer'
        when "Group"."typeId" = 'Ticker' THEN
          score * ${K_BELIEVER} --- k for 'Ticker'
        ELSE
          0
        END) AS score
    FROM
      "user_creddd"
      LEFT JOIN "MerkleTree" ON "user_creddd"."treeId" = "MerkleTree".id
      LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
  `;

  if (result.length === 0) {
    return 0;
  }

  return result[0].score * SCORE_NORM;
}

interface LeaderboardResult {
  fid: number;
  score: number;
  creddd: string[];
}

export async function getLeaderboardUsers(): Promise<LeaderboardResult[]> {
  const result = await prisma.$queryRaw<LeaderboardResult[]>`
    WITH "user_creddd" AS (
        SELECT
          fid,
          "treeId"
        FROM
          "FidAttestation"
        UNION
        SELECT
          fid,
          "treeId"
        FROM
          "IntrinsicCreddd"
      )
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
        when "Group"."typeId" = 'Ticker' THEN
          score * ${K_BELIEVER} --- k for 'Ticker'
        ELSE
          0
        END) AS score,
      ARRAY_AGG("Group"."displayName") AS creddd
    FROM
      "user_creddd"
      LEFT JOIN "MerkleTree" ON "user_creddd"."treeId" = "MerkleTree".id
      LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
    GROUP BY
      "user_creddd".fid
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
