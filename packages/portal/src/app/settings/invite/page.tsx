'use client';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useInviteCodes from '@/hooks/useInviteCodes';
import { copyTextToClipboard } from '@/lib/utils';
import { InviteCode } from '@cred/shared';
import { Check, Clipboard } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface InviteCodeListItemProps {
  inviteCode: InviteCode;
}

const InviteCodeListItem = (props: InviteCodeListItemProps) => {
  const { inviteCode } = props;

  const onCopyClick = () => {
    copyTextToClipboard(inviteCode.code);
    toast.info('Copied invite code');
  };

  return (
    <div
      className={`w-full flex flex-row items-center justify-between ${inviteCode.isUsed ? 'opacity-60' : ''}`}
    >
      {inviteCode.isUsed ? <Check className="w-4 h-4"></Check> : <></>}
      <div className="">{inviteCode.code}</div>
      <div>
        <Button variant="ghost" onClick={onCopyClick}>
          <Clipboard className="w-4 h-4"></Clipboard>
        </Button>
      </div>
    </div>
  );
};

const InvitePage = () => {
  const { data: inviteCodes } = useInviteCodes();

  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({
      title: 'Invite Codes',
      showBackButton: true,
    });
  }, [setOptions]);

  return (
    <div className="flex flex-col items-center w-full mt-10">
      <div className="flex flex-col w-[280px] gap-y-2">
        {inviteCodes.map(inviteCode => (
          <InviteCodeListItem key={inviteCode.code} inviteCode={inviteCode} />
        ))}
      </div>
    </div>
  );
};

export default InvitePage;
