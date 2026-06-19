import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, username: true, name: true, role: true }
  });

  if (!user) {
    return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ success: true, user });
}
