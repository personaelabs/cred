export interface UserCredddQueryResult {
  creddd: string[];
  groupIds: string[];
  fid: number;
  score: number;
}

export interface GroupWithFidsQueryResult {
  groupId: string;
  fids: number[];
}
