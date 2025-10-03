import { IconName } from './icon-map';

export interface Lottery {
  id: string;
  name: string;
  icon: IconName | string; 
  numberOfDigits: number;
  cost: number; 
  drawTimes: string[];
}

export interface SpecialPlay {
  id: string;
  name: string;
  icon: IconName | string;
  cost: number;
  enabled: boolean;
  type: 'multi_pick' | 'single_pick'; // Type of play
  numberOfPicks?: number; // For multi_pick
  numberOfDigits?: number; // For single_pick
  appliesTo?: { lotteryId: string }[];
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  fractions: number;
  cost: number;
}

export interface Sale {
  id: string;
  draws: {
    lotteryId: string;
    drawTime: string;
  }[];
  customerName?: string;
  customerPhone?: string;
  tickets: Ticket[];
  totalCost: number;
  soldAt: Date;
  sellerId?: string;
  lotteryId?: string; // Link to regular lottery if applicable
  specialPlayId?: string; // Link to special play if applicable
}

export interface AppCustomization {
  appName: string;
  appLogo: string; 
}

export interface Winner {
  id: string;
  lotteryId: string;
  drawTime: string;
  ticketNumber: string;
  prizeTier: number;
  drawDate: string;
  paid: boolean;
}
