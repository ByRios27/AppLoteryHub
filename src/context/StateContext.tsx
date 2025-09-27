'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Sale, TicketDetail, Winner } from '@/lib/data';

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
  addWinner: (lotteryId: string, ticketNumber: string, prizeTier: number) => void;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateContextProvider = ({ children }: { children: ReactNode }) => {
  const [sales, setSales] = useState<Sale[]>(() => {
    if (typeof window !== 'undefined') {
      const savedSales = localStorage.getItem('lotterySales');
      return savedSales ? JSON.parse(savedSales) : [];
    }
    return [];
  });

  const [winningResults, setWinningResults] = useState<WinningResults>(() => {
    if (typeof window !== 'undefined') {
      const savedResults = localStorage.getItem('winningResults');
      return savedResults ? JSON.parse(savedResults) : {};
    }
    return {};
  });

  const [winners, setWinners] = useState<Winner[]>(() => {
    if (typeof window !== 'undefined') {
      const savedWinners = localStorage.getItem('lotteryWinners');
      return savedWinners ? JSON.parse(savedWinners) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('lotterySales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('winningResults', JSON.stringify(winningResults));
  }, [winningResults]);

  useEffect(() => {
    localStorage.setItem('lotteryWinners', JSON.stringify(winners));
  }, [winners]);

  const addWinner = (lotteryId: string, ticketNumber: string, prizeTier: number) => {
    // Find the sale and ticket corresponding to the winner
    let foundTicket: TicketDetail | undefined;
    let foundSale: Sale | undefined;

    for (const sale of sales) {
        foundTicket = sale.tickets.find(t => t.ticketNumber === ticketNumber);
        if(foundTicket) {
            foundSale = sale;
            break;
        }
    }

    if (foundTicket && foundSale) {
      const newWinner: Winner = {
        id: foundTicket.id, // Assign ticketId to winner id
        lotteryId: lotteryId,
        ticketNumber: ticketNumber,
        prizeTier: prizeTier,
        drawDate: new Date().toISOString(),
      };

      setWinners(prevWinners => [...prevWinners, newWinner]);
    }
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
