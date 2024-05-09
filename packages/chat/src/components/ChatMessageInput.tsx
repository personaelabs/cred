import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { ArrowUpCircle } from 'lucide-react';

interface ChatMessageInputProps {
  onSend: (_message: string) => void;
}

const ChatMessageInput = (props: ChatMessageInputProps) => {
  const [input, setInput] = useState('');
  const { onSend } = props;

  return (
    <div className="flex flex-row gap-2 items-center justify-between">
      <Input
        className="w-[85%]"
        type="text"
        placeholder="Message"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <ArrowUpCircle
        size={28}
        className="cursor-pointer mr-4"
        color="#FDA174"
        onClick={() => {
          onSend(input);
          setInput('');
        }}
      />
    </div>
  );
};

export default ChatMessageInput;
