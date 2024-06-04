import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setIsPending(false);
      setDebouncedValue(value);
    }, delay);

    return () => {
      setIsPending(true);
      clearTimeout(handler);
    };
  }, [value, delay]);

  return { debouncedValue, isPending };
}

export default useDebounce;
