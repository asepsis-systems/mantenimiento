import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, stock, minStock, price, location } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: 'El nombre y código son obligatorios.' }, { status: 400 });
    }

    // Check if code already exists on a different spare part
    const existing = await db.sparePart.findFirst({
      where: { 
        code,
        NOT: { id }
      }
    });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Ya existe otro repuesto con ese código.' }, { status: 400 });
    }

    const sparePart = await db.sparePart.update({
      where: { id },
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

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.sparePart.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
