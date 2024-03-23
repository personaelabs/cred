import { GroupSelect } from '@/app/api/groups/route';
import { captureFetchError } from '@/lib/utils';
import { GroupType } from '@prisma/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const useGroups = () => {
  // Map of GroupType to GroupSelect[]
  const [groupsByType, setGroupsByType] =
    useState<Map<GroupType, GroupSelect[]>>();

  useEffect(() => {
    (async () => {
      const response = await fetch('/api/groups', {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = (await response.json()) as GroupSelect[];

        const _groupsByType = new Map<GroupType, GroupSelect[]>();
        for (const group of data) {
          if (_groupsByType.has(group.typeId)) {
            _groupsByType.get(group.typeId)!.push(group);
          } else {
            _groupsByType.set(group.typeId, [group]);
          }
        }

        setGroupsByType(_groupsByType);
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
