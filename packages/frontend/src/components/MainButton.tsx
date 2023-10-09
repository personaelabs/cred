import { ReactNode } from 'react';
import { BLUE } from '@/lib/colors';

export const MainButton = (props: {
  color?: string;
  message: string;
  handler: () => void;
  loading?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}) => {
  const { color, message, loading, handler, disabled } = props;

  return (
    <button
      className="pointer-cursor rounded-xl px-4 py-2.5 font-bold text-white transition-all hover:scale-105 active:scale-100"
      style={{
        backgroundColor: color ? color : BLUE,
        // opacity: disabled ? 0.5 : 1,
        // pointerEvents: disabled ? 'none' : 'all',
      }}
      onClick={handler}
    >
      {message}
      {loading && (
        <>
          <span className="dot1">.</span>
          <span className="dot2">.</span>
          <span className="dot3">.</span>
        </>
      )}
    </button>
  );
};
