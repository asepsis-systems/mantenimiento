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
        { success: false, error: 'Falta especificar el ID de la licencia.' },
        { status: 400 }
      );
    }

    const license = await db.license.findUnique({
      where: { id }
    });

    if (!license || !license.archivoPath) {
      return NextResponse.json(
        { success: false, error: 'Licencia o archivo no encontrado.' },
        { status: 404 }
      );
    }

    const filePath = path.join(process.cwd(), license.archivoPath);

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { success: false, error: 'El archivo físico no existe en el almacenamiento local.' },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.readFile(filePath);
    const originalName = license.archivoNombre || 'archivo';
    const extension = path.extname(originalName).toLowerCase();

    // Map common extensions to their MIME types
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    console.error('Error serving license file:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
