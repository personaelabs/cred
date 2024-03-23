'use client';
import { Input } from '@/components/ui/input';
import useGroups from '@/hooks/useGroups';
import { getGroupTypeTitle } from '@/lib/utils';
import { GroupType } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GroupSelect } from '../api/groups/route';

const ExplorePage = () => {
  const { groupsByType } = useGroups();

  const [searchTerm, setSearchTerm] = useState<string>('');

  // Groups filtered by search term
  const [filteredGroupsByType, setFilteredGroupsByType] =
    useState(groupsByType);

  useEffect(() => {
    if (groupsByType) {
      const filteredGroupsByType = new Map<GroupType, GroupSelect[]>();

      for (const [groupType, groups] of Array.from(groupsByType)) {
        const filteredGroups = groups.filter(group =>
          group.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredGroups.length > 0) {
          filteredGroupsByType.set(groupType, filteredGroups);
        }
      }

      setFilteredGroupsByType(filteredGroupsByType);
    }
  }, [groupsByType, searchTerm]);

  return (
    <div className="m-auto flex flex-col items-center justify-center mt-4 gap-[64px] w-[340px]  md:w-[800px]">
      <div className="flex flex-col items-center gap-[12px]">
        <div className="text-xl">All creddd</div>
        <Input
          placeholder="Search by coin, NFT, etc"
          className="w-[240px]"
          onChange={e => {
            setSearchTerm(e.target.value);
          }}
          value={searchTerm}
        />
      </div>
      {filteredGroupsByType ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-[96px] gap-y-[36px] overflow-y-scroll h-[320px]">
          {Array.from(filteredGroupsByType.keys()).map(groupType => (
            <div key={groupType} className="flex flex-col items-center gap-2">
              <div className="underline">{getGroupTypeTitle(groupType)}</div>
              <div className="flex flex-col gap-2  opacity-80">
                {filteredGroupsByType.get(groupType)!.map(group => (
                  <div key={group.id}>{group.displayName}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Loader2 className="animate-spin w-4 h-4" color="hsl(var(--primary))" />
      )}
    </div>
  );
};

export default ExplorePage;
