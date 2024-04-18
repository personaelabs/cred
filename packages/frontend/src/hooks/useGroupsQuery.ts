import { GroupSelect } from '@/app/api/groups/route';
import { captureFetchError, getGroupTypeTitle } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

const useGroupsQuery = () =>
  useQuery({
    queryKey: ['groupsByType'],
    queryFn: async () => {
      const response = await fetch('/api/groups', {
        cache: 'no-store',
      });

      if (!response.ok) {
        await captureFetchError(response);
        throw new Error('Failed to fetch groups');
      }

      const groups = await response.json();

      const groupsByType = new Map<string, GroupSelect[]>();
      for (const group of groups) {
        const groupType = getGroupTypeTitle(group.typeId);
        if (groupsByType.has(groupType)) {
          groupsByType.get(groupType)!.push(group);
        } else {
          groupsByType.set(groupType, [group]);
        }
      }

      // Sort by number of groups in each group type
      const sortedGroupsByType = new Map(
        Array.from(groupsByType).sort(([, a], [, b]) => b.length - a.length)
      );

      return sortedGroupsByType;
    },
  });

export default useGroupsQuery;
