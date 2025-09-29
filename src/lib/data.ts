export interface Lottery {
  id: string;
  name: string;
  description?: string;
  drawTimes: string[];
  icon: string;
  numberOfDigits: number;
  logo?: string;
  cost: number;
}

export interface TicketDetail {
  id: string;
  ticketNumber: string;
  fractions: number;
  cost: number;
}

export interface Sale {
  id: string;
  lotteryId: string;
  drawTime: string;
  customerName?: string;
  customerPhone?: string;
  tickets: TicketDetail[];
  totalCost: number;
  soldAt: Date;
}

export type Winner = {
    id: string; // Corresponds to TicketDetail id
    lotteryId: string;
    drawTime: string;
    ticketNumber: string;
    prizeTier: number;
    drawDate: string;
    paid: boolean; // Payment status
};

export const lotteries: Lottery[] = [
  {
    id: "loto-diaria",
    name: "Loto Diaria",
    description: "Sorteos diarios para ganar al instante.",
    drawTimes: ["11:00 AM", "3:00 PM", "9:00 PM"],
    icon: "Sun",
    numberOfDigits: 2,
    cost: 10,
  },
  {
    id: "la-grande",
    name: "La Grande",
    description: "El premio mayor que cambia vidas.",
    drawTimes: ["9:00 PM"],
    icon: "Star",
    numberOfDigits: 5,
    cost: 25,
  },
  {
    id: "pega3",
    name: "Pega3",
    description: "Tres oportunidades para ganar.",
    drawTimes: ["11:00 AM", "3:00 PM", "9:00 PM"],
    icon: "Dice5",
    numberOfDigits: 3,
    cost: 15,
  },
  {
    id: "terminacion-2",
    name: "Terminación 2",
    description: "Gana con los dos últimos dígitos.",
    drawTimes: ["11:00 AM", "9:00 PM"],
    icon: "Hash",
    numberOfDigits: 2,
    cost: 5,
  },
];
