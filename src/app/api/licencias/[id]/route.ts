import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, entity, code, issueDate, expiryDate, status, carpetaId, archivoNombre, archivoPath } = body;

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
        status: status || 'VIGENTE',
        carpetaId: carpetaId !== undefined ? (carpetaId === '' ? null : carpetaId) : undefined,
        archivoNombre: archivoNombre !== undefined ? archivoNombre : undefined,
        archivoPath: archivoPath !== undefined ? archivoPath : undefined
      }
    });

    return NextResponse.json({ success: true, license });
  } catch (error: any) {
    console.error(`Error updating license:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const license = await db.license.findUnique({
      where: { id }
    });

    if (license) {
      // 1. Delete license from database
      await db.license.delete({
        where: { id }
      });

      // 2. Clean up MTTO physical file from disk
      if (license.archivoPath) {
        try {
          const filePath = path.join(process.cwd(), license.archivoPath);
          await fs.unlink(filePath);
        } catch (err) {
          console.error('Failed to delete MTTO local file:', err);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting license ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
