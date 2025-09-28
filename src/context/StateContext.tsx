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

interface AppCustomization {
    appName: string;
    appLogo: string | null;
}

interface StateContextType {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  winningResults: WinningResults;
  setWinningResults: React.Dispatch<React.SetStateAction<WinningResults>>;
  winners: Winner[];
  addWinner: (ticketId: string, lotteryId: string, ticketNumber: string, prizeTier: number) => void;
  lotteries: Lottery[];
  setLotteries: React.Dispatch<React.SetStateAction<Lottery[]>>;
  appCustomization: AppCustomization;
  setAppCustomization: React.Dispatch<React.SetStateAction<AppCustomization>>;
  sellerId: string; // Nuevo campo para el ID del vendedor
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
        return defaultValue;
    }
    return parsedData;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage`, error);
    localStorage.removeItem(key); 
    return defaultValue;
  }
}

export const StateContextProvider = ({ children }: { children: ReactNode }) => {
  const [sales, setSales] = useState<Sale[]>(() => getStoredData('lotterySales', []));
  const [winningResults, setWinningResults] = useState<WinningResults>(() => getStoredData('winningResults', {}));
  const [winners, setWinners] = useState<Winner[]>(() => getStoredData('lotteryWinners', []));
  const [lotteries, setLotteries] = useState<Lottery[]>(() => getStoredData('appLotteries', initialLotteries));
  const [appCustomization, setAppCustomization] = useState<AppCustomization>(() => getStoredData('appCustomization', { appName: 'Lotto Hub', appLogo: null }));
  const [sellerId] = useState<string>('ventas01'); // ID del vendedor por defecto


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

  useEffect(() => {
    localStorage.setItem('appCustomization', JSON.stringify(appCustomization));
  }, [appCustomization]);

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
    <StateContext.Provider value={{ sales, setSales, winningResults, setWinningResults, winners, addWinner, lotteries, setLotteries, appCustomization, setAppCustomization, sellerId }}>
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
