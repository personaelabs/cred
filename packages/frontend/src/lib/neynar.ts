import 'dotenv/config';
import axios from 'axios';

const neynar = axios.create({
  baseURL: 'https://api.neynar.com/v2/farcaster',
  headers: {
    accept: 'application/json',
    api_key: process.env.NEYNAR_API_KEY,
  },
});

export default neynar;
