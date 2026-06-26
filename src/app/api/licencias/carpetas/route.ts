import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const carpetas = await db.licenciaCarpeta.findMany({
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json({ success: true, carpetas });
  } catch (error: any) {
    console.error('Error fetching license folders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre de la carpeta es obligatorio.' }, { status: 400 });
    }

    const cleanNombre = nombre.trim();

    // Check if unique
    const existing = await db.licenciaCarpeta.findUnique({
      where: { nombre: cleanNombre }
    });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Ya existe una carpeta con ese nombre.' }, { status: 400 });
    }

    const carpeta = await db.licenciaCarpeta.create({
      data: { nombre: cleanNombre }
    });

    return NextResponse.json({ success: true, carpeta });
  } catch (error: any) {
    console.error('Error creating license folder:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
