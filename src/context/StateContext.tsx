'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Sale, Winner, Lottery, SpecialPlay } from '@/lib/data';
import { lotteries as initialLotteries } from '@/lib/initial-data';
import { differenceInHours, subDays, format } from 'date-fns';
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

// A more robust function to get and parse data from localStorage
function getStoredData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const savedData = localStorage.getItem(key);
    if (!savedData) return defaultValue;

    const parsed = JSON.parse(savedData);
    return parsed ?? defaultValue;
  } catch (error) {
    console.error(`Error processing ${key} from localStorage`, error);
    localStorage.removeItem(key); // Remove corrupted data
    return defaultValue;
  }
}

export const StateContextProvider = ({ children }: { children: ReactNode }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [winningResults, setWinningResults] = useState<WinningResults>({});
  const [winners, setWinners] = useState<Winner[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>(() => getUniqueItems(initialLotteries));
  const [specialPlays, setSpecialPlays] = useState<SpecialPlay[]>([]);
  const [appCustomization, setAppCustomization] = useState<AppCustomization>({ appName: 'Lotto Hub', appLogo: null });
  const [sellerId] = useState<string>('ventas01');
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect for loading all data from localStorage on initial mount
  useEffect(() => {
    const now = new Date();

    // Load and filter sales, winners, and results
    setSales(getStoredData('lotterySales', []).filter(sale => differenceInHours(now, new Date(sale.soldAt)) < 12));
    setWinners(getStoredData('lotteryWinners', []).filter(winner => differenceInHours(now, new Date(winner.drawDate)) < 24));
    
    const resultsData = getStoredData('winningResults', {});
    const sevenDaysAgo = subDays(now, 7);
    const validResults = Object.entries(resultsData).reduce<WinningResults>((acc, [dateStr, dailyResults]) => {
      if (new Date(dateStr) >= sevenDaysAgo) {
        acc[dateStr] = dailyResults;
      }
      return acc;
    }, {});
    setWinningResults(validResults);

    // Load and deduplicate lotteries and special plays
    setLotteries(getUniqueItems(getStoredData('appLotteries', initialLotteries)));
    setSpecialPlays(getUniqueItems(getStoredData('appSpecialPlays', [])));
    setAppCustomization(getStoredData('appCustomization', { appName: 'Lotto Hub', appLogo: null }));

    setIsInitialized(true);
  }, []);

  // Effect for saving all data to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('lotterySales', JSON.stringify(sales));
        localStorage.setItem('winningResults', JSON.stringify(winningResults));
        localStorage.setItem('lotteryWinners', JSON.stringify(winners));
        
        // Deduplicate before saving
        localStorage.setItem('appLotteries', JSON.stringify(getUniqueItems(lotteries)));
        localStorage.setItem('appSpecialPlays', JSON.stringify(getUniqueItems(specialPlays).slice(-100)));
        localStorage.setItem('appCustomization', JSON.stringify(appCustomization));

      } catch (e) {
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          console.error("LocalStorage quota exceeded!", e);
          toast.error('Error: El almacenamiento está lleno. No se pueden guardar nuevos datos.');
        } else {
          console.error("Failed to save to localStorage", e);
          toast.error('Ocurrió un error inesperado al guardar los datos.');
        }
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
