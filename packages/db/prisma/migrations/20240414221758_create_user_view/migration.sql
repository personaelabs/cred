CREATE VIEW "User" AS
         (WITH user_creddd AS (
         SELECT "FidAttestation".fid,
            "FidAttestation"."treeId"
           FROM "FidAttestation"
        UNION
         SELECT "IntrinsicCreddd".fid,
            "IntrinsicCreddd"."treeId"
           FROM "IntrinsicCreddd"
        ), distinct_user_creddd AS (
         SELECT DISTINCT ON (user_creddd.fid, "Group".id) user_creddd.fid,
            "Group".id as "groupId",
            "Group"."typeId",
            "Group"."displayName",
            "Group".score
           FROM user_creddd
             LEFT JOIN "MerkleTree" ON user_creddd."treeId" = "MerkleTree".id
             LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
          WHERE "Group".state = 'Recordable'::"GroupState"
        )
        SELECT distinct_user_creddd.fid,
            round(sum(
                CASE
                    WHEN distinct_user_creddd."typeId" = 'AllHolders'::"GroupType" THEN distinct_user_creddd.score::numeric * '50000'::numeric
                    WHEN distinct_user_creddd."typeId" = 'EarlyHolder'::"GroupType" THEN (distinct_user_creddd.score * 1)::numeric
                    WHEN distinct_user_creddd."typeId" = 'Whale'::"GroupType" THEN distinct_user_creddd.score::numeric * '500'::numeric
                    WHEN distinct_user_creddd."typeId" = 'Believer'::"GroupType" THEN distinct_user_creddd.score::numeric * 0.01
                    WHEN distinct_user_creddd."typeId" = 'Ticker'::"GroupType" THEN distinct_user_creddd.score::numeric * 0.01
                    ELSE 0::numeric
                END) * count(*)::numeric * 0.00000001) AS score,
            array_agg(distinct_user_creddd."displayName") AS creddd,
            array_agg(distinct_user_creddd."groupId") AS "groupIds"
        FROM distinct_user_creddd
        GROUP BY distinct_user_creddd.fid
        ORDER BY (round(sum(
                CASE
                    WHEN distinct_user_creddd."typeId" = 'AllHolders'::"GroupType" THEN distinct_user_creddd.score::numeric * '50000'::numeric
                    WHEN distinct_user_creddd."typeId" = 'EarlyHolder'::"GroupType" THEN (distinct_user_creddd.score * 1)::numeric
                    WHEN distinct_user_creddd."typeId" = 'Whale'::"GroupType" THEN distinct_user_creddd.score::numeric * '500'::numeric
                    WHEN distinct_user_creddd."typeId" = 'Believer'::"GroupType" THEN distinct_user_creddd.score::numeric * 0.01
                    WHEN distinct_user_creddd."typeId" = 'Ticker'::"GroupType" THEN distinct_user_creddd.score::numeric * 0.01
                    ELSE 0::numeric
                END) * count(*)::numeric * 0.00000001)) DESC
                );
            