
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const salesFilePath = path.join(process.cwd(), 'src', 'lib', 'sales.json');

const readSalesFromFile = (): any[] => {
  try {
    const fileContent = fs.readFileSync(salesFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    return [];
  }
};

const writeSalesToFile = (sales: any[]) => {
  fs.writeFileSync(salesFilePath, JSON.stringify(sales, null, 2));
};

export async function POST(request: Request) {
  const saleData = await request.json();
  const sales = readSalesFromFile();
  sales.push(saleData);
  writeSalesToFile(sales);
  return NextResponse.json({ message: 'Sale recorded successfully.' }, { status: 200 });
}

export async function GET(request: Request) {
  const sales = readSalesFromFile();
  return NextResponse.json(sales, { status: 200 });
}
