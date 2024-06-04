'use client';
import { ModalType } from '@/types';
import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext<{
  openedModal: ModalType | null;
  setOpenedModal: (_sheet: ModalType) => void;
  closeModal: () => void;
}>({
  openedModal: null,
  setOpenedModal: () => {},
  closeModal: () => {},
});

export const useModal = () => {
  return useContext(ModalContext);
};

export function ModalContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openedModal, setOpenedModal] = useState<ModalType | null>(null);

  return (
    <ModalContext.Provider
      value={{
        openedModal,
        setOpenedModal: (modal: ModalType) => {
          setOpenedModal(modal);
        },
        closeModal: () => {
          setOpenedModal(null);
        },
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}
