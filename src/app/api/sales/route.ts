import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// The path to the JSON file acting as a database
const dbPath = path.join(process.cwd(), 'src', 'lib', 'qr-database.json');

// Define the structure of the data to be stored for public verification
interface PublicSale {
    id: string;
    lotteryId: string;
    lotteryName: string;
    drawTime: string;
    customerName?: string;
    tickets: {
        id: string;
        ticketNumber: string;
        fractions: number;
        cost: number;
    }[];
    totalCost: number;
    soldAt: Date;
}

export async function POST(request: Request) {
    try {
        const newSale: PublicSale = await request.json();

        // Basic validation
        if (!newSale || !newSale.id) {
            return NextResponse.json({ message: 'Invalid sale data provided.' }, { status: 400 });
        }
        
        let dbData: PublicSale[] = [];
        try {
            // Read the existing database file
            const fileContents = await fs.readFile(dbPath, 'utf-8');
            // If the file is not empty, parse it
            if (fileContents) {
                dbData = JSON.parse(fileContents);
            }
        } catch (error: any) {
            // If the file doesn't exist (ENOENT), we'll proceed with an empty array.
            // For other errors, we log them but still proceed, to avoid blocking sales.
            if (error.code !== 'ENOENT') {
                console.error('Error reading QR database, will attempt to overwrite:', error);
            }
        }

        // Add the new sale to the array
        dbData.push(newSale);

        // Write the updated array back to the file
        await fs.writeFile(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');

        return NextResponse.json({ message: 'Sale recorded in public DB.', saleId: newSale.id }, { status: 201 });

    } catch (error) {
        console.error('Failed to write to QR database:', error);
        // This is a server error, so we return a 500 status
        return NextResponse.json({ message: 'Internal Server Error while writing to DB.' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const saleId = searchParams.get('saleId');

        const fileContents = await fs.readFile(dbPath, 'utf-8');
        const dbData: PublicSale[] = JSON.parse(fileContents);

        if (saleId) {
            const sale = dbData.find(s => s.id === saleId);
            if (sale) {
                return NextResponse.json(sale);
            } else {
                return NextResponse.json({ message: 'Sale not found.' }, { status: 404 });
            }
        } else {
            // For security, avoid returning all sales. 
            // This endpoint is for public verification of single tickets.
            return NextResponse.json({ message: 'A saleId is required.' }, { status: 400 });
        }
    } catch (error) {
         console.error('Failed to read from QR database:', error);
        return NextResponse.json({ message: 'Internal Server Error while reading from DB.' }, { status: 500 });
    }
}
