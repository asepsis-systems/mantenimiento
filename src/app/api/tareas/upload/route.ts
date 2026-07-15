import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

function addMonths(dateStr: string, months: number): string {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, 1);
  date.setMonth(date.getMonth() + months);
  const maxDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const targetDay = Math.min(day, maxDays);
  date.setDate(targetDay);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const id = formData.get('id') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se ha proporcionado ningún archivo.' }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Falta especificar el ID de la tarea.' }, { status: 400 });
    }

    // Check if task exists
    const existing = await db.tarea.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Tarea no encontrada.' }, { status: 404 });
    }

    // Validar límite máximo de 4 archivos en el historial de la base de datos
    const existingCount = await db.tareaArchivo.count({
      where: { tareaId: id }
    });
    if (existingCount >= 4) {
      return NextResponse.json({ success: false, error: 'Esta tarea ya cuenta con el límite máximo de 4 archivos en su historial. Elimina algunos en la papelera para continuar.' }, { status: 400 });
    }

    const customName = formData.get('customName') as string | null;
    const originalName = file.name;
    const displayName = customName || originalName;
    const extension = path.extname(originalName);

    // Set up local storage path inside MTTO project
    const uploadDir = path.join(process.cwd(), 'uploads', 'certificados');
    
    // Ensure the directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Unique file name based on task id + timestamp to keep history
    const fileName = `${id}-certificado-${Date.now()}${extension}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Write buffer to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    const certificateRelativePath = `uploads/certificados/${fileName}`;

    // Automatic State Transition Logic:
    // "Este estado (CULMINADO) se activa idealmente al completarse la fecha y el certificado."
    let targetEstado = existing.estado;
    let fechaUltimaEjecucion = existing.fechaUltimaEjecucion;
    let proximaEjecucion = existing.proximaEjecucion;

    const hasFechaCulminado = !!existing.fechaCulminado;
    if (hasFechaCulminado) {
      targetEstado = 'CULMINADO';
      fechaUltimaEjecucion = existing.fechaCulminado;
      if (existing.frecuenciaMeses !== null && existing.esRecurrente) {
        proximaEjecucion = addMonths(existing.fechaCulminado!, existing.frecuenciaMeses);
      }
    }

    // Update task
    const updatedTarea = await db.tarea.update({
      where: { id },
      data: {
        certificadoNombre: displayName,
        certificadoPath: certificateRelativePath,
        estado: targetEstado,
        fechaUltimaEjecucion,
        proximaEjecucion
      }
    });

    // Create a record for the uploaded file so we keep history
    try {
      await db.tareaArchivo.create({
        data: {
          tareaId: id,
          originalName: displayName,
          path: certificateRelativePath
        }
      });
    } catch (err) {
      console.error('No se pudo crear el registro de archivo en la BD:', err);
    }

    return NextResponse.json({ success: true, tarea: updatedTarea });
  } catch (error: any) {
    console.error('Error in task certificate upload API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
