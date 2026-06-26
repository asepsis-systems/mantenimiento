import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const spareParts = await db.sparePart.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ success: true, spareParts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, stock, minStock, price, location } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: 'El nombre y código son obligatorios.' }, { status: 400 });
    }

    // Check if code already exists
    const existing = await db.sparePart.findUnique({
      where: { code }
    });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Ya existe un repuesto con ese código.' }, { status: 400 });
    }

    const sparePart = await db.sparePart.create({
      data: {
        name,
        code,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        price: price ? Number(price) : null,
        location: location || ''
      }
    });

    return NextResponse.json({ success: true, sparePart });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
