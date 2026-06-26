import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { responsable, descripcion, estado } = body;

    // Check if task exists
    const existing = await db.tarea.findUnique({
      where: { id }
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Tarea no encontrada.' }, { status: 404 });
    }

    const updateData: any = {};
    if (responsable !== undefined) {
      if (!responsable.trim()) {
        return NextResponse.json({ success: false, error: 'El responsable no puede estar vacío.' }, { status: 400 });
      }
      updateData.responsable = responsable.trim();
    }

    if (descripcion !== undefined) {
      if (!descripcion.trim()) {
        return NextResponse.json({ success: false, error: 'La descripción no puede estar vacía.' }, { status: 400 });
      }
      updateData.descripcion = descripcion.trim();
    }

    if (estado !== undefined) {
      if (estado !== 'HECHO' && estado !== 'PENDIENTE') {
        return NextResponse.json({ success: false, error: 'Estado inválido.' }, { status: 400 });
      }
      updateData.estado = estado;
    }

    const tarea = await db.tarea.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, tarea });
  } catch (error: any) {
    console.error(`Error updating tarea ${params}:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.tarea.findUnique({
      where: { id }
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Tarea no encontrada.' }, { status: 404 });
    }

    await db.tarea.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting tarea ${params}:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
