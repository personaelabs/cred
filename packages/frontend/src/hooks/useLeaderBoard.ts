import { LeaderBoardRecord } from '@/app/types';
import { useEffect, useState } from 'react';

const useLeaderBoard = () => {
  const [leaderBoard, setLeaderBoard] = useState<LeaderBoardRecord[] | null>(
    null
  );

  useEffect(() => {
    const fetchLeaderBoard = async () => {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      setLeaderBoard(data);
    };

    fetchLeaderBoard();
  }, []);

  return leaderBoard;
};

export default useLeaderBoard;
