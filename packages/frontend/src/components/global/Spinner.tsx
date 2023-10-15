interface SpinnerProps {
  color?: string;
  size?: string;
}

const Spinner = (props: SpinnerProps) => {
  const { color, size } = props;
  return (
    <div
      className={`loader animate-spin rounded-full border-2 border-t-2 border-t-white ease-linear ${
        size ? 'w-' + size + ' h-' + size : 'h-4 w-4'
      } ${color ? 'border-' + color : 'border-gray-500'}`}
    />
  );
};

export default Spinner;
