import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import WalletProvider from '@/components/WalletProvider';
import MobileFooter from '@/components/MobileFooter';
import DesktopSidebar from '@/components/DesktopSidebar';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Script from 'next/script';
import DesktopFooter from '@/components/DesktopFooter';
import { UserAccountProvider } from '@/contexts/UserAccountContext';
import { MediaQueryProvider } from '@/contexts/MediaQueryContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <link rel="manifest" href="/manifest.json" />
        <Script
          defer
          data-domain="heyanon2-app-rho.vercel.app"
          src="https://plausible.io/js/script.js"
        ></Script>
      </head>
      <body className="bg-background overflow-y-hidden">
        <WalletProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <Header></Header>
            <UserAccountProvider>
              <MediaQueryProvider>
                <div className="w-full flex flex-row justify-start">
                  <div className="hidden md:flex w-1/4">
                    <DesktopSidebar></DesktopSidebar>
                  </div>
                  <div className="flex flex-row justify-center w-full md:w-1/2 md:justify-start">
                    <div className="w-full flex flex-col">{children}</div>
                  </div>
                </div>
              </MediaQueryProvider>
            </UserAccountProvider>
            <MobileFooter></MobileFooter>
            <DesktopFooter></DesktopFooter>
          </ThemeProvider>
        </WalletProvider>
        <Toaster richColors></Toaster>
      </body>
    </html>
  );
}
