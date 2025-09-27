'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Sale, Winner } from '@/lib/data';

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
  addWinner: (ticketId: string, lotteryId: string, ticketNumber: string, prizeTier: number) => void;
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

  const addWinner = (ticketId: string, lotteryId: string, ticketNumber: string, prizeTier: number) => {
    const newWinner: Winner = {
      id: ticketId,
      lotteryId,
      ticketNumber,
      prizeTier,
      drawDate: new Date().toISOString(),
    };

    setWinners(prevWinners => {
      if (prevWinners.some(winner => winner.id === newWinner.id)) {
        return prevWinners; 
      }
      return [...prevWinners, newWinner];
    });
  };

  return (
    <StateContext.Provider value={{ sales, setSales, winningResults, setWinningResults, winners, addWinner }}>
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
