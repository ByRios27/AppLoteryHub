'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Sale, Winner, Lottery, SpecialPlay } from '@/lib/data';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

const getUniqueItems = <T extends { id: string }>(items: T[]): T[] => {
    if (!Array.isArray(items)) return [];
    return Array.from(new Map(items.map(item => [item.id, item])).values());
};

interface StateContextType {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  updateSale: (saleId: string, updatedData: Partial<Sale>) => void;
  winningResults: WinningResults;
  addWinningResult: (lotteryId: string, drawTime: string, prizes: string[]) => void;
  updateWinningResult: (date: string, lotteryId: string, drawTime: string, newPrizes: string[]) => void;
  deleteWinningResult: (date: string, lotteryId: string, drawTime: string) => void;
  winners: Winner[];
  addWinner: (winner: Omit<Winner, 'drawDate' | 'paid'>) => void;
  confirmAndPayWinner: (winnerId: string) => void;
  lotteries: Lottery[];
  setLotteries: React.Dispatch<React.SetStateAction<Lottery[]>>;
  specialPlays: SpecialPlay[];
  setSpecialPlays: React.Dispatch<React.SetStateAction<SpecialPlay[]>>;
  businessSettings: BusinessSettings;
  setBusinessSettings: React.Dispatch<React.SetStateAction<BusinessSettings>>;
  sellerId: string;
  verificarGanadores: (lotteryId: string, drawTime: string, prizes: string[]) => void;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

const defaultSpecialPlays: SpecialPlay[] = [
    { id: 'palet', name: 'Palet', icon: 'game-console', type: 'multi_pick', numberOfPicks: 2, cost: 1.00, enabled: false, appliesTo: [], },
    { id: 'tripleta', name: 'Tripleta', icon: 'game-console', type: 'multi_pick', numberOfPicks: 3, cost: 1.00, enabled: true, appliesTo: [], },
    { id: 'arma-tu-suerte', name: 'Arma tu suerte', icon: 'game-console', type: 'single_pick', numberOfDigits: 4, cost: 1.00, enabled: true, appliesTo: [], },
];

export const StateContextProvider = ({ children }: { children: ReactNode }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [winningResults, setWinningResults] = useState<WinningResults>({});
  const [winners, setWinners] = useState<Winner[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [specialPlays, setSpecialPlays] = useState<SpecialPlay[]>([]);
  const [sellerId] = useState<string>('ventas01');
  
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() => {
    if (typeof window === 'undefined') return { name: 'Lotto Hub', logo: null };
    try {
      const savedSettings = localStorage.getItem('business-settings');
      return savedSettings ? JSON.parse(savedSettings) : { name: 'Lotto Hub', logo: null };
    } catch (error) { return { name: 'Lotto Hub', logo: null }; }
  });

  useEffect(() => {
    const fetchLotteries = async () => {
      try {
        const response = await fetch('/api/lotteries');
        if (response.ok) {
          const data = await response.json();
          setLotteries(getUniqueItems(data));
        }
      } catch (error) {
        console.error("Failed to fetch lotteries:", error);
      }
    };
    fetchLotteries();
  }, []);

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('business-settings', JSON.stringify(businessSettings)); }, [businessSettings]);

  useEffect(() => {
    const savedSpecialPlays = localStorage.getItem('special-plays');
    const initialSpecialPlays = savedSpecialPlays ? JSON.parse(savedSpecialPlays) : [];
    const mergedSpecialPlays = defaultSpecialPlays.map(defaultPlay => {
        const savedPlay = initialSpecialPlays.find((p: SpecialPlay) => p.id === defaultPlay.id);
        return savedPlay ? { ...defaultPlay, ...savedPlay } : defaultPlay;
    });
    setSpecialPlays(mergedSpecialPlays);
  }, []);

  useEffect(() => { if (specialPlays.length > 0) localStorage.setItem('special-plays', JSON.stringify(specialPlays)); }, [specialPlays]);

  const updateSale = (saleId: string, updatedData: Partial<Sale>) => {
    setSales(prev => prev.map(sale => sale.id === saleId ? { ...sale, ...updatedData, id: sale.id } : sale));
  };

  const addWinner = (winnerData: Omit<Winner, 'drawDate' | 'paid'>) => {
    const newWinner: Winner = { ...winnerData, drawDate: new Date().toISOString(), paid: false };
    setWinners(prev => {
        if (prev.some(w => w.id === newWinner.id)) return prev;
        toast.success(`¡Nuevo Ganador! Ticket ${newWinner.ticketNumber}`);
        return [...prev, newWinner];
    });
  };

  const confirmAndPayWinner = (winnerId: string) => {
    const winnerToPay = winners.find(w => w.id === winnerId);
    if (winnerToPay) {
        setWinners(prev => prev.filter(winner => winner.id !== winnerId));
        toast.success(`Premio del ticket #${winnerToPay.ticketNumber} ha sido pagado y archivado.`);
    }
  };

  const verificarGanadores = (lotteryId: string, drawTime: string, prizes: string[]) => {
    if (!prizes || prizes.length < 3) return;
    // Simple re-verification: remove old winners for this draw and add new ones.
    setWinners(prev => prev.filter(w => !(w.lotteryId === lotteryId && w.drawTime === drawTime)));

    const applicableSales = sales.filter(sale => sale.draws.some(draw => draw.lotteryId === lotteryId && draw.drawTime === drawTime));
    applicableSales.forEach(sale => {
        if (sale.lotteryId === lotteryId) { 
            sale.tickets.forEach(ticket => {
                prizes.forEach((prize, index) => {
                    if (ticket.ticketNumber === prize) addWinner({ id: `${sale.id}-${ticket.id}`, lotteryId: sale.lotteryId || lotteryId, drawTime, ticketNumber: ticket.ticketNumber, prizeTier: index + 1 });
                });
            });
        }
    });

    const armaTuSuerte = specialPlays.find(sp => sp.id === 'arma-tu-suerte');
    if (armaTuSuerte?.enabled && armaTuSuerte.appliesTo?.some(a => a.lotteryId === lotteryId)) {
        const atsSales = sales.filter(s => s.specialPlayId === 'arma-tu-suerte' && s.draws.some(d => d.lotteryId === lotteryId && d.drawTime === drawTime));
        atsSales.forEach(sale => {
            sale.tickets.forEach(ticket => {
                const playedNumber = ticket.ticketNumber;
                let winningTier = 0;
                if (prizes.includes(playedNumber)) winningTier = 1;
                else if (prizes.some(p => playedNumber.substring(0, 3) === p.substring(0, 3) || playedNumber.substring(1) === p.substring(1))) winningTier = 2;
                else if (prizes.some(p => playedNumber.substring(0, 2) === p.substring(0, 2) || playedNumber.substring(2) === p.substring(2))) winningTier = 3;
                if (winningTier > 0) addWinner({ id: `${sale.id}-${ticket.id}`, lotteryId, drawTime, ticketNumber: playedNumber, prizeTier: winningTier, specialPlayId: 'arma-tu-suerte' });
            });
        });
    }
  };

  const addWinningResult = (lotteryId: string, drawTime: string, prizes: string[]) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      setWinningResults(prev => {
          const newResults = { ...prev };
          if (!newResults[today]) newResults[today] = {};
          if (!newResults[today][lotteryId]) newResults[today][lotteryId] = {};
          newResults[today][lotteryId][drawTime] = prizes;
          return newResults;
      });
      verificarGanadores(lotteryId, drawTime, prizes);
  };

  const updateWinningResult = (date: string, lotteryId: string, drawTime: string, newPrizes: string[]) => {
    setWinningResults(prev => {
        const newResults = JSON.parse(JSON.stringify(prev)); // Deep copy
        if (newResults[date]?.[lotteryId]?.[drawTime]) {
            newResults[date][lotteryId][drawTime] = newPrizes;
        }
        return newResults;
    });
    verificarGanadores(lotteryId, drawTime, newPrizes);
    toast.success("Resultado actualizado y ganadores re-verificados.");
  };

  const deleteWinningResult = (date: string, lotteryId: string, drawTime: string) => {
    setWinningResults(prev => {
        const newResults = JSON.parse(JSON.stringify(prev)); // Deep copy
        if (newResults[date]?.[lotteryId]?.[drawTime]) {
            delete newResults[date][lotteryId][drawTime];
            if (Object.keys(newResults[date][lotteryId]).length === 0) delete newResults[date][lotteryId];
            if (Object.keys(newResults[date]).length === 0) delete newResults[date];
        }
        return newResults;
    });
    setWinners(prev => prev.filter(w => !(w.lotteryId === lotteryId && w.drawTime === drawTime && new Date(w.drawDate).toISOString().startsWith(date))));
    toast.info("Resultado eliminado y ganadores asociados removidos.");
  };

  const contextValue = {
    sales, setSales, updateSale,
    winningResults, addWinningResult, updateWinningResult, deleteWinningResult,
    winners, addWinner, confirmAndPayWinner, 
    lotteries, setLotteries, 
    specialPlays, setSpecialPlays,
    businessSettings, setBusinessSettings, 
    sellerId,
    verificarGanadores
  };

  return (
    <StateContext.Provider value={contextValue}>
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => {
  const context = useContext(StateContext);
  if (context === undefined) throw new Error('useStateContext must be used within a StateContextProvider');
  return context;
};
