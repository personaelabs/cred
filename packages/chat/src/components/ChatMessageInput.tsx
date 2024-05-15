import { useState } from 'react';
import { CircleArrowUp } from 'lucide-react';
import theme from '@/lib/theme';
import { X } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { cutoffMessage } from '@/lib/utils';

interface ChatMessageInputProps {
  onSend: (_message: string) => void;
  replyToText?: string;
  onCancelReply: () => void;
}

const ChatMessageInput = (props: ChatMessageInputProps) => {
  const [input, setInput] = useState('');
  const { onSend } = props;

  return (
    <div className="flex flex-row gap-2 items-center justify-between">
      <div className="flex flex-col w-[85%]">
        {props.replyToText ? (
          <div className="border-#[000000] ml-1 border-l-primary border-l-2 p-2 flex flex-row items-center font-semibold">
            <div className="w-[85%]">
              Replying to: {cutoffMessage(props.replyToText, 50)}
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
        <TextareaAutosize
          className="bg-background w-full py-2 px-4 my-1 resize-none rounded-lg border-2 focus:outline-none"
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
