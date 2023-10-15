import { useLazyQuery } from '@airstack/airstack-react';

const query = (fid: string) => `
query MyQuery {
    Socials(
      input: {filter: {dappName: {_eq: farcaster}, identity: {_eq: "fc_fid:${fid}"}}, blockchain: ethereum}
    ) {
      Social {
        id
        userId
        profileImage
        profileUrl
        userHomeURL
        userRecoveryAddress
        userAssociatedAddresses
        profileName
        profileTokenUri
        isDefault
        identity
      }
    }
  }
`;

export const useFcProfile = (fid: string) => useLazyQuery(query(fid));
