'use client';
import { BottomSheetType } from '@/types';
import React, { createContext, useContext, useState } from 'react';

const BottomSheetContext = createContext<{
  openedSheet: BottomSheetType | null;
  setOpenedSheet: (_sheet: BottomSheetType) => void;
  closeSheet: () => void;
}>({
  openedSheet: null,
  setOpenedSheet: () => {},
  closeSheet: () => {},
});

export const useBottomSheet = () => {
  return useContext(BottomSheetContext);
};

export function BottomSheetContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openedSheet, setOpenedSheet] = useState<BottomSheetType | null>(null);

  return (
    <BottomSheetContext.Provider
      value={{
        openedSheet,
        setOpenedSheet: (sheet: BottomSheetType) => {
          setOpenedSheet(sheet);
        },
        closeSheet: () => {
          setOpenedSheet(null);
        },
      }}
    >
      {children}
    </BottomSheetContext.Provider>
  );
}
