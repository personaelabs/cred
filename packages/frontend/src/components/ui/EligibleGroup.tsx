'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import useProver from '@/hooks/useProver';
import { getCredddDescription } from '@/lib/utils';
import { Info, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import type { EligibleGroup } from '@/app/types';
import { Connector } from 'wagmi';
import { useAddingCredddModal } from '@/context/AddingCredddModalContext';

interface WalletViewProps {
  connector: Connector;
  group: EligibleGroup;
  afterAdd: () => void;
}

const EligibleGroup: React.FC<WalletViewProps> = ({ connector, group }) => {
  const { setIsOpen: setIsAddingCredddModalOpen } = useAddingCredddModal();
  const { mutateAsync: prove, isPending: isAdding } = useProver(group);

  const addGroup = async () => {
    setIsAddingCredddModalOpen(true);
    await prove(connector);
    setIsAddingCredddModalOpen(false);
  };

  const credddDescription = group.typeId
    ? getCredddDescription(group.displayName, group.typeId)
    : null;

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-row items-center justify-center gap-[20px] w-[300px]">
        <div className="flex flex-row items-center">
          <div className="text-center w-[150px]">{group.displayName}</div>
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
        <div className="w-[85px] text-center">
          <Button onClick={addGroup} disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="animate-spin mr-2 w-4 h-4"></Loader2>
            ) : (
              <></>
            )}
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EligibleGroup;
