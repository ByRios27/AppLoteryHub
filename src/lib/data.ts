import { LucideIcon } from 'lucide-react';

// Represents a lottery, including its visual representation and draw schedule.
export interface Lottery {
  id: string;
  name: string;
  icon: string; // Storing only the icon name as a string for serialization.
  drawTimes: string[];
  cost: number;
  numberOfDigits: number;
}

// Defines special play types, which can be either single or multi-pick.
export interface SpecialPlay {
  id: string;
  name: string;
  icon: string; // Storing only the icon name for consistency.
  cost: number;
  enabled: boolean;
  type: 'multi_pick' | 'single_pick';
  numberOfPicks?: number;      // Optional: For multi_pick type.
  numberOfDigits?: number;     // Optional: For single_pick type.
  appliesTo?: { lotteryId: string }[];
}

// Represents a completed sale, including details about what was sold and when.
export interface Sale {
  id: string;
  draws: { lotteryId: string; drawTime: string; }[]; 
  customerName?: string;
  customerPhone?: string;
  tickets: Ticket[];
  totalCost: number;
  soldAt: string;        // ISO date string for when the sale occurred.
  createdAt: string;     // Added for compatibility with existing code expecting this field.
  drawTime: string;      // Added for simplicity where a single draw time is assumed.
  sellerId?: string;
  lotteryId?: string;      // Optional: For standard sales.
  specialPlayId?: string;  // Optional: For special play sales.
}

// Represents a single ticket within a sale.
export interface Ticket {
  id: string;
  ticketNumber: string;
  fractions: number;
  cost: number;
}

// Represents a winning ticket, linking a sale to a specific draw and prize.
export interface Winner {
  id: string; 
  lotteryId: string; 
  drawTime: string;
  ticketNumber: string;
  prizeTier: number; // e.g., 1 for 1st, 2 for 2nd, etc.
  drawDate: string;    // ISO date string.
  paid: boolean;
  specialPlayId?: string; // Optional: To identify winners from special plays.
}

// A temporary structure used for entering sales data.
export interface SaleEntry {
  ticketNumber: string;
  amount: number;
  drawTime: string;
}
