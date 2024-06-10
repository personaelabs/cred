const credddKeys = {
  eligibleCreddd: (address: string | null) => ['eligible-creddd', { address }],
  addressGroups: (address: string | null) => ['address-groups', { address }],
  merkleTrees: ['merkle-trees'] as const,
  creddd: (credddId: string) => ['creddd', { credddId }],
};

export default credddKeys;
