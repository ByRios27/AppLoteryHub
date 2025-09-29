import { NextResponse } from 'next/server';

// NOTE: The file-based database is disabled because Vercel has a read-only filesystem.
// This API route is preserved to avoid 404 errors from the client, but it no longer reads or writes files.
// A proper database (e.g., Vercel KV, Postgres) would be needed to enable public QR verification.

export async function POST(request: Request) {
    // Immediately return a success response without writing to a file.
    return NextResponse.json({ message: 'Sale recording is currently disabled.' }, { status: 200 });
}

export async function GET(request: Request) {
    // Immediately return a not found response as no data can be retrieved.
    return NextResponse.json({ message: 'Sale lookup is currently disabled.' }, { status: 404 });
}
