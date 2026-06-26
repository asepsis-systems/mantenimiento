import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const tareas = await db.tarea.findMany({
      orderBy: { fecha_creacion: 'desc' }
    });
    return NextResponse.json({ success: true, tareas });
  } catch (error: any) {
    console.error('Error fetching tareas:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { responsable, descripcion, estado } = body;

    if (!descripcion || !descripcion.trim()) {
      return NextResponse.json({ success: false, error: 'La descripción es obligatoria.' }, { status: 400 });
    }
    if (!responsable || !responsable.trim()) {
      return NextResponse.json({ success: false, error: 'El responsable es obligatorio.' }, { status: 400 });
    }

    const cleanEstado = estado === 'HECHO' || estado === 'PENDIENTE' ? estado : 'PENDIENTE';

    const tarea = await db.tarea.create({
      data: {
        responsable: responsable.trim(),
        descripcion: descripcion.trim(),
        estado: cleanEstado
      }
    });

    return NextResponse.json({ success: true, tarea });
  } catch (error: any) {
    console.error('Error creating tarea:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
