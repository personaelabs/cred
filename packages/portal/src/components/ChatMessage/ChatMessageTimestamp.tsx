interface ChatMessageTimestampProps {
  createdAt: Date;
}

const ChatMessageTimestamp = (props: ChatMessageTimestampProps) => {
  return (
    <div className="flex flex-row items-center justify-between">
      <div className="opacity-50 px-4 mt-1 text-xs">
        {new Date(props.createdAt).toLocaleString()}
      </div>
    </div>
  );
};

export default ChatMessageTimestamp;
