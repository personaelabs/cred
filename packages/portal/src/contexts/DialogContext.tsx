'use client';
import { DialogType } from '@/types';
import React, { createContext, useContext, useState } from 'react';

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
