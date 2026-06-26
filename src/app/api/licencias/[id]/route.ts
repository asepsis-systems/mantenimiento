import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, entity, code, issueDate, expiryDate, status } = body;

    if (!name || !entity || !issueDate || !expiryDate) {
      return NextResponse.json({ success: false, error: 'El nombre, entidad, fecha de emisión y vencimiento son obligatorios.' }, { status: 400 });
    }

    const license = await db.license.update({
      where: { id },
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

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.license.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
