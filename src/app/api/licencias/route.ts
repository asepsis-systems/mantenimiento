import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const carpetaId = searchParams.get('carpetaId');
    
    const filter: any = {};
    if (carpetaId === 'all') {
      // Return all licenses regardless of folder
    } else if (carpetaId === 'null' || !carpetaId) {
      filter.carpetaId = null;
    } else {
      filter.carpetaId = carpetaId;
    }

    const licenses = await db.license.findMany({
      where: filter,
      orderBy: { expiryDate: 'asc' }
    });
    return NextResponse.json({ success: true, licenses });
  } catch (error: any) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, entity, code, issueDate, expiryDate, status, carpetaId, archivoNombre, archivoPath } = body;

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
        status: status || 'VIGENTE',
        carpetaId: carpetaId || null,
        archivoNombre: archivoNombre || null,
        archivoPath: archivoPath || null
      }
    });

    return NextResponse.json({ success: true, license });
  } catch (error: any) {
    console.error('Error creating license:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
