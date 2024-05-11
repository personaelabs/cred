'use client';
import { getMessaging, onMessage } from 'firebase/messaging';
import React, { createContext, useEffect } from 'react';
import firebaseApp from '@/lib/firebase';
import { log } from '@/lib/logger';

export interface HeaderOptions {}

const NotificationsContext = createContext({});

export function NotificationsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const messaging = getMessaging(firebaseApp);
    onMessage(messaging, payload => {
      log(`Message received. ${payload}`);
      alert(`Message received. ${payload}`);
      console.log('Message received. ', payload);
      // ...
    });
  }, []);

  return (
    <NotificationsContext.Provider value={{}}>
      {children}
    </NotificationsContext.Provider>
  );
}
