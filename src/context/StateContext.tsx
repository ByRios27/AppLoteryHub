'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Sale, Winner, Lottery, lotteries as initialLotteries } from '@/lib/data';
import { differenceInHours, subDays, format } from 'date-fns';
import { toast } from 'sonner';

// Formato de WinningResults: { "YYYY-MM-DD": { "lotteryId": { "drawTime": ["prize1", "prize2", "prize3"] } } }
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
  appCustomization: AppCustomization;
  setAppCustomization: React.Dispatch<React.SetStateAction<AppCustomization>>;
  sellerId: string;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

function getStoredData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  const savedData = localStorage.getItem(key);
  if (!savedData) return defaultValue;

  try {
    const parsed = JSON.parse(savedData);
    // Basic validation to check if the parsed data has the expected shape, prevents crashes
    if (typeof parsed === typeof defaultValue && parsed !== null) {
      return parsed;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage`, error);
    localStorage.removeItem(key); 
    return defaultValue;
  }
}

const cleanOldData = () => {
    if (typeof window === 'undefined') return;
    const now = new Date();

    try {
      // Clean Sales (older than 12 hours)
      const sales = getStoredData<Sale[]>('lotterySales', []);
      const validSales = sales.filter(sale => differenceInHours(now, new Date(sale.soldAt)) < 12);
      localStorage.setItem('lotterySales', JSON.stringify(validSales));

      // Clean Winners (older than 24 hours)
      const winners = getStoredData<Winner[]>('lotteryWinners', []);
      const validWinners = winners.filter(winner => differenceInHours(now, new Date(winner.drawDate)) < 24);
      localStorage.setItem('lotteryWinners', JSON.stringify(validWinners));

      // Clean Winning Results (older than 7 days)
      const results = getStoredData<WinningResults>('winningResults', {});
      const validResults: WinningResults = {};
      const sevenDaysAgo = subDays(now, 7);

      Object.entries(results).forEach(([dateStr, dailyResults]) => {
          if (new Date(dateStr) >= sevenDaysAgo) {
              validResults[dateStr] = dailyResults;
          }
      });
      localStorage.setItem('winningResults', JSON.stringify(validResults));
    } catch (error) {
        console.error("Error cleaning old data from localStorage", error);
    }
};


export const StateContextProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    // Run cleaning logic only once on initial mount
    cleanOldData();
  }, []);

  const [sales, setSales] = useState<Sale[]>(() => getStoredData('lotterySales', []));
  const [winningResults, setWinningResults] = useState<WinningResults>(() => getStoredData('winningResults', {}));
  const [winners, setWinners] = useState<Winner[]>(() => getStoredData('lotteryWinners', []));
  const [lotteries, setLotteries] = useState<Lottery[]>(() => getStoredData('appLotteries', initialLotteries));
  const [appCustomization, setAppCustomization] = useState<AppCustomization>(() => getStoredData('appCustomization', { appName: 'Lotto Hub', appLogo: null }));
  const [sellerId] = useState<string>('ventas01');


  useEffect(() => {
    try {
        localStorage.setItem('lotterySales', JSON.stringify(sales));
    } catch (e) {
        console.error("Failed to save sales to localStorage", e);
    }
  }, [sales]);

  useEffect(() => {
    try {
        localStorage.setItem('winningResults', JSON.stringify(winningResults));
    } catch (e) {
        console.error("Failed to save winning results to localStorage", e);
    }
  }, [winningResults]);

  useEffect(() => {
    try {
        localStorage.setItem('lotteryWinners', JSON.stringify(winners));
    } catch (e) {
        console.error("Failed to save winners to localStorage", e);
    }
  }, [winners]);
  
  useEffect(() => {
    try {
        localStorage.setItem('appLotteries', JSON.stringify(lotteries));
    } catch (e) {
        console.error("Failed to save lotteries to localStorage", e);
    }
  }, [lotteries]);

  useEffect(() => {
    try {
        localStorage.setItem('appCustomization', JSON.stringify(appCustomization));
    } catch (e) {
        console.error("Failed to save app customization to localStorage", e);
    }
  }, [appCustomization]);


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
      id: ticketId,
      lotteryId,
      drawTime,
      ticketNumber,
      prizeTier,
      drawDate: new Date().toISOString(),
      paid: false,
    };

    setWinners(prevWinners => {
      const safePrevWinners = Array.isArray(prevWinners) ? prevWinners : [];
      if (safePrevWinners.some(winner => winner.id === newWinner.id)) {
        return safePrevWinners; 
      }
      return [...safePrevWinners, newWinner];
    });
  };
  
  const updateWinnerPaymentStatus = (winnerId: string, paid: boolean) => {
    setWinners(prevWinners => 
        prevWinners.map(winner => 
            winner.id === winnerId ? { ...winner, paid } : winner
        )
    );
    toast.success(`Estado de pago actualizado para el ganador ${winnerId}.`);
  };

  return (
    <StateContext.Provider value={{ 
        sales, setSales, 
        winningResults, addWinningResult,
        winners, addWinner, updateWinnerPaymentStatus, 
        lotteries, setLotteries, 
        appCustomization, setAppCustomization, 
        sellerId 
    }}>
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
