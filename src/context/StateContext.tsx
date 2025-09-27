"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Sale } from '@/lib/data';

interface IStateContext {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  winningResults: { [key: string]: string };
  setWinningResults: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

const StateContext = createContext<IStateContext | undefined>(undefined);

export const StateProvider = ({ children }: { children: ReactNode }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [winningResults, setWinningResults] = useState<{ [key: string]: string }>({});

  return (
    <StateContext.Provider value={{ sales, setSales, winningResults, setWinningResults }}>
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useStateContext must be used within a StateProvider');
  }
  return context;
};
