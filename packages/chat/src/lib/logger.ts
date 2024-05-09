import axios from './axios';

export const log = async (message: string) => {
  if (process.env.NODE_ENV !== 'production') {
    await axios.post('api/log', {
      message,
    });
  }
};
