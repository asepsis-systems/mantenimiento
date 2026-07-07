import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePathParam = searchParams.get('path');

    if (!filePathParam) {
      return NextResponse.json(
        { success: false, error: 'Falta especificar el parámetro path.' },
        { status: 400 }
      );
    }

    // Prevents path traversal by strictly extracting the file name
    const fileName = path.basename(filePathParam);
    const uploadDir = path.join(process.cwd(), 'uploads', 'repuestos');
    const fullPath = path.join(uploadDir, fileName);

    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json(
        { success: false, error: 'El archivo físico no se encuentra en el servidor.' },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.readFile(fullPath);
    const extension = path.extname(fileName).toLowerCase();

    // Map common extensions to their MIME types
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };

    const contentType = mimeTypes[extension] || 'application/octet-stream';

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving spare part photo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
