import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const K_WHALE = 5e2;
const K_EARLY = 1;
const K_BELIEVER = 1e-2; // NOTE: applies to $TICKER too for now
const K_NFT = 5e4;

// NOTE: this is to keep scores 5 digits for display purposes
const SCORE_NORM = 1e-8;

interface ScoreResult {
  score: number;
}

interface SuggestedFollowsQueryResult {
  fid: number;
  creddd: string[];
  score: number;
}

/**
 * Returns a list of suggested follows for a given user.
 * @param followingFids List of FIDs that the user is following.
 */
export async function getSuggestedFollows(
  followingFids: number[]
): Promise<SuggestedFollowsQueryResult[]> {
  const result = await prisma.$queryRaw<SuggestedFollowsQueryResult[]>`
    WITH "user_creddd" AS (
      SELECT
        fid,
        "treeId"
      FROM
        "FidAttestation"
      WHERE fid NOT IN (${Prisma.join(followingFids)})
      UNION
      SELECT
        fid,
        "treeId"
      FROM
        "IntrinsicCreddd"
      WHERE fid NOT IN (${Prisma.join(followingFids)})
    ),
    "distinct_user_creddd" AS (
      SELECT DISTINCT ON (fid,
        "Group".id)
        fid,
        "Group"."typeId",
        "Group"."displayName",
        "Group".score
      FROM
        "user_creddd"
      LEFT JOIN "MerkleTree" ON "user_creddd"."treeId" = "MerkleTree".id
      LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
      WHERE "Group".state = 'Recordable'
    ), "user_scores" AS (
      SELECT
      fid,
      ROUND(SUM(
        CASE WHEN "typeId" = 'AllHolders' THEN
          score * ${K_NFT} --- k for 'AllHolders'
        WHEN "typeId" = 'EarlyHolder' THEN
          score * ${K_EARLY} --- k for 'EarlyHolder'
        WHEN "typeId" = 'Whale' THEN
          score * ${K_WHALE} --- k for 'Whale'
        when "typeId" = 'Believer' THEN
          score * ${K_BELIEVER} --- k for 'Believer'
        when "typeId" = 'Ticker' THEN
          score * ${K_BELIEVER} --- k for 'Ticker'
        ELSE
          0
        END) * COUNT(*) * ${SCORE_NORM} ) AS score,
        ARRAY_AGG("displayName") AS creddd
    FROM
      "distinct_user_creddd"
    GROUP BY fid
    )
    SELECT
      *
    FROM
      user_scores
    ORDER BY
      score DESC
    LIMIT 3
  `;

  return result;
}

interface MedianQueryResult {
  median: number;
}

export async function getMedianScore(fids: number[]): Promise<number> {
  const result = await prisma.$queryRaw<MedianQueryResult[]>`
    WITH "user_creddd" AS (
      SELECT
        fid,
        "treeId"
      FROM
        "FidAttestation"
      WHERE fid in (${Prisma.join(fids)})
      UNION
      SELECT
        fid,
        "treeId"
      FROM
        "IntrinsicCreddd"
      WHERE fid in (${Prisma.join(fids)})
    ),
    "distinct_user_creddd" AS (
      SELECT DISTINCT ON (fid,
        "Group".id)
        fid,
        "Group"."typeId",
        "Group"."displayName",
        "Group".score
      FROM
        "user_creddd"
      LEFT JOIN "MerkleTree" ON "user_creddd"."treeId" = "MerkleTree".id
      LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
      WHERE "Group".state = 'Recordable'
    ), "user_scores" AS (
      SELECT
      fid,
      (SUM(
        CASE WHEN "typeId" = 'AllHolders' THEN
          score * ${K_NFT} --- k for 'AllHolders'
        WHEN "typeId" = 'EarlyHolder' THEN
          score * ${K_EARLY} --- k for 'EarlyHolder'
        WHEN "typeId" = 'Whale' THEN
          score * ${K_WHALE} --- k for 'Whale'
        when "typeId" = 'Believer' THEN
          score * ${K_BELIEVER} --- k for 'Believer'
        when "typeId" = 'Ticker' THEN
          score * ${K_BELIEVER} --- k for 'Ticker'
        ELSE
          0
        END) * COUNT(*) * ${SCORE_NORM} )AS score
    FROM
      "distinct_user_creddd"
    GROUP BY fid
    )
    SELECT
      ROUND(percentile_cont(0.5)
      WITHIN GROUP (ORDER BY "score")) AS median
    FROM
      user_scores
  `;

  if (result.length === 0) {
    return 0;
  }

  return result[0].median;
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
      ),
      "distinct_user_creddd" AS (
        SELECT DISTINCT ON (fid,
          "Group".id)
          fid,
          "Group"."typeId",
          "Group"."displayName",
          "Group".score
        FROM
          "user_creddd"
        LEFT JOIN "MerkleTree" ON "user_creddd"."treeId" = "MerkleTree".id
        LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
        WHERE "Group".state = 'Recordable'
      )
    SELECT
        (SUM(
          CASE WHEN "typeId" = 'AllHolders' THEN
            score * ${K_NFT} --- k for 'AllHolders'
          WHEN "typeId" = 'EarlyHolder' THEN
            score * ${K_EARLY} --- k for 'EarlyHolder'
          WHEN "typeId" = 'Whale' THEN
            score * ${K_WHALE} --- k for 'Whale'
          when "typeId" = 'Believer' THEN
            score * ${K_BELIEVER} --- k for 'Believer'
          when "typeId" = 'Ticker' THEN
            score * ${K_BELIEVER} --- k for 'Ticker'
          ELSE
            0
          END) * COUNT(*) )AS score
      FROM
        "distinct_user_creddd"
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
      ),
      "distinct_user_creddd" AS (
        SELECT DISTINCT ON (fid,
          "Group".id)
          fid,
          "Group"."typeId",
          "Group"."displayName",
          "Group".score
        FROM
          "user_creddd"
        LEFT JOIN "MerkleTree" ON "user_creddd"."treeId" = "MerkleTree".id
        LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
        WHERE "Group".state = 'Recordable'
      )
   SELECT
      fid,
      (SUM(
        CASE WHEN "typeId" = 'AllHolders' THEN
          score * ${K_NFT} --- k for 'AllHolders'
        WHEN "typeId" = 'EarlyHolder' THEN
          score * ${K_EARLY} --- k for 'EarlyHolder'
        WHEN "typeId" = 'Whale' THEN
          score * ${K_WHALE} --- k for 'Whale'
        when "typeId" = 'Believer' THEN
          score * ${K_BELIEVER} --- k for 'Believer'
        when "typeId" = 'Ticker' THEN
          score * ${K_BELIEVER} --- k for 'Ticker'
        ELSE
          0
        END) * COUNT(*)) AS score,
      ARRAY_AGG("displayName") AS creddd
    FROM
      "distinct_user_creddd"
    GROUP BY
      fid
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
