'use client';
import './globals.css';
// import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
// import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthKitProvider } from '@farcaster/auth-kit';
import DesktopHeader from '@/components/DesktopHeader';
import MobileFooter from '@/components/MobileFooter';
import DesktopFooter from '@/components/DesktopFooter';
import { MinChatUiProvider } from '@minchat/react-chat-ui';
import useWindowDimensions from '@/hooks/useWindowDimensions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

/*
const persister = createSyncStoragePersister({
  storage: window.localStorage,
});
*/

const config = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'creddd.xyz',
  siweUri: 'http://creddd.xyz/login',
  relay: 'https://relay.farcaster.xyz',
};

const myColorSet = {
  // input
  '--input-background-color': '#1E1E1E',
  '--input-text-color': '#fff',
  '--input-element-color': '#1E1E1E',
  // '--input-attach-color': '#fff',
  // '--input-send-color': '#fff',
  // '--input-placeholder-color': 'rgb(255, 255, 255)',

  // message header
  // '--message-header-background-color': '#FF0000',
  // '--message-header-text-color': '#fff',
  // '--message-header-last-active-color': 'rgb(0, 0, 255)',
  // '--message-header-back-color': 'rgb(255, 255, 255)',

  // chat list header
  '--chatlist-header-background-color': '#FF0000',
  '--chatlist-header-text-color': 'rgb(255, 255, 255)',
  '--chatlist-header-divider-color': 'rgb(0, 128, 0)',

  //chatlist
  '--chatlist-background-color': 'rgb(255, 192, 203)',
  '--no-conversation-text-color': 'rgb(255, 255, 255)',

  //chat item
  '--chatitem-background-color': 'rgb(0, 0, 255)',
  '--chatitem-selected-background-color': 'rgb(255, 255, 0)',
  '--chatitem-title-text-color': '#FF0000',
  '--chatitem-content-text-color': '#FF0000',
  '--chatitem-hover-color': '#FF0000',

  //main container
  '--container-background-color': '#1E1E1E',

  //loader
  '--loader-color': '#1E1E1E',

  //message list
  '--messagelist-background-color': '#1E1E1E',
  '--no-message-text-color': '#FF0000',

  // incoming message
  // '--incoming-message-text-color': 'rgb(255, 255, 255)',
  // '--incoming-message-name-text-color': 'rgb(255, 255, 255)',
  // '--incoming-message-background-color': 'rgb(0, 128, 0)',
  // '--incoming-message-timestamp-color': 'rgb(255, 255, 255)',
  // '--incoming-message-link-color': '#FF0000',

  //outgoing message
  // '--outgoing-message-text-color': '#FF0000',
  // '--outgoing-message-background-color': 'rgb(255, 255, 0)',
  // '--outgoing-message-timestamp-color': '#FF0000',
  // '--outgoing-message-checkmark-color': '#FF0000',
  // '--outgoing-message-loader-color': '#FF0000',
  // '--outgoing-message-link-color': 'rgb(0, 128, 0)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { height } = useWindowDimensions();

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
        <link rel="manifest" href="/manifest.json" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body className="overflow-y-hidden">
        <ThemeProvider attribute="class" defaultTheme="dark">
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <MinChatUiProvider theme="#FDA783" colorSet={myColorSet}>
                <AuthKitProvider config={config}>
                  <DesktopHeader></DesktopHeader>
                  <div style={{ height: `calc(${height}px - 130px)` }}>
                    {children}
                  </div>
                  <MobileFooter></MobileFooter>
                  <DesktopFooter></DesktopFooter>
                </AuthKitProvider>
              </MinChatUiProvider>
            </TooltipProvider>
          </QueryClientProvider>
          <Toaster richColors expand></Toaster>
        </ThemeProvider>
      </body>
    </html>
  );
}
