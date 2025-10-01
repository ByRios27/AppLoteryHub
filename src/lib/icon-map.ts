import { Ticket, Star, TrendingUp, Sun, Moon, Award } from 'lucide-react';

export const iconMap = {
    ticket: Ticket,
    star: Star,
    trendingUp: TrendingUp,
    sun: Sun,
    moon: Moon,
    award: Award,
    // Agrega más iconos según sea necesario
};

export type IconName = keyof typeof iconMap;
