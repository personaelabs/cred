import { GroupSelect } from '@/app/api/groups/route';
import { captureFetchError, getGroupTypeTitle } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const useGroups = () => {
  // Map of group type name to GroupSelect[]
  const [groupsByType, setGroupsByType] =
    useState<Map<string, GroupSelect[]>>();

  useEffect(() => {
    (async () => {
      const response = await fetch('/api/groups', {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = (await response.json()) as GroupSelect[];

        const _groupsByType = new Map<string, GroupSelect[]>();
        for (const group of data) {
          const groupType = getGroupTypeTitle(group.typeId);
          if (_groupsByType.has(groupType)) {
            _groupsByType.get(groupType)!.push(group);
          } else {
            _groupsByType.set(groupType, [group]);
          }
        }

        // Sort by number of groups in each group type
        const sortedGroupsByType = new Map(
          Array.from(_groupsByType).sort(([, a], [, b]) => b.length - a.length)
        );

        setGroupsByType(sortedGroupsByType);
      } else {
        toast.error('Failed to fetch groups');
        await captureFetchError(response);
      }
    })();
  }, []);

  return {
    groupsByType,
  };
};

export default useGroups;
