import { type NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { type Sale, type Lottery } from '@/lib/data';

// --- (SIMULACIÓN) Firebase Admin SDK ---
// Base de datos simulada de usuarios con roles
const fakeUsers: { [uid: string]: { role: 'admin' | 'seller' | 'user' } } = {
  'uid-admin': { role: 'admin' },
  'uid-seller': { role: 'seller' },
  'uid-user': { role: 'user' },
};

// Mapeo simulado de tokens a UIDs para representar sesiones válidas
const fakeTokens: { [token: string]: string } = {
  'VALID_TOKEN_ADMIN': 'uid-admin',
  'VALID_TOKEN_SELLER': 'uid-seller',
  'VALID_TOKEN_USER': 'uid-user',
};

const admin = {
  auth: () => ({
    verifyIdToken: async (token: string) => {
      if (token === 'FAKE_EXPIRED_TOKEN' || !fakeTokens[token]) {
        throw new Error('El token ha expirado o es inválido.');
      }
      return { uid: fakeTokens[token] };
    },
    getUser: async (uid: string) => {
      const user = fakeUsers[uid];
      if (!user) {
        throw new Error('Usuario no encontrado.');
      }
      return user;
    },
  }),
};
// --- Fin de la simulación ---

// --- Tipos de respuesta para GET y POST ---
interface GetApiResponse {
  id?: string;
  customerName?: string;
  lotteryName?: string;
  drawTime?: string;
  tickets?: { ticketNumber: string }[];
  createdAt?: string;
  message?: string;
}

interface PostApiResponse {
  valido?: boolean;
  numeros?: number[];
  message?: string;
}

// --- Simulación de consulta a la base de datos de tickets para POST ---
const fakeTicketDatabase: { [key: string]: { numeros: number[] } } = {
  'VALID123': { numeros: [10, 25, 42, 55, 67] },
  'ACTIVE789': { numeros: [5, 15, 30, 45, 60] },
};

async function findTicketByCode(code: string): Promise<{ numeros: number[] } | null> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const ticket = fakeTicketDatabase[code.toUpperCase()];
  return ticket || null;
}

// --- Helper para leer db.json para GET ---
async function readDb(): Promise<{ sales: Sale[]; lotteries: Lottery[] }> {
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  const jsonData = await fs.readFile(dbPath, 'utf-8');
  return JSON.parse(jsonData);
}

// --- Manejador Principal de la API ---
export async function GET(req: NextRequest) {
    try {
      // 1. Verificar el token de autenticación
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Token de autorización no proporcionado o con formato incorrecto.' }, { status: 401 });
      }
      const idToken = authHeader.split('Bearer ')[1];

      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (authError: any) {
        return NextResponse.json({ message: `Autenticación fallida: ${authError.message}` }, { status: 401 });
      }

      // 2. Verificar el rol del usuario
      const user = await admin.auth().getUser(decodedToken.uid);
      const userRole = user.role;

      if (userRole !== 'admin' && userRole !== 'seller') {
        return NextResponse.json({ message: 'Acceso denegado. No tienes los permisos necesarios.' }, { status: 403 });
      }

      // 3. Si la autorización es exitosa, proceder con la lógica original
      const ticketId = req.nextUrl.searchParams.get('ticketId');
      if (!ticketId || typeof ticketId !== 'string') {
        return NextResponse.json({ message: 'El ID del ticket es requerido.' }, { status: 400 });
      }
      
      const { sales, lotteries } = await readDb();
      const sale = sales.find(s => s.id === ticketId);

      if (!sale) {
        return NextResponse.json({ message: 'Ticket no encontrado o inválido.' }, { status: 404 });
      }
      
      const lottery = lotteries.find(l => l.id === sale.lotteryId);
      const lotteryName = lottery ? lottery.name : 'Lotería Desconocida';

      return NextResponse.json({
        id: sale.id,
        customerName: sale.customerName,
        lotteryName: lotteryName,
        drawTime: sale.drawTime,
        tickets: sale.tickets.map(t => ({ ticketNumber: t.ticketNumber })),
        createdAt: sale.createdAt,
      });
    } catch (error) {
      console.error('Error en GET /api/verificar-ticket:', error);
      if (error instanceof Error && (error.message.includes('Usuario no encontrado'))) {
          return NextResponse.json({ message: `Acceso denegado: ${error.message}` }, { status: 403 });
      }
      return NextResponse.json({ message: 'Ocurrió un error interno en el servidor.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Token de autorización no proporcionado o con formato incorrecto.' }, { status: 401 });
      }
      const idToken = authHeader.split('Bearer ')[1];

      try {
        await admin.auth().verifyIdToken(idToken);
      } catch (authError: any) {
        return NextResponse.json({ message: `Acceso denegado: ${authError.message}` }, { status: 403 });
      }

      const { code } = await req.json();
      if (!code || typeof code !== 'string') {
        return NextResponse.json({ message: 'El parámetro { code } es requerido en el body.' }, { status: 400 });
      }

      const ticketData = await findTicketByCode(code);
      if (!ticketData) {
        return NextResponse.json({ message: 'Ticket no encontrado o inválido.' }, { status: 404 });
      }

      return NextResponse.json({ valido: true, numeros: ticketData.numeros });

    } catch (error) {
      console.error('Error en POST /api/verificar-ticket:', error);
      return NextResponse.json({ message: 'Ocurrió un error interno en el servidor.' }, { status: 500 });
    }
}