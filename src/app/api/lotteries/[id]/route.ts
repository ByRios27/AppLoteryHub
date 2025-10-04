import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// GET a single lottery
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const docRef = doc(db, 'lotteries', params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return new NextResponse('Lottery not found', { status: 404 });
    }

    return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    console.error("Error fetching lottery: ", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT (update) a lottery
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const lotteryData = await request.json();
    const docRef = doc(db, 'lotteries', params.id);
    await updateDoc(docRef, lotteryData);
    return NextResponse.json({ id: params.id, ...lotteryData });
  } catch (error) {
    console.error("Error updating lottery: ", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE a lottery
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const docRef = doc(db, 'lotteries', params.id);
    await deleteDoc(docRef);
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("Error deleting lottery: ", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
