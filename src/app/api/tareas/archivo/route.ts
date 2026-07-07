import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Falta especificar el ID de la tarea.' },
        { status: 400 }
      );
    }

    const tarea = await db.tarea.findUnique({
      where: { id }
    });

    if (!tarea) {
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada.' },
        { status: 404 }
      );
    }

    const originalName = tarea.certificadoNombre;
    const relativePath = tarea.certificadoPath;

    if (!originalName || !relativePath) {
      return NextResponse.json(
        { success: false, error: 'La tarea no cuenta con ningún certificado cargado.' },
        { status: 404 }
      );
    }

    const filePath = path.join(process.cwd(), relativePath);

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { success: false, error: 'El archivo físico no se encuentra en el servidor local.' },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.readFile(filePath);
    const extension = path.extname(originalName).toLowerCase();

    // Map common extensions to their MIME types
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
    };

    const contentType = mimeTypes[extension] || 'application/octet-stream';
    const isViewable = ['.pdf', '.jpg', '.jpeg', '.png', '.gif'].includes(extension);
    const disposition = isViewable ? 'inline' : 'attachment';

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(originalName)}"`,
      },
    });
  } catch (error: any) {
    console.error('Error serving task certificate file:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
