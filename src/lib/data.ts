import type { LucideIcon } from 'lucide-react';
import { Clover, Diamond, Sun, Moon, Star, Crown, Gem, Hash, Dice5, Ticket } from 'lucide-react';

export type Lottery = {
  id: string;
  name: string;
  Icon: LucideIcon;
  drawTimes: string[];
};

export const lotteries: Lottery[] = [
  { id: 'lucky-clover', name: 'Lucky Clover', Icon: Clover, drawTimes: ['10:00 AM', '02:00 PM', '06:00 PM', '10:00 PM'] },
  { id: 'diamond-draw', name: 'Diamond Draw', Icon: Diamond, drawTimes: ['11:00 AM', '03:00 PM', '07:00 PM'] },
  { id: 'sunrise-stakes', name: 'Sunrise Stakes', Icon: Sun, drawTimes: ['09:00 AM', '01:00 PM'] },
  { id: 'moonlight-millions', name: 'Moonlight Millions', Icon: Moon, drawTimes: ['08:00 PM', '11:00 PM'] },
  { id: 'star-jackpot', name: 'Star Jackpot', Icon: Star, drawTimes: ['12:00 PM', '04:00 PM', '09:00 PM'] },
  { id: 'kings-ransom', name: 'King\'s Ransom', Icon: Crown, drawTimes: ['02:30 PM', '08:30 PM'] },
  { id: 'gem-gala', name: 'Gem Gala', Icon: Gem, drawTimes: ['10:30 AM', '01:30 PM', '05:30 PM', '09:30 PM'] },
  { id: 'number-fever', name: 'Number Fever', Icon: Hash, drawTimes: ['Every Hour'] },
  { id: 'dice-dreams', name: 'Dice Dreams', Icon: Dice5, drawTimes: ['11:30 AM', '04:30 PM'] },
  { id: 'golden-ticket', name: 'Golden Ticket', Icon: Ticket, drawTimes: ['01:00 PM', '07:00 PM'] },
];

export type SoldTicket = {
  id: string;
  lotteryId: string;
  drawTime: string;
  ticketNumber: string; // 00-99
  fractions: number;
  cost: number;
  soldAt: Date;
  isWinner?: boolean;
  isPaid?: boolean;
};
