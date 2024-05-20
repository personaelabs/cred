import { useCallback, useEffect, useState } from 'react';
import { CircleArrowUp } from 'lucide-react';
import theme from '@/lib/theme';
import { X } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { cutoffMessage, getMentionsFromText } from '@/lib/utils';
import { User } from '@cred/shared';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { DropdownMenu } from '@radix-ui/react-dropdown-menu';
import useUsers from '@/hooks/useUsers';
import useRoom from '@/hooks/useRoom';
import AvatarWithFallback from './Avatar';

interface MentionSuggestionsDropdownProps {
  suggestedUsers: User[];
  onSelectMention: (_user: User) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

const MentionSuggestionsDropdown = (props: MentionSuggestionsDropdownProps) => {
  const { suggestedUsers, onSelectMention, inputRef } = props;
  return (
    <DropdownMenu open={suggestedUsers.length > 0} modal={false}>
      <DropdownMenuTrigger></DropdownMenuTrigger>
      <DropdownMenuContent
        onFocus={() => {
          inputRef.current?.focus();
        }}
        side="top"
        className="bg-background h-[200px] overflow-y-auto flex flex-col-reverse"
      >
        {props.suggestedUsers.map(user => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => {
              onSelectMention(user);
            }}
            className="flex items-center gap-2 p-2"
          >
            <AvatarWithFallback
              name={user.displayName}
              size={24}
              alt={user.displayName}
              imageUrl={user.pfpUrl}
            ></AvatarWithFallback>
            <div>{user.username}</div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface ChatMessageInputProps {
  roomId: string;
  onSend: ({
    // eslint-disable-next-line no-unused-vars
    message,
    // eslint-disable-next-line no-unused-vars
    mentions,
  }: {
    message: string;
    mentions: string[];
  }) => void;
  replyToText?: string;
  onCancelReply: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

const ChatMessageInput = (props: ChatMessageInputProps) => {
  const { onSend, inputRef } = props;
  const [input, setInput] = useState('');
  const [searchUsername, setSearchUsername] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([]);
  const { data: room } = useRoom(props.roomId);

  const { data: roomUsers, pending } = useUsers(room?.joinedUserIds || []);

  const onSelectMention = useCallback(
    (user: User) => {
      setInput(
        `${input.slice(0, input.length - searchUsername!.length)}@${user.username}`
      );
      setSearchUsername(null);
    },
    [input, searchUsername]
  );

  useEffect(() => {
    if (searchUsername && !pending) {
      const matchedUsers = roomUsers
        .filter(user => user)
        .filter(user =>
          user!.username
            .toLowerCase()
            .startsWith(searchUsername.replace('@', '').toLowerCase())
        ) as User[];

      setMentionSuggestions(matchedUsers);
    }

    if (!searchUsername) {
      setMentionSuggestions([]);
    }
  }, [searchUsername, pending, roomUsers]);

  const onSendClick = useCallback(() => {
    if (input.trim() !== '') {
      // Get mentioned user ids
      const mentionedUsers = getMentionsFromText(input);

      let mentionedUserIds: string[] = [];
      if (mentionedUsers) {
        const mentionedUsernames = mentionedUsers.map(mention =>
          mention.slice(1).toLowerCase()
        );

        mentionedUserIds = roomUsers
          .filter(user => user)
          .filter(user =>
            mentionedUsernames.includes(user!.username.toLowerCase())
          )
          .map(user => user!.id);
      }

      onSend({
        message: input,
        mentions: mentionedUserIds,
      });
      setInput('');
    }
  }, [input, onSend, roomUsers]);

  return (
    <div className="flex flex-row gap-2 items-center justify-between">
      <div className="flex flex-col w-[85%]">
        {props.replyToText ? (
          <div className="border-#[000000] ml-1 border-l-primary border-l-2 p-2 flex flex-row items-center">
            <div className="w-[85%]">
              <span className="text-primary mr-2 font-semibold">
                Replying to:
              </span>
              {cutoffMessage(props.replyToText, 50)}
            </div>
            <X
              className="ml-2"
              size={18}
              onClick={() => {
                props.onCancelReply();
              }}
            ></X>
          </div>
        ) : (
          <></>
        )}
        <MentionSuggestionsDropdown
          onSelectMention={onSelectMention}
          suggestedUsers={mentionSuggestions}
          inputRef={inputRef}
        />
        <TextareaAutosize
          ref={inputRef}
          className="bg-background w-full py-2 px-4 my-1 resize-none rounded-lg border-2 focus:outline-none"
          placeholder="Message"
          value={input}
          onChange={e => {
            const value = e.target.value;
            setInput(value);

            const mention = value.match(/@\w+$/);
            if (mention) {
              setSearchUsername(mention[0]);
            } else if (value.endsWith('@')) {
              setSearchUsername('@');
            } else {
              setSearchUsername(null);
            }
          }}
        />
      </div>
      <CircleArrowUp
        size={28}
        className="cursor-pointer mr-4"
        color={theme.orange}
        onClick={onSendClick}
      />
    </div>
  );
};

export default ChatMessageInput;
