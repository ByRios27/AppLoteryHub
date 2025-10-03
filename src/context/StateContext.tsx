'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Sale, Winner, Lottery, SpecialPlay } from '@/lib/data';
import { lotteries as initialLotteries, specialPlays as initialSpecialPlays } from '@/lib/initial-data';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Custom type for winning results to avoid deeply nested objects
type WinningResults = {
  [date: string]: {
    [lotteryId: string]: {
      [drawTime: string]: string[];
    };
  };
};

interface AppCustomization {
    appName: string;
    appLogo: string | null;
}

// A generic helper to remove duplicate items from an array based on their 'id' property.
const getUniqueItems = <T extends { id: string }>(items: T[]): T[] => {
    if (!Array.isArray(items)) return [];
    return Array.from(new Map(items.map(item => [item.id, item])).values());
};

interface StateContextType {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  winningResults: WinningResults;
  addWinningResult: (lotteryId: string, drawTime: string, prizes: string[]) => void;
  winners: Winner[];
  addWinner: (ticketId: string, lotteryId: string, drawTime: string, ticketNumber: string, prizeTier: number) => void;
  updateWinnerPaymentStatus: (winnerId: string, paid: boolean) => void;
  lotteries: Lottery[];
  setLotteries: React.Dispatch<React.SetStateAction<Lottery[]>>;
  specialPlays: SpecialPlay[];
  setSpecialPlays: React.Dispatch<React.SetStateAction<SpecialPlay[]>>;
  appCustomization: AppCustomization;
  setAppCustomization: React.Dispatch<React.SetStateAction<AppCustomization>>;
  sellerId: string;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateContextProvider = ({ children }: { children: ReactNode }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [winningResults, setWinningResults] = useState<WinningResults>({});
  const [winners, setWinners] = useState<Winner[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>(() => getUniqueItems(initialLotteries));
  const [specialPlays, setSpecialPlays] = useState<SpecialPlay[]>(() => getUniqueItems(initialSpecialPlays));
  const [appCustomization, setAppCustomization] = useState<AppCustomization>({ appName: 'Lotto Hub', appLogo: null });
  const [sellerId] = useState<string>('ventas01');

  // This will clear all data on every refresh
  useEffect(() => {
    localStorage.clear();
  }, []);

  const addWinningResult = (lotteryId: string, drawTime: string, prizes: string[]) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      setWinningResults(prev => {
          const newResults = { ...prev };
          if (!newResults[today]) newResults[today] = {};
          if (!newResults[today][lotteryId]) newResults[today][lotteryId] = {};
          newResults[today][lotteryId][drawTime] = prizes;
          return newResults;
      });
  };

  const addWinner = (ticketId: string, lotteryId: string, drawTime: string, ticketNumber: string, prizeTier: number) => {
    const newWinner: Winner = {
      id: ticketId, lotteryId, drawTime, ticketNumber, prizeTier,
      drawDate: new Date().toISOString(),
      paid: false,
    };
    setWinners(prev => prev.some(w => w.id === ticketId) ? prev : [...prev, newWinner]);
  };
  
  const updateWinnerPaymentStatus = (winnerId: string, paid: boolean) => {
    setWinners(prev => prev.map(winner => winner.id === winnerId ? { ...winner, paid } : winner));
    toast.success(`Estado de pago actualizado para el ganador ${winnerId}.`);
  };

  const contextValue = {
    sales, setSales, 
    winningResults, addWinningResult,
    winners, addWinner, updateWinnerPaymentStatus, 
    lotteries, setLotteries, 
    specialPlays, setSpecialPlays,
    appCustomization, setAppCustomization, 
    sellerId
  };

  return (
    <StateContext.Provider value={contextValue}>
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
