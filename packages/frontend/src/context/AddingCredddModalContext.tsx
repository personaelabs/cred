'use client';
import AddingCredddModal from '@/components/AddingCredddModal';
import React, { createContext, useContext, useState } from 'react';

const AddingCredddModalContext = createContext<{
  isOpen: boolean;
  setIsOpen: (_isOpen: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

export const useAddingCredddModal = () => {
  return useContext(AddingCredddModalContext);
};

export function AddingCredddModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <AddingCredddModalContext.Provider
      value={{
        isOpen,
        setIsOpen,
      }}
    >
      {children}
      <AddingCredddModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </AddingCredddModalContext.Provider>
  );
}
