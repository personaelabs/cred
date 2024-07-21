import useMessage from '@/hooks/useMessage';
import { cutoffMessage } from '@/lib/utils';

interface ReplyPreviewProps {
  roomId: string;
  replyToId: string;
  onClickOnPreview: () => void;
}

const ReplyPreview = (props: ReplyPreviewProps) => {
  const { replyToId, roomId, onClickOnPreview } = props;
  const { data: replyToMessage } = useMessage({
    roomId,
    messageId: replyToId,
  });

  return (
    <div className="px-3 py-1">
      <div
        className="opacity-70 p-2 border-l-2 border-[#FDA174]"
        onClick={onClickOnPreview}
      >
        <div className="w-full">
          {cutoffMessage(replyToMessage?.body || '', 80)}
        </div>
      </div>
    </div>
  );
};

export default ReplyPreview;
