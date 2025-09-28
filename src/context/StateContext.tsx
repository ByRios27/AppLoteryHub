'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Sale, Winner, Lottery, lotteries as initialLotteries } from '@/lib/data';

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
  lotteries: Lottery[];
  setLotteries: React.Dispatch<React.SetStateAction<Lottery[]>>;
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
    if (Array.isArray(defaultValue) && !Array.isArray(parsedData)) {
        // If we expect an array and don't get one, return the default
        return defaultValue;
    }
    return parsedData;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage`, error);
    // On error, return the default value to prevent app crash
    localStorage.removeItem(key); // Clear corrupted data
    return defaultValue;
  }
}

export const StateContextProvider = ({ children }: { children: ReactNode }) => {
  const [sales, setSales] = useState<Sale[]>(() => getStoredData('lotterySales', []));
  const [winningResults, setWinningResults] = useState<WinningResults>(() => getStoredData('winningResults', {}));
  const [winners, setWinners] = useState<Winner[]>(() => getStoredData('lotteryWinners', []));
  const [lotteries, setLotteries] = useState<Lottery[]>(() => getStoredData('appLotteries', initialLotteries));

  useEffect(() => {
    localStorage.setItem('lotterySales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('winningResults', JSON.stringify(winningResults));
  }, [winningResults]);

  useEffect(() => {
    if (Array.isArray(winners)) {
      localStorage.setItem('lotteryWinners', JSON.stringify(winners));
    }
  }, [winners]);

  useEffect(() => {
    localStorage.setItem('appLotteries', JSON.stringify(lotteries));
  }, [lotteries]);

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
    <StateContext.Provider value={{ sales, setSales, winningResults, setWinningResults, winners, addWinner, lotteries, setLotteries }}>
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
