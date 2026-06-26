import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const responsables = await db.responsable.findMany({
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json({ success: true, responsables });
  } catch (error: any) {
    console.error('Error fetching responsables:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre del responsable es obligatorio.' }, { status: 400 });
    }

    const cleanNombre = nombre.trim();

    // Check if unique
    const existing = await db.responsable.findUnique({
      where: { nombre: cleanNombre }
    });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Ya existe un responsable con ese nombre.' }, { status: 400 });
    }

    const responsable = await db.responsable.create({
      data: { nombre: cleanNombre }
    });

    return NextResponse.json({ success: true, responsable });
  } catch (error: any) {
    console.error('Error creating responsable:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
