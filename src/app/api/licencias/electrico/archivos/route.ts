import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// 1. POST: Upload a file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const parentIdParam = formData.get('parentId') as string | null;
    const usuarioSubida = formData.get('usuarioSubida') as string | null;

    const parentId = parentIdParam === 'null' || !parentIdParam ? null : parentIdParam;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se ha proporcionado ningún archivo.' }, { status: 400 });
    }

    // Max 100MB limit
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'El archivo excede el límite máximo de 100MB.' }, { status: 400 });
    }

    const fileId = crypto.randomUUID();
    const originalName = file.name;
    const extension = path.extname(originalName).toLowerCase();

    // Set up storage directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'electrico');
    await fs.mkdir(uploadDir, { recursive: true });

    // Collison-proof file name on disk
    const storedFileName = `${fileId}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storedFilePath = path.join(uploadDir, storedFileName);

    // Save physical file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(storedFilePath, buffer);

    const relativePath = `uploads/electrico/${storedFileName}`;

    // Check if file name already exists in same level (just to prevent confusion, though disk is collision proof)
    const existing = await db.electricFile.findFirst({
      where: {
        nombre: originalName,
        parentId
      }
    });

    // Save metadata in database
    const electricFile = await db.electricFile.create({
      data: {
        id: fileId,
        nombre: existing ? `${path.basename(originalName, extension)} (${Date.now()})${extension}` : originalName,
        parentId,
        ruta: relativePath,
        extension: extension || '.bin',
        tamano: file.size,
        usuarioSubida: usuarioSubida || 'Sistema'
      }
    });

    return NextResponse.json({ success: true, file: electricFile });
  } catch (error: any) {
    console.error('Error in Electric files POST (upload):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. GET: Download/Preview a file by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Se requiere el ID del archivo.' }, { status: 400 });
    }

    const fileRecord = await db.electricFile.findUnique({ where: { id } });
    if (!fileRecord) {
      return NextResponse.json({ success: false, error: 'Archivo no encontrado en base de datos.' }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), fileRecord.ruta);
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ success: false, error: 'El archivo físico no existe en el disco.' }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);
    const ext = fileRecord.extension.toLowerCase();

    // Mime types
    const mime: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.txt': 'text/plain'
    };

    const contentType = mime[ext] || 'application/octet-stream';
    const isViewable = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.txt'].includes(ext);
    const disposition = isViewable ? 'inline' : 'attachment';

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(fileRecord.nombre)}"`
      }
    });
  } catch (error: any) {
    console.error('Error in Electric files GET (view):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 3. PUT: Rename a file
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nuevoNombre } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Se requiere el ID del archivo.' }, { status: 400 });
    }
    if (!nuevoNombre || !nuevoNombre.trim()) {
      return NextResponse.json({ success: false, error: 'El nuevo nombre es obligatorio.' }, { status: 400 });
    }

    const fileRecord = await db.electricFile.findUnique({ where: { id } });
    if (!fileRecord) {
      return NextResponse.json({ success: false, error: 'Archivo no encontrado.' }, { status: 404 });
    }

    // Ensure extension remains unchanged if the user didn't specify one
    let targetName = nuevoNombre.trim();
    const currentExt = fileRecord.extension;
    if (currentExt && !targetName.toLowerCase().endsWith(currentExt.toLowerCase())) {
      targetName = `${targetName}${currentExt}`;
    }

    // Check for duplicates
    const existing = await db.electricFile.findFirst({
      where: {
        id: { not: id },
        nombre: targetName,
        parentId: fileRecord.parentId
      }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Ya existe un archivo con ese nombre en esta carpeta.' }, { status: 400 });
    }

    const updatedFile = await db.electricFile.update({
      where: { id },
      data: { nombre: targetName }
    });

    return NextResponse.json({ success: true, file: updatedFile });
  } catch (error: any) {
    console.error('Error in Electric files PUT (rename):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 4. DELETE: Delete a file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Se requiere el ID del archivo.' }, { status: 400 });
    }

    const fileRecord = await db.electricFile.findUnique({ where: { id } });
    if (!fileRecord) {
      return NextResponse.json({ success: false, error: 'Archivo no encontrado.' }, { status: 404 });
    }

    // Delete physical file
    const filePath = path.join(process.cwd(), fileRecord.ruta);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error(`Error deleting physical file at ${fileRecord.ruta}:`, err);
    }

    // Delete database record
    await db.electricFile.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in Electric files DELETE:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
