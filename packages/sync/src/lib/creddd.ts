import { Client } from 'pg';

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

export const credddDb = new Client({
  connectionString: DATABASE_URL,
});

export const getGroups = async () => {
  const groupsWithFids = await credddDb.query<{
    fids: number[];
    id: string;
    displayName: string;
  }>(`
     WITH user_creddd AS (
      SELECT
        "FidAttestation".fid,
        "FidAttestation"."treeId"
      FROM
        "FidAttestation"
      UNION
      SELECT
        "IntrinsicCreddd".fid,
        "IntrinsicCreddd"."treeId"
      FROM
        "IntrinsicCreddd"
    ),
    distinct_user_creddd AS (
      SELECT DISTINCT ON (user_creddd.fid,
        "Group".id)
        user_creddd.fid,
        "Group".id AS "groupId",
        "Group"."typeId",
        "Group"."displayName"
      FROM
        user_creddd
      LEFT JOIN "MerkleTree" ON user_creddd. "treeId" = "MerkleTree".id
      LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
    WHERE
      "Group".state = 'Recordable'::"GroupState"
    )
    SELECT
      ARRAY_AGG(fid) AS "fids", "groupId" AS "id", "displayName"
    FROM
      distinct_user_creddd
    GROUP BY
      ("groupId",
        "displayName")
      `);

  return groupsWithFids.rows;
};
