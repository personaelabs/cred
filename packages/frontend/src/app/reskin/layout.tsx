'use client';

import { ReskinFcUserProvider } from '@/context/ReskinFcUserContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ReskinFcUserProvider>{children}</ReskinFcUserProvider>;
}
