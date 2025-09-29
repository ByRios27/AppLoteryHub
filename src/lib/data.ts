import { type LucideIcon } from 'lucide-react';

export interface Lottery {
  id: string;
  name: string;
  icon: string; // Can be a key of iconMap or a URL
  numberOfDigits: number;
  cost: number; // Cost per fraction/ticket
  drawTimes: string[]; // e.g., ['02:00 PM', '08:00 PM']
}

export interface SpecialPlay {
  id: string;
  name: string;
  icon: string;
  numberOfDigits: number;
  cost: number; // Cost for this special play participation
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  fractions: number;
  cost: number;
}

export interface Sale {
  id: string;
  // For regular sales, this array will have one item.
  // For special plays, it can have multiple items.
  draws: {
    lotteryId: string;
    drawTime: string;
  }[];
  customerName?: string;
  customerPhone?: string;
  tickets: Ticket[];
  totalCost: number;
  soldAt: Date;
  specialPlayId?: string; // Link to special play if applicable
}

export interface AppCustomization {
  appName: string;
  appLogo: string; // URL or base64 string
}
