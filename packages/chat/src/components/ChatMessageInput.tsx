/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CircleArrowUp, Image as ImageIcon } from 'lucide-react';
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
import ClickableBox from './ClickableBox';
import { MessageInput } from '@/types';

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

interface SelectedImagePreviewProps {
  url: string;
  onRemove: () => void;
}

const SelectedImagePreview = (props: SelectedImagePreviewProps) => {
  const { url, onRemove } = props;

  return (
    <div className="flex flex-row items-center gap-2" onClick={onRemove}>
      <img src={url} className="w-24 rounded-lg" alt="selected image" />
      <X size={18} />
    </div>
  );
};

interface ChatMessageInputProps {
  roomId: string;
  onSend: (_messageInput: MessageInput) => void;
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
  const imageInputRef = useRef<null | HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

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
    if (input.trim() !== '' || selectedImages.length > 0) {
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
        imageUris: selectedImages,
        replyTo: null,
      });

      setInput('');
      setSelectedImages([]);
    }
  }, [input, onSend, roomUsers, selectedImages]);

  // Hook to listen to enter key press to send message
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.onkeydown = e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSendClick();
        }
      };
    }
  }, [inputRef, onSendClick]);

  return (
    <div className="flex flex-col">
      <div className="px-2 flex flex-row gap-4">
        {selectedImages.map((url, index) => (
          <SelectedImagePreview
            key={index}
            url={url}
            onRemove={() => {
              setSelectedImages(selectedImages.filter(image => image !== url));
            }}
          ></SelectedImagePreview>
        ))}
      </div>
      <div className="flex flex-row gap-2 items-center justify-between">
        <div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const files = e.target.files;
              if (files) {
                const urls = Array.from(files).map(file =>
                  URL.createObjectURL(file)
                );
                setSelectedImages(prevImages => [...prevImages, ...urls]);
              }
            }}
          ></input>
          <ImageIcon
            className="ml-2"
            size={24}
            onClick={() => {
              imageInputRef?.current?.click();
            }}
          ></ImageIcon>
        </div>
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
        <ClickableBox>
          <CircleArrowUp
            size={28}
            className="cursor-pointer mr-4"
            color={theme.orange}
            onClick={onSendClick}
          />
        </ClickableBox>
      </div>
    </div>
  );
};

export default ChatMessageInput;
