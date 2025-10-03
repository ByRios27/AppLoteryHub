import { LucideIcon } from 'lucide-react';

export interface Lottery {
  id: string;
  name: string;
  icon: string | LucideIcon;
  drawTimes: string[];
  cost: number;
  numberOfDigits: number;
}

export interface SpecialPlay {
  id: string;
  name: string;
  icon: string | LucideIcon;
  cost: number;
  enabled: boolean;
  type: 'multi_pick' | 'single_pick';
  numberOfPicks?: number;      // For multi_pick
  numberOfDigits?: number;     // For single_pick
  appliesTo?: { lotteryId: string }[];
}

export interface Sale {
  id: string;
  draws: { lotteryId: string; drawTime: string; }[]; 
  customerName?: string;
  customerPhone?: string;
  tickets: Ticket[];
  totalCost: number;
  soldAt: Date;
  sellerId?: string;
  lotteryId?: string;      // For standard sales
  specialPlayId?: string;  // For special play sales
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  fractions: number;
  cost: number;
}

export interface Winner {
  id: string; 
  lotteryId: string; 
  drawTime: string;
  ticketNumber: string;
  prizeTier: number; // e.g., 1 for 1st, 2 for 2nd, etc.
  drawDate: string;
  paid: boolean;
  specialPlayId?: string; // To identify winners from special plays
}

export interface SaleEntry {
  ticketNumber: string;
  amount: number;
  drawTime: string;
}
