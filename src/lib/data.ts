import type { LucideIcon } from 'lucide-react';
import { iconMap } from '@/lib/icon-map';

export type Lottery = {
  id: string;
  name: string;
  icon: keyof typeof iconMap;
  drawTimes: string[];
  numberOfDigits: number;
};

export const lotteries: Lottery[] = [
  { id: 'lucky-clover', name: 'Lucky Clover', icon: 'Clover', drawTimes: ['10:00 AM', '02:00 PM', '06:00 PM', '10:00 PM'], numberOfDigits: 2 },
  { id: 'diamond-draw', name: 'Diamond Draw', icon: 'Diamond', drawTimes: ['11:00 AM', '03:00 PM', '07:00 PM'], numberOfDigits: 3 },
  { id: 'sunrise-stakes', name: 'Sunrise Stakes', icon: 'Sun', drawTimes: ['09:00 AM', '01:00 PM'], numberOfDigits: 4 },
  { id: 'moonlight-millions', name: 'Moonlight Millions', icon: 'Moon', drawTimes: ['08:00 PM', '11:00 PM'], numberOfDigits: 5 },
  { id: 'star-jackpot', name: 'Star Jackpot', icon: 'Star', drawTimes: ['12:00 PM', '04:00 PM', '09:00 PM'], numberOfDigits: 2 },
  { id: 'kings-ransom', name: 'King\'s Ransom', icon: 'Crown', drawTimes: ['02:30 PM', '08:30 PM'], numberOfDigits: 3 },
  { id: 'gem-gala', name: 'Gem Gala', icon: 'Gem', drawTimes: ['10:30 AM', '01:30 PM', '05:30 PM', '09:30 PM'], numberOfDigits: 4 },
  { id: 'number-fever', name: 'Number Fever', icon: 'Hash', drawTimes: ['Every Hour'], numberOfDigits: 5 },
  { id: 'dice-dreams', name: 'Dice Dreams', icon: 'Dice5', drawTimes: ['11:30 AM', '04:30 PM'], numberOfDigits: 2 },
  { id: 'golden-ticket', name: 'Golden Ticket', icon: 'Ticket', drawTimes: ['01:00 PM', '07:00 PM'], numberOfDigits: 3 },
];

export type SoldTicket = {
  id: string;
  lotteryId: string;
  drawTime: string;
  ticketNumber: string; // 00-99
  fractions: number;
  cost: number;
  soldAt: Date;
  customerName?: string;
  customerPhone?: string;
  isWinner?: boolean;
  isPaid?: boolean;
};
