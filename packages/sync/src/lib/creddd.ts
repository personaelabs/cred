import { Group } from '@cred/shared';
import { Client } from 'pg';

const { CREDDD_DB_URL } = process.env;

if (!CREDDD_DB_URL) {
  throw new Error('CREDDD_DB_URL is not defined');
}

export const credddDb = new Client({
  connectionString: CREDDD_DB_URL,
});

export const getGroups = async () => {
  const groupsWithFids = await credddDb.query<Omit<Group, 'updatedAt'>>(`
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
