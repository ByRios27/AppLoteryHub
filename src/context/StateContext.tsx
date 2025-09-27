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

// Helper function to safely parse stored JSON
function getStoredData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  const savedData = localStorage.getItem(key);
  if (!savedData) {
    return defaultValue;
  }

  try {
    const parsedData = JSON.parse(savedData);
    // For arrays, ensure it's actually an array before returning
    if (Array.isArray(defaultValue) && !Array.isArray(parsedData)) {
        return defaultValue;
    }
    return parsedData;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage`, error);
    return defaultValue;
  }
}

export const StateContextProvider = ({ children }: { children: ReactNode }) => {
  const [sales, setSales] = useState<Sale[]>(() => getStoredData('lotterySales', []));
  const [winningResults, setWinningResults] = useState<WinningResults>(() => getStoredData('winningResults', {}));
  const [winners, setWinners] = useState<Winner[]>(() => getStoredData('lotteryWinners', []));

  useEffect(() => {
    localStorage.setItem('lotterySales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('winningResults', JSON.stringify(winningResults));
  }, [winningResults]);

  useEffect(() => {
    // Ensure winners is always an array before setting to localStorage
    if (Array.isArray(winners)) {
      localStorage.setItem('lotteryWinners', JSON.stringify(winners));
    }
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
      const safePrevWinners = Array.isArray(prevWinners) ? prevWinners : [];
      if (safePrevWinners.some(winner => winner.id === newWinner.id)) {
        return safePrevWinners; 
      }
      return [...safePrevWinners, newWinner];
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
