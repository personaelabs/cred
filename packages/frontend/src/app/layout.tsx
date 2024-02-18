'use client';

import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import WalletProvider from '@/components/WalletProvider';
import MobileFooter from '@/components/MobileFooter';
import { Toaster } from '@/components/ui/sonner';
import { UserProvider } from '@/context/UserContext';
import DesktopFooter from '@/components/DesktopFooter';

import '@farcaster/auth-kit/styles.css';
import { AuthKitProvider } from '@farcaster/auth-kit';
import Header from '@/components/Header';
import { usePathname } from 'next/navigation';

const config = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'creddd.xyz',
  siweUri: 'http://creddd.xyz/login',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isUserProfilePage = /\/user\//.test(pathname);

  const showComingSoon =
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' && !isUserProfilePage;

  return (
    <html lang="en">
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
      </head>
      <body className="bg-background overflow-y-hidden">
        <UserProvider>
          <AuthKitProvider config={config}>
            <WalletProvider>
              <ThemeProvider attribute="class" defaultTheme="dark">
                {showComingSoon ? (
                  <div className="h-[100vh] flex flex-col justify-center items-center text-lg text-primary">
                    Coming soon...
                  </div>
                ) : (
                  <>
                    <Header></Header>
                    <div className="flex flex-row justify-center w-full">
                      <div className="w-full flex flex-col">{children}</div>
                    </div>
                    <MobileFooter></MobileFooter>
                    <DesktopFooter></DesktopFooter>
                  </>
                )}
              </ThemeProvider>
            </WalletProvider>
          </AuthKitProvider>
        </UserProvider>
        <Toaster richColors></Toaster>
      </body>
    </html>
  );
}
