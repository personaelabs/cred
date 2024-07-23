import { Copy, Reply, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { copyTextToClipboard } from '@/lib/utils';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import EmojiModal from '../modals/EmojiModal';
import { MessageWithUserData } from '@/types';

interface ReceivedMessageDropdownContentProps {
  isReadOnly: boolean;
  onReplyClick: () => void;
  onCopyClick: () => void;
  onReactClick: (_reaction: string) => void;
}

const reactions = ['👍', '❤️', '🔥', '🙏'];
const ReceivedMessageDropdownContent = (
  props: ReceivedMessageDropdownContentProps
) => {
  const { isReadOnly, onReplyClick, onCopyClick, onReactClick } = props;
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  return (
    <DropdownMenuContent className="bg-background mt-[-20px] ml-[40px]">
      <DropdownMenuItem
        onClick={onReplyClick}
        className={`${isReadOnly ? 'hidden' : ''}`}
      >
        <Reply className={`mr-2 w-4 h-4 `}></Reply>
        <div>Reply</div>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onCopyClick}>
        <Copy className="mr-2 w-4 h-4"></Copy>
        <div>Copy</div>
      </DropdownMenuItem>
      <div className={`flex flex-row p-2 ${isReadOnly ? 'hidden' : ''}`}>
        {reactions.map((reaction, i) => (
          <div
            key={i}
            onClick={() => onReactClick(reaction)}
            className="hover:bg-slate-700 px-2 rounded-md"
          >
            {reaction}
          </div>
        ))}
        <ChevronDown
          className="hover:bg-slate-700 rounded-md opacity-70"
          onClick={() => {
            setIsEmojiPickerOpen(true);
          }}
        />
      </div>
      <EmojiModal
        isOpen={isEmojiPickerOpen}
        onClose={() => {
          setIsEmojiPickerOpen(false);
        }}
        onEmojiSelect={onReactClick}
      ></EmojiModal>
    </DropdownMenuContent>
  );
};

interface SenderMessageDropdownContentProps {
  isReadOnly: boolean;
  onCopyClick: () => void;
  onDeleteClick: () => void;
}

const SenderMessageDropdownContent = (
  props: SenderMessageDropdownContentProps
) => {
  const { isReadOnly, onCopyClick, onDeleteClick } = props;

  return (
    <DropdownMenuContent className="bg-background mt-[-30px]">
      <DropdownMenuItem onClick={onCopyClick}>
        <Copy className="mr-2 w-4 h-4"></Copy>
        <div>Copy</div>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={onDeleteClick}
        className={`text-red-500 ${isReadOnly ? 'hidden' : ''}`}
      >
        <Trash2 className="mr-2 w-4 h-4"></Trash2>
        <div>Delete</div>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};

interface ChatMessageDropdownMenuProps {
  isOpen: boolean;
  isReadOnly: boolean;
  isSender: boolean;
  message: MessageWithUserData;
  onClose: () => void;
  onReplySelect: (_message: MessageWithUserData) => void;
  onReactionClick: (_reaction: string) => void;
  onDeleteClick: (_messageId: string) => void;
}

const ChatMessageDropdownMenu = (props: ChatMessageDropdownMenuProps) => {
  const { isOpen, isReadOnly, isSender, onClose } = props;

  const onClickCopyToClipboard = useCallback(async () => {
    await copyTextToClipboard(props.message.text);
    toast.info('Copied message to clipboard');
  }, [props.message.text]);

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
      modal={false}
    >
      <DropdownMenuTrigger disabled></DropdownMenuTrigger>
      {isSender ? (
        <SenderMessageDropdownContent
          isReadOnly={isReadOnly}
          onCopyClick={onClickCopyToClipboard}
          onDeleteClick={() => {
            props.onDeleteClick(props.message.id);
          }}
        ></SenderMessageDropdownContent>
      ) : (
        <ReceivedMessageDropdownContent
          isReadOnly={isReadOnly}
          onReplyClick={() => {
            props.onReplySelect(props.message);
          }}
          onCopyClick={onClickCopyToClipboard}
          onReactClick={reaction => {
            props.onReactionClick(reaction);
            // We need to explicitly close the dropdown after reacting,
            // since the reactions aren't wrapped in a `DropdownMenuItem` component
            onClose();
          }}
        ></ReceivedMessageDropdownContent>
      )}
    </DropdownMenu>
  );
};

export default ChatMessageDropdownMenu;
