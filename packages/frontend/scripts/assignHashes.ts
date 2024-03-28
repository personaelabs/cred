import prisma from '@/lib/prisma';
import { getFidAttestationHashV1 } from '@/lib/utils';
import { Hex } from 'viem';

const assignHashes = async () => {
  const attestations = await prisma.fidAttestation.findMany({
    select: {
      fid: true,
      MerkleTree: {
        select: {
          id: true,
          merkleRoot: true,
        },
      },
    },
  });

  for (const attestation of attestations) {
    const { fid, MerkleTree } = attestation;
    const { merkleRoot } = MerkleTree;

    const hash = getFidAttestationHashV1(merkleRoot as Hex, fid);

    await prisma.fidAttestation.update({
      where: {
        fid_treeId: {
          fid,
          treeId: MerkleTree.id,
        },
      },
      data: {
        hash: hash as string,
      },
    });
  }
};

assignHashes();
