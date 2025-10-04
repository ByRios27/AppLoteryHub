'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Sale, Winner, Lottery, SpecialPlay } from '@/lib/data';
import { lotteries as initialLotteries, specialPlays as initialSpecialPlays } from '@/lib/initial-data';
import { differenceInHours, subDays, format } from 'date-fns';
import { toast } from 'sonner';
import { StateContextType, WinningResults, AppCustomization, BusinessSettings } from '@/lib/types';

// A generic helper to remove duplicate items from an array based on their 'id' property.
const getUniqueItems = <T extends { id: string }>(items: T[]): T[] => {
    if (!Array.isArray(items)) return [];
    return Array.from(new Map(items.map(item => [item.id, item])).values());
};

const StateContext = createContext<StateContextType | undefined>(undefined);

// A more robust function to get and parse data from localStorage
function getStoredData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const savedData = localStorage.getItem(key);
    if (!savedData) return defaultValue;

    const parsed = JSON.parse(savedData) as T;
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
  const [specialPlays, setSpecialPlays] = useState<SpecialPlay[]>(() => getUniqueItems(initialSpecialPlays));
  const [appCustomization, setAppCustomization] = useState<AppCustomization>({ appName: 'Lotto Hub', appLogo: null });
  const [sellerId] = useState<string>('ventas01');
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect for loading all data from localStorage on initial mount
  useEffect(() => {
    const now = new Date();

    // Load and filter sales, winners, and results
    setSales(getStoredData<Sale[]>('lotterySales', []).filter(sale => differenceInHours(now, new Date(sale.soldAt)) < 12));
    setWinners(getStoredData<Winner[]>('lotteryWinners', []).filter(winner => differenceInHours(now, new Date(winner.drawDate)) < 24));
    
    const resultsData = getStoredData<WinningResults>('winningResults', {});
    const sevenDaysAgo = subDays(now, 7);
    const validResults = Object.entries(resultsData).reduce<WinningResults>((acc, [dateStr, dailyResults]) => {
      if (new Date(dateStr) >= sevenDaysAgo) {
        acc[dateStr] = dailyResults as any;
      }
      return acc;
    }, {});
    setWinningResults(validResults);

    // Load and deduplicate lotteries and special plays
    setLotteries(getUniqueItems(getStoredData<Lottery[]>('appLotteries', initialLotteries)));
    setSpecialPlays(getUniqueItems(getStoredData<SpecialPlay[]>('appSpecialPlays', initialSpecialPlays)));
    setAppCustomization(getStoredData<AppCustomization>('appCustomization', { appName: 'Lotto Hub', appLogo: null }));

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
        localStorage.setItem('appSpecialPlays', JSON.stringify(getUniqueItems(specialPlays)));
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

  const updateWinningResult = (date: string, lotteryId: string, drawTime: string, newPrizes: string[]) => {
    setWinningResults(prev => {
        const newResults = { ...prev };
        if (newResults[date] && newResults[date][lotteryId]) {
            newResults[date][lotteryId][drawTime] = newPrizes;
        }
        return newResults;
    });
    toast.success('Resultado actualizado exitosamente.');
  };

  const deleteWinningResult = (date: string, lotteryId: string, drawTime: string) => {
      setWinningResults(prev => {
          const newResults = { ...prev };
          if (newResults[date] && newResults[date][lotteryId]) {
              delete newResults[date][lotteryId][drawTime];
              if (Object.keys(newResults[date][lotteryId]).length === 0) {
                  delete newResults[date][lotteryId];
              }
              if (Object.keys(newResults[date]).length === 0) {
                  delete newResults[date];
              }
          }
          return newResults;
      });
      // Also remove associated winners
      setWinners(prev => prev.filter(w => !(w.lotteryId === lotteryId && w.drawTime === drawTime && w.drawDate.startsWith(date))));
      toast.info('Resultado y ganadores asociados eliminados.');
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

  const confirmAndPayWinner = (winnerId: string) => {
      setWinners(prev => prev.map(winner => winner.id === winnerId ? { ...winner, paid: true } : winner));
      toast.success("Premio pagado y archivado.");
  };

  const updateSale = (saleId: string, updatedSale: Partial<Sale>) => {
    setSales(prev => prev.map(sale => sale.id === saleId ? { ...sale, ...updatedSale } : sale));
  };

  const businessSettings: BusinessSettings = {
    lotteries,
    specialPlays
  };

  const contextValue: StateContextType = {
    sales, setSales, updateSale,
    winningResults, addWinningResult, updateWinningResult, deleteWinningResult,
    winners, addWinner, updateWinnerPaymentStatus, confirmAndPayWinner,
    lotteries, setLotteries, 
    specialPlays, setSpecialPlays,
    appCustomization, setAppCustomization, 
    businessSettings,
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
