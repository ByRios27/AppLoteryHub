'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Sale, Winner, Lottery, SpecialPlay } from '@/lib/data';
import { lotteries as initialLotteries } from '@/lib/initial-data';
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
  specialPlays: SpecialPlay[];
  setSpecialPlays: React.Dispatch<React.SetStateAction<SpecialPlay[]>>;
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
    return parsed ?? defaultValue;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage`, error);
    localStorage.removeItem(key); 
    return defaultValue;
  }
}

export const StateContextProvider = ({ children }: { children: ReactNode }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [winningResults, setWinningResults] = useState<WinningResults>({});
  const [winners, setWinners] = useState<Winner[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>(initialLotteries);
  const [specialPlays, setSpecialPlays] = useState<SpecialPlay[]>([]);
  const [appCustomization, setAppCustomization] = useState<AppCustomization>({ appName: 'Lotto Hub', appLogo: null });
  const [sellerId] = useState<string>('ventas01');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // This effect runs only once on the client after hydration
    const now = new Date();

    // Clean and load sales
    const salesData = getStoredData('lotterySales', [] as Sale[]);
    const validSales = salesData.filter(sale => differenceInHours(now, new Date(sale.soldAt)) < 12);
    setSales(validSales);

    // Clean and load winners
    const winnersData = getStoredData('lotteryWinners', [] as Winner[]);
    const validWinners = winnersData.filter(winner => differenceInHours(now, new Date(winner.drawDate)) < 24);
    setWinners(validWinners);

    // Clean and load winning results
    const resultsData = getStoredData('winningResults', {} as WinningResults);
    const validResults: WinningResults = {};
    const sevenDaysAgo = subDays(now, 7);
    Object.entries(resultsData).forEach(([dateStr, dailyResults]) => {
      if (new Date(dateStr) >= sevenDaysAgo) {
        validResults[dateStr] = dailyResults;
      }
    });
    setWinningResults(validResults);

    // Load other data
    setLotteries(getStoredData('appLotteries', initialLotteries));
    setSpecialPlays(getStoredData('appSpecialPlays', []));
    setAppCustomization(getStoredData('appCustomization', { appName: 'Lotto Hub', appLogo: null }));

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('lotterySales', JSON.stringify(sales));
        localStorage.setItem('winningResults', JSON.stringify(winningResults));
        localStorage.setItem('lotteryWinners', JSON.stringify(winners));
        localStorage.setItem('appLotteries', JSON.stringify(lotteries));
        localStorage.setItem('appSpecialPlays', JSON.stringify(specialPlays));
        localStorage.setItem('appCustomization', JSON.stringify(appCustomization));
      } catch (e) {
          console.error("Failed to save to localStorage", e);
      }
    }
  }, [sales, winningResults, winners, lotteries, specialPlays, appCustomization, isInitialized]);


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
      {isInitialized ? children : null}
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
