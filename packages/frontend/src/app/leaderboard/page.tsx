/* eslint-disable @next/next/no-img-element */
'use client';
import useLeaderBoardQuery from '@/hooks/useLeaderBoardQuery';
import { LeaderBoardRecord } from '../types';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CredddListDialogProps {
  creddd: string[];
  isOpen: boolean;
  onClose: () => void;
}

const CredddListDialog = (props: CredddListDialogProps) => {
  const { creddd, isOpen, onClose } = props;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogDescription>
          <ul className="list-disc px-2">
            {creddd.map((creddd, i) => (
              <li key={i} className="text-left">
                {creddd}
              </li>
            ))}
          </ul>
        </DialogDescription>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface LeaderBoardRowProps {
  record: LeaderBoardRecord;
  rank: number;
}

const LeaderBoardRow = ({ record, rank }: LeaderBoardRowProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex flex-row justify-center items-center py-[12px] border-t border-[#E5E7EB]-500">
      <div className="w-[30px] md:w-[40px]">{rank}</div>
      <Link
        className="no-underline"
        href={`/user/${record.user.fid}`}
        target="_blank"
      >
        <div className="w-[180px] md:w-[360px] flex flex-row justify-start items-center gap-[12px]">
          <img
            src={record.user.pfp_url || ''}
            alt="profile image"
            className="w-[24px] h-[24px] md:w-[32px] md:h-[32px] rounded-full object-cover"
          ></img>
          <div>{record.user.display_name}</div>
        </div>
      </Link>
      <div className="w-[60px] text-center opacity-60 underline hidden md:flex">
        <Tooltip delayDuration={200}>
          <TooltipTrigger>
            <div className="underline">{Math.round(record.score)}</div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[300px]">
            <ul className="list-disc px-2">
              {record.creddd.map((creddd, i) => (
                <li key={i} className="text-left">
                  {creddd}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex md:hidden">
        <div
          className="underline"
          onClick={() => {
            setIsDialogOpen(true);
          }}
        >
          {record.score}
        </div>
      </div>
      <CredddListDialog
        creddd={record.creddd}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      ></CredddListDialog>
    </div>
  );
};

const LeaderBoardPage = () => {
  const { data: leaderBoard } = useLeaderBoardQuery();

  return (
    <div className="px-[20px] md:px-[200px] flex flex-col items-center">
      <div className="text-md text-center">leaderboard</div>
      <div className="text-sm text-center">value + variety = hi score</div>
      <div className="flex flex-row w-[270px] md:w-[450px] justify-end">
        <div className="w-[60px] opacity-60 text-center">score</div>
      </div>
      <div className="overflow-auto mt-[12px]">
        {leaderBoard ? (
          <div>
            {leaderBoard.map((record, i) => (
              <LeaderBoardRow key={i} record={record} rank={i + 1} />
            ))}

            <Link href="/account">Add yours</Link>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </div>
  );
};

export default LeaderBoardPage;
