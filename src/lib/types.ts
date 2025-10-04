
import { Sale, Winner, Lottery, SpecialPlay } from '@/lib/data';

// Defines the structure for business-related settings, including lotteries and special plays.
export interface BusinessSettings {
  lotteries: Lottery[];
  specialPlays: SpecialPlay[];
}

// Defines the structure for application customization settings, such as the app's name and logo.
export interface AppCustomization {
  appName: string;
  appLogo: string | null;
}

// Represents the shape of the global state context for the application.
export interface StateContextType {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  updateSale: (saleId: string, updatedSale: Partial<Sale>) => void;
  
  winningResults: WinningResults;
  addWinningResult: (lotteryId: string, drawTime: string, prizes: string[]) => void;
  updateWinningResult: (date: string, lotteryId: string, drawTime: string, prizes: string[]) => void;
  deleteWinningResult: (date: string, lotteryId: string, drawTime: string) => void;
  
  winners: Winner[];
  addWinner: (ticketId: string, lotteryId: string, drawTime: string, ticketNumber: string, prizeTier: number) => void;
  updateWinnerPaymentStatus: (winnerId: string, paid: boolean) => void;
  confirmAndPayWinner: (winnerId: string) => void;
  
  lotteries: Lottery[];
  setLotteries: React.Dispatch<React.SetStateAction<Lottery[]>>;
  
  specialPlays: SpecialPlay[];
  setSpecialPlays: React.Dispatch<React.SetStateAction<SpecialPlay[]>>;
  
  appCustomization: AppCustomization;
  setAppCustomization: React.Dispatch<React.SetStateAction<AppCustomization>>;
  
  // This combines lotteries and special plays into a single object for easier access.
  businessSettings: BusinessSettings; 
  
  sellerId: string;
}

// Custom type for organizing winning results by date, lottery, and draw time.
export type WinningResults = {
  [date: string]: {
    [lotteryId: string]: {
      [drawTime: string]: string[];
    };
  };
};
