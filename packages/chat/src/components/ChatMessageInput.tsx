import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { CircleArrowUp } from 'lucide-react';
import theme from '@/lib/theme';
import { X } from 'lucide-react';

interface ChatMessageInputProps {
  onSend: (_message: string) => void;
  replyTo?: string;
  onCancelReply: () => void;
}

const ChatMessageInput = (props: ChatMessageInputProps) => {
  const [input, setInput] = useState('');
  const { onSend } = props;

  return (
    <div className="flex flex-row gap-2 items-center justify-between">
      <div className="flex flex-col w-[85%]">
        {props.replyTo ? (
          <div className="opacity-70 border-#[000000] p-2 flex flex-row items-center">
            <div className="w-[85%]">Replying to: {props.replyTo}</div>
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
        <Input
          className="w-[100%]"
          type="text"
          placeholder="Message"
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocusCapture={e => e.preventDefault()}
          onFocus={e => e.preventDefault()}
        />
      </div>
      <CircleArrowUp
        size={28}
        className="cursor-pointer mr-4"
        color={theme.orange}
        onClick={() => {
          onSend(input);
          setInput('');
        }}
      />
    </div>
  );
};

export default ChatMessageInput;
