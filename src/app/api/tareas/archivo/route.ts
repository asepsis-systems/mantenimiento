import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const file = searchParams.get('file');

    // If file query is provided, serve that physical file from uploads/certificados
    if (file) {
      const safeName = path.basename(file);
      const filePath = path.join(process.cwd(), 'uploads', 'certificados', safeName);
      try {
        await fs.access(filePath);
      } catch {
        return NextResponse.json({ success: false, error: 'El archivo no se encuentra en el servidor.' }, { status: 404 });
      }
      const fileBuffer = await fs.readFile(filePath);
      const extension = path.extname(safeName).toLowerCase();
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
          'Content-Disposition': `${disposition}; filename="${encodeURIComponent(safeName)}"`,
        },
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Falta especificar el ID de la tarea.' },
        { status: 400 }
      );
    }

    // If list=true, return JSON list of files associated to the task
    const list = searchParams.get('list');
    if (list === 'true') {
      const files = await db.tareaArchivo.findMany({
        where: { tareaId: id },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ success: true, files });
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Falta especificar el ID del archivo a eliminar.' },
        { status: 400 }
      );
    }

    // Find the record
    const record = await db.tareaArchivo.findUnique({
      where: { id }
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'El registro del archivo no existe.' },
        { status: 404 }
      );
    }

    // Delete from db
    await db.tareaArchivo.delete({
      where: { id }
    });

    // Delete physical file
    const filePath = path.join(process.cwd(), record.path);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn('No se pudo borrar el archivo físico (puede que ya no exista):', err);
    }

    // Check if this was the active certificate in the Tarea
    const tarea = await db.tarea.findUnique({
      where: { id: record.tareaId }
    });

    if (tarea && tarea.certificadoPath === record.path) {
      // Find the next most recent archive file
      const nextRecent = await db.tareaArchivo.findFirst({
        where: { tareaId: record.tareaId },
        orderBy: { createdAt: 'desc' }
      });

      if (nextRecent) {
        await db.tarea.update({
          where: { id: record.tareaId },
          data: {
            certificadoNombre: nextRecent.originalName,
            certificadoPath: nextRecent.path
          }
        });
      } else {
        await db.tarea.update({
          where: { id: record.tareaId },
          data: {
            certificadoNombre: null,
            certificadoPath: null
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting task certificate file:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
