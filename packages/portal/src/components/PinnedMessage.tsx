interface PinnedMessageProps {
  message: string;
}

const PinnedMessage = (props: PinnedMessageProps) => {
  const { message } = props;

  return (
    <div className="border-b-2 flex justify-center items-center w-full py-2 px-4">
      <div>{message}</div>
    </div>
  );
};

export default PinnedMessage;
