echo "Cloning "Group"..."; \
pg_dump $DATABASE_URL --data-only -t "\"Group\"" > Group.sql && \

echo "Cloning "MerkleTree"..."; \
pg_dump $DATABASE_URL --data-only -t "\"MerkleTree\"" > MerkleTree.sql && \

echo "Cloning "IntrinsicCreddd"..."; \
pg_dump $DATABASE_URL --data-only -t "\"IntrinsicCreddd\"" > IntrinsicCreddd.sql && \

echo "Cloning "FidAttestation"..."; \
pg_dump $DATABASE_URL --data-only -t "\"FidAttestation\"" > FidAttestation.sql && \

LOCAL_DB=postgresql://anon:iamanon@127.0.0.1/anon-boost

echo "Clearing local db..."; \
psql $LOCAL_DB -f clear.sql && \ 

echo "Inserting "Group"..."; \
psql $LOCAL_DB -f Group.sql && \

echo "Inserting "MerkleTree"..."; \
psql $LOCAL_DB -f MerkleTree.sql && \

echo "Inserting "IntrinsicCreddd"..."; \
psql $LOCAL_DB -f IntrinsicCreddd.sql && \

echo "Inserting "FidAttestation"..."; \
psql $LOCAL_DB -f FidAttestation.sql && \
rm Group.sql MerkleTree.sql IntrinsicCreddd.sql FidAttestation.sql

