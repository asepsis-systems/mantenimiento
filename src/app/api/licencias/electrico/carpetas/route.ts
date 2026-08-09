import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to build breadcrumb path recursively upwards
async function getFolderPath(folderId: string | null): Promise<Array<{ id: string; nombre: string }>> {
  if (!folderId) return [];
  const path: Array<{ id: string; nombre: string }> = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const folder: { id: string; nombre: string; parentId: string | null } | null = await db.electricFolder.findUnique({
      where: { id: currentId },
      select: { id: true, nombre: true, parentId: true }
    });
    if (!folder) break;
    path.unshift({ id: folder.id, nombre: folder.nombre });
    currentId = folder.parentId;
  }
  return path;
}

// 1. GET: List subfolders and files in a folder, and return breadcrumb path
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentIdParam = searchParams.get('parentId');
    const parentId = parentIdParam === 'null' || !parentIdParam ? null : parentIdParam;

    // Get subfolders
    const folders = await db.electricFolder.findMany({
      where: { parentId },
      orderBy: { nombre: 'asc' }
    });

    // Get files
    const files = await db.electricFile.findMany({
      where: { parentId },
      orderBy: { nombre: 'asc' }
    });

    // Get current breadcrumb path
    const path = await getFolderPath(parentId);

    return NextResponse.json({
      success: true,
      folders,
      files,
      path
    });
  } catch (error: any) {
    console.error('Error in Electric folders GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. POST: Create a folder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, parentId, usuarioCreacion } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre de la carpeta es obligatorio.' }, { status: 400 });
    }

    const cleanParentId = parentId === 'null' || !parentId ? null : parentId;

    // Check if a folder with the same name already exists in the same level
    const existing = await db.electricFolder.findFirst({
      where: {
        nombre: nombre.trim(),
        parentId: cleanParentId
      }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Ya existe una carpeta con ese nombre en este nivel.' }, { status: 400 });
    }

    const folder = await db.electricFolder.create({
      data: {
        nombre: nombre.trim(),
        parentId: cleanParentId,
        usuarioCreacion: usuarioCreacion || 'Sistema'
      }
    });

    return NextResponse.json({ success: true, folder });
  } catch (error: any) {
    console.error('Error in Electric folders POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 3. PUT: Rename a folder
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nuevoNombre } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Se requiere el ID de la carpeta.' }, { status: 400 });
    }
    if (!nuevoNombre || !nuevoNombre.trim()) {
      return NextResponse.json({ success: false, error: 'El nuevo nombre es obligatorio.' }, { status: 400 });
    }

    // Get current folder to find parent
    const currentFolder = await db.electricFolder.findUnique({ where: { id } });
    if (!currentFolder) {
      return NextResponse.json({ success: false, error: 'Carpeta no encontrada.' }, { status: 404 });
    }

    // Check for duplicates in same parent
    const existing = await db.electricFolder.findFirst({
      where: {
        id: { not: id },
        nombre: nuevoNombre.trim(),
        parentId: currentFolder.parentId
      }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Ya existe otra carpeta con ese nombre en este nivel.' }, { status: 400 });
    }

    const updatedFolder = await db.electricFolder.update({
      where: { id },
      data: { nombre: nuevoNombre.trim() }
    });

    return NextResponse.json({ success: true, folder: updatedFolder });
  } catch (error: any) {
    console.error('Error in Electric folders PUT:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 4. DELETE: Delete a folder (Prisma Cascade deletes all subfolders and files in DB)
// Note: We also need to remove physical files from disk!
import fs from 'fs/promises';
import path from 'path';

// Recursively find and delete physical files on disk for a folder
async function deletePhysicalFilesForFolder(folderId: string) {
  // Find all subfiles directly in this folder
  const files = await db.electricFile.findMany({ where: { parentId: folderId } });
  for (const file of files) {
    try {
      const physicalPath = path.join(process.cwd(), file.ruta);
      await fs.unlink(physicalPath);
    } catch (err) {
      console.error(`Error deleting physical file ${file.ruta}:`, err);
    }
  }

  // Find all subfolders and recurse
  const subfolders = await db.electricFolder.findMany({ where: { parentId: folderId } });
  for (const sub of subfolders) {
    await deletePhysicalFilesForFolder(sub.id);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Se requiere el ID de la carpeta.' }, { status: 400 });
    }

    const folder = await db.electricFolder.findUnique({ where: { id } });
    if (!folder) {
      return NextResponse.json({ success: false, error: 'Carpeta no encontrada.' }, { status: 404 });
    }

    // 1. Delete physical files from disk recursively
    await deletePhysicalFilesForFolder(id);

    // 2. Delete from DB (Prisma CASCADE handles subfolders and files in DB automatically)
    await db.electricFolder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in Electric folders DELETE:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
