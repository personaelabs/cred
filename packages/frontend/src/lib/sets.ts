const SETS = ['nouns-forker', 'large-contract-deployer', 'large-nft-trader'];

if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
  // Append the test sets
  SETS.forEach((set) => {
    SETS.push(`${set}.dev`);
  });
}

export default SETS;
