import { useQuery } from '@tanstack/react-query';
import { LeaderBoardRecord } from '@/app/types';
import { captureFetchError } from '@/lib/utils';

const useLeaderBoardQuery = () =>
  useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard');

      if (!response.ok) {
        await captureFetchError(response);
        throw new Error('Failed to fetch leaderboard');
      }

      return (await response.json()) as LeaderBoardRecord[];
    },
  });

export default useLeaderBoardQuery;
