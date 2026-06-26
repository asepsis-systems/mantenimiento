import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre del responsable es obligatorio.' }, { status: 400 });
    }

    const newNombre = nombre.trim();

    // Check if unique on other items
    const existingOther = await db.responsable.findFirst({
      where: {
        nombre: newNombre,
        NOT: { id }
      }
    });
    if (existingOther) {
      return NextResponse.json({ success: false, error: 'Ya existe otro responsable con ese nombre.' }, { status: 400 });
    }

    // Get the old name first to update tasks
    const existing = await db.responsable.findUnique({
      where: { id }
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Responsable no encontrado.' }, { status: 404 });
    }

    const oldNombre = existing.nombre;

    let updatedResponsable;
    await db.$transaction(async (tx) => {
      // Rename responsible
      updatedResponsable = await tx.responsable.update({
        where: { id },
        data: { nombre: newNombre }
      });

      // Update all tasks with this old name
      await tx.tarea.updateMany({
        where: { responsable: oldNombre },
        data: { responsable: newNombre }
      });
    });

    return NextResponse.json({ success: true, responsable: updatedResponsable });
  } catch (error: any) {
    console.error(`Error updating responsable ${params}:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.responsable.findUnique({
      where: { id }
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Responsable no encontrado.' }, { status: 404 });
    }

    await db.responsable.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting responsable ${params}:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
