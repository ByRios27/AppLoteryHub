'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Sale, Winner, Lottery, SpecialPlay } from '@/lib/data';
import { lotteries as initialLotteries } from '@/lib/initial-data';
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

interface BusinessSettings {
    name: string;
    logo: string | null;
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
  businessSettings: BusinessSettings;
  setBusinessSettings: React.Dispatch<React.SetStateAction<BusinessSettings>>;
  sellerId: string;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

const defaultSpecialPlays: SpecialPlay[] = [
  {
    id: 'palet',
    name: 'Palet',
    icon: 'game-console', // Placeholder icon
    numberOfPicks: 2,
    cost: 1.00,
    enabled: false,
  },
  {
    id: 'tripleta',
    name: 'Tripleta',
    icon: 'game-console', // Placeholder icon
    numberOfPicks: 3,
    cost: 1.00,
    enabled: false,
  },
  {
    id: 'arma-tu-suerte',
    name: 'Arma tu suerte',
    icon: 'game-console', // Placeholder icon
    numberOfPicks: 4, // Example, can be configured
    cost: 1.00,
    enabled: false,
  },
];

export const StateContextProvider = ({ children }: { children: ReactNode }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [winningResults, setWinningResults] = useState<WinningResults>({});
  const [winners, setWinners] = useState<Winner[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>(() => getUniqueItems(initialLotteries));
  const [specialPlays, setSpecialPlays] = useState<SpecialPlay[]>([]);
  const [sellerId] = useState<string>('ventas01');

  useEffect(() => {
    const savedSpecialPlays = localStorage.getItem('special-plays');
    const initialSpecialPlays = savedSpecialPlays ? JSON.parse(savedSpecialPlays) : [];

    // Merge default and saved special plays
    const mergedSpecialPlays = defaultSpecialPlays.map(defaultPlay => {
        const savedPlay = initialSpecialPlays.find((p: SpecialPlay) => p.id === defaultPlay.id);
        return savedPlay ? { ...defaultPlay, ...savedPlay } : defaultPlay;
    });

    setSpecialPlays(mergedSpecialPlays);
  }, []);

  useEffect(() => {
      if (specialPlays.length > 0) { // Avoid overwriting on initial load
        localStorage.setItem('special-plays', JSON.stringify(specialPlays));
      }
  }, [specialPlays]);

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() => {
    if (typeof window === 'undefined') {
      return { name: 'Lotto Hub', logo: null };
    }
    try {
      const savedSettings = localStorage.getItem('business-settings');
      return savedSettings ? JSON.parse(savedSettings) : { name: 'Lotto Hub', logo: null };
    } catch (error) {
      return { name: 'Lotto Hub', logo: null };
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('business-settings', JSON.stringify(businessSettings));
    }
  }, [businessSettings]);

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
    businessSettings, setBusinessSettings, 
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
