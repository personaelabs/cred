pg_dump $DATABASE_URL --data-only -t "\"Group\"" > Group.sql && \
pg_dump $DATABASE_URL --data-only -t "\"MerkleTree\"" > MerkleTree.sql && \
pg_dump $DATABASE_URL --data-only -t "\"IntrinsicCreddd\"" > IntrinsicCreddd.sql && \
pg_dump $DATABASE_URL --data-only -t "\"FidAttestation\"" > FidAttestation.sql && \

LOCAL_DB=postgresql://anon:iamanon@127.0.0.1/anon-boost
psql $LOCAL_DB -f Group.sql && \
psql $LOCAL_DB -f MerkleTree.sql && \
psql $LOCAL_DB -f IntrinsicCreddd.sql && \
psql $LOCAL_DB -f FidAttestation.sql && \
rm Group.sql MerkleTree.sql IntrinsicCreddd.sql FidAttestation.sql

