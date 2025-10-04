import { NextResponse } from 'next/server';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Asumo que tienes un archivo de configuración de Firebase

const lotteriesCollection = collection(db, 'lotteries');

// GET all lotteries
export async function GET() {
  try {
    const querySnapshot = await getDocs(lotteriesCollection);
    const lotteries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(lotteries);
  } catch (error) {
    console.error("Error fetching lotteries: ", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST a new lottery
export async function POST(request: Request) {
  try {
    const lotteryData = await request.json();
    const docRef = await addDoc(lotteriesCollection, lotteryData);
    return NextResponse.json({ id: docRef.id, ...lotteryData });
  } catch (error) {
    console.error("Error creating lottery: ", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
