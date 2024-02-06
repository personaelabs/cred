import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import WalletProvider from '@/components/WalletProvider';
import MobileFooter from '@/components/MobileFooter';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/Header';
import DesktopFooter from '@/components/DesktopFooter';

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
      </head>
      <body className="bg-background overflow-y-hidden">
        <WalletProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <Header></Header>
                  <div className="flex flex-row justify-center w-full">
                    <div className="w-full flex flex-col">{children}</div>
                  </div>
            <MobileFooter></MobileFooter>
            <DesktopFooter></DesktopFooter>
          </ThemeProvider>
        </WalletProvider>
        <Toaster richColors></Toaster>
      </body>
    </html>
  );
}
