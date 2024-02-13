import dotenv from 'dotenv';
dotenv.config();

export const SIGNER_UUID = process.env.SIGNER_UUID!;
export const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!;
export const FID = process.env.FID! || 345834;
