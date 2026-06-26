import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const licenses = await db.license.findMany({
      orderBy: { expiryDate: 'asc' }
    });
    return NextResponse.json({ success: true, licenses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, entity, code, issueDate, expiryDate, status } = body;

    if (!name || !entity || !issueDate || !expiryDate) {
      return NextResponse.json({ success: false, error: 'El nombre, entidad, fecha de emisión y vencimiento son obligatorios.' }, { status: 400 });
    }

    const license = await db.license.create({
      data: {
        name,
        entity,
        code: code || '',
        issueDate,
        expiryDate,
        status: status || 'VIGENTE'
      }
    });

    return NextResponse.json({ success: true, license });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
