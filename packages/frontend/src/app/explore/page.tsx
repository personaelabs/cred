'use client';
import { Input } from '@/components/ui/input';
import useGroups from '@/hooks/useGroups';
import { getCredddDescription } from '@/lib/utils';
import { Info, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GroupSelect } from '../api/groups/route';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

const ExplorePage = () => {
  const { groupsByType } = useGroups();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState<string>('');

  // Groups filtered by search term
  const [filteredGroupsByType, setFilteredGroupsByType] =
    useState(groupsByType);

  useEffect(() => {
    if (groupsByType) {
      const filteredGroupsByType = new Map<string, GroupSelect[]>();

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-[96px] gap-y-[36px] overflow-y-scroll max-h-[320px]">
          {Array.from(filteredGroupsByType.keys()).map(groupType => (
            <div key={groupType} className="flex flex-col items-center gap-2">
              <div className="underline">{groupType}</div>
              <div className="flex flex-col gap-3  opacity-80">
                {filteredGroupsByType.get(groupType)!.map(group => {
                  const credddDescription = getCredddDescription(
                    group.displayName,
                    group.typeId
                  );
                  return (
                    <div key={group.id} className="flex flex-row items-center">
                      {group.displayName}
                      {credddDescription ? (
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 ml-2"></Info>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <div className="font-bold z-50 bg-black ">
                              {credddDescription}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <></>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Loader2 className="animate-spin w-4 h-4" color="hsl(var(--primary))" />
      )}
      <div>
        <Button
          variant="link"
          onClick={() => {
            router.push('/');
          }}
        >
          Search my creddd
        </Button>
      </div>
    </div>
  );
};

export default ExplorePage;
