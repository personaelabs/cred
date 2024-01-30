import { MerkleTreeSelect } from '@/app/api/groups/[group]/merkle-proofs/route';
import { useEffect, useState } from 'react';

const useMerkleTree = (space: string) => {
  const [tree, setTree] = useState<MerkleTreeSelect | null>(null);

  useEffect(() => {
    fetch(`/api/spaces/${space}/merkle-proofs`)
      .then(res => res.json())
      .then(tree => setTree(tree));
  }, [space]);

  return tree;
};

export default useMerkleTree;
