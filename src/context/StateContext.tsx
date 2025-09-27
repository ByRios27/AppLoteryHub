'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Sale, TicketDetail, Winner } from '@/lib/data';

type WinningResults = {
  [key: string]: {
    prize1: string;
    prize2: string;
    prize3: string;
  };
};

interface StateContextType {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  winningResults: WinningResults;
  setWinningResults: React.Dispatch<React.SetStateAction<WinningResults>>;
  winners: Winner[];
  setWinners: React.Dispatch<React.SetStateAction<Winner[]>>;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateContextProvider = ({ children }: { children: ReactNode }) => {
  const [sales, setSales] = useState<Sale[]>(() => {
    if (typeof window !== 'undefined') {
      const savedSales = localStorage.getItem('lotterySales');
      return savedSales ? JSON.parse(savedSales) : [];
    }
    return [];
  });

  const [winningResults, setWinningResults] = useState<WinningResults>(() => {
    if (typeof window !== 'undefined') {
      const savedResults = localStorage.getItem('winningResults');
      return savedResults ? JSON.parse(savedResults) : {};
    }
    return {};
  });

  const [winners, setWinners] = useState<Winner[]>(() => {
    if (typeof window !== 'undefined') {
      const savedWinners = localStorage.getItem('lotteryWinners');
      return savedWinners ? JSON.parse(savedWinners) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('lotterySales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('winningResults', JSON.stringify(winningResults));
  }, [winningResults]);

  useEffect(() => {
    localStorage.setItem('lotteryWinners', JSON.stringify(winners));
  }, [winners]);

  return (
    <StateContext.Provider value={{ sales, setSales, winningResults, setWinningResults, winners, setWinners }}>
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useStateContext must be used within a StateContextProvider');
  }
  return context;
};
