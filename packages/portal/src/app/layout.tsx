import './globals.css';
import type { Viewport } from 'next';
import Providers from '@/components/Providers';

export const viewport: Viewport = {
  initialScale: 1,
  userScalable: false,
  maximumScale: 1,
  width: 'device-width',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="manifest"
          href={
            process.env.NODE_ENV === 'production'
              ? '/manifest.json'
              : '/manifest-dev.json'
          }
        />
      </head>
      <body className="h-full overflow-hidden bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
