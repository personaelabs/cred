'use client';
import React, { createContext, useContext, useState } from 'react';

export enum DialogType {
  // eslint-disable-next-line no-unused-vars
  FUND_WALLET = 'FUND_WALLET',
  // eslint-disable-next-line no-unused-vars
  PROCESSING_TX = 'PROCESSING_TX',
  // eslint-disable-next-line no-unused-vars
  MESSAGE_REACTIONS = 'MESSAGE_REACTIONS',
}

/**
 * Context for managing the opened dialog
 * The consumer of this context can open and close dialogs.
 */
const DialogContext = createContext<{
  openedDialog: DialogType | null;
  setOpenedSheet: (_sheet: DialogType) => void;
  closeDialog: () => void;
}>({
  openedDialog: null,
  setOpenedSheet: () => {},
  closeDialog: () => {},
});

export const useDialog = () => {
  return useContext(DialogContext);
};

export function DialogContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openedDialog, setOpenedSheet] = useState<DialogType | null>(null);

  return (
    <DialogContext.Provider
      value={{
        openedDialog,
        setOpenedSheet: (sheet: DialogType) => {
          setOpenedSheet(sheet);
        },
        closeDialog: () => {
          setOpenedSheet(null);
        },
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}
