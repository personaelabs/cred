'use client';
import { Check, Info } from 'lucide-react';
import { getCredddDescription } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GroupSelect } from '@/app/api/fc-accounts/[fid]/route';

interface CredddBadgeProps {
  group: GroupSelect;
}

const CredddBadge = (props: CredddBadgeProps) => {
  const { group } = props;

  const credddDescription = getCredddDescription(
    group.displayName,
    group.typeId
  );

  return (
    <div className="flex flex-row items-center">
      <Check className="w-4 h-4 mr-2" color="#FDA174"></Check>
      <div>{group.displayName}</div>
      {credddDescription ? (
        <Tooltip delayDuration={200}>
          <TooltipTrigger>
            <Info className="w-4 h-4 ml-2"></Info>
          </TooltipTrigger>
          <TooltipContent>{credddDescription}</TooltipContent>
        </Tooltip>
      ) : (
        <></>
      )}
    </div>
  );
};

export default CredddBadge;
