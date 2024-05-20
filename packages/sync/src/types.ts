import { Hex } from 'viem';

export interface NeynarUserResponse {
  fid: number;
  username: string;
  display_name: string;
  active_status: string;
  pfp_url: string;
  verifications: Hex[];
}
