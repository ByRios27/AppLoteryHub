import { Lottery } from './data';

export const lotteries: Lottery[] = [
    {
        id: 'loto-real',
        name: 'Loto Real',
        icon: 'gem', // Example icon
        numberOfDigits: 6,
        cost: 25,
        drawTimes: ['02:00 PM', '08:00 PM'],
    },
    {
        id: 'pega-4-real',
        name: 'Pega 4 Real',
        icon: 'diamond', // Example icon
        numberOfDigits: 4,
        cost: 20,
        drawTimes: ['02:00 PM', '08:00 PM'],
    },
    {
        id: 'loto-leidsa',
        name: 'Loto Leidsa',
        icon: 'star', // Example icon
        numberOfDigits: 6,
        cost: 30,
        drawTimes: ['09:00 PM'],
    },
];
