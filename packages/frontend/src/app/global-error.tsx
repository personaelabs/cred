'use client';
import { Button } from '@/components/ui/button';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="h-[100vh] w-[full] flex justify-center items-center gap-5">
          <p className="text-[20px]">Oops! Some went wrong</p>
          <Button
            onClick={() => {
              reset();
              window.location.reload();
            }}
          >
            Reload page
          </Button>
        </div>
      </body>
    </html>
  );
}
