// src/lib/storage.ts
// Servicio centralizado para el almacenamiento seguro y organizado de archivos por sede y módulo

import fs from 'fs/promises';
import path from 'path';
import { getSedeStorageFolder } from '@/config/sedes';

export type StorageModule = 'certificados' | 'licencias' | 'electrico' | 'repuestos';

export interface SaveFileInput {
  file: File;
  module: StorageModule;
  sede?: string | null;
  entityId: string;
  subType?: string; // e.g. "certificado", "protocolo", "factura", etc.
}

export interface SaveFileOutput {
  originalName: string;
  storedFileName: string;
  relativePath: string;
  absolutePath: string;
  size: number;
}

/**
 * Guarda un archivo en el sistema de almacenamiento segmentado por sede.
 * 
 * Estructura de carpetas:
 * - Certificados/Tareas: uploads/{sede}/certificados/{entityId}-cert-{timestamp}.ext
 * - Licencias: uploads/{sede}/licencias/{entityId}-{subType}-{timestamp}.ext
 * - Eléctrico: uploads/{sede}/electrico/{entityId}-{timestamp}.ext
 * - Repuestos: uploads/repuestos/{timestamp}-{fileName}.ext (común/transversal)
 */
export async function saveStorageFile({
  file,
  module,
  sede,
  entityId,
  subType
}: SaveFileInput): Promise<SaveFileOutput> {
  const originalName = file.name;
  const extension = path.extname(originalName);
  const cleanOriginal = path.basename(originalName, extension).replace(/[^a-zA-Z0-9_-]/g, '_');

  let targetDir: string;
  let storedFileName: string;
  let relativePath: string;

  if (module === 'repuestos') {
    targetDir = path.join(process.cwd(), 'uploads', 'repuestos');
    storedFileName = `${Date.now()}-${cleanOriginal}${extension}`;
    relativePath = `uploads/repuestos/${storedFileName}`;
  } else {
    const sedeFolder = getSedeStorageFolder(sede);
    targetDir = path.join(process.cwd(), 'uploads', sedeFolder, module);
    const prefix = subType ? `${entityId}-${subType}` : entityId;
    storedFileName = `${prefix}-${Date.now()}${extension}`;
    relativePath = `uploads/${sedeFolder}/${module}/${storedFileName}`;
  }

  // Asegura la existencia recursiva de la carpeta destino
  await fs.mkdir(targetDir, { recursive: true });

  const absolutePath = path.join(targetDir, storedFileName);
  const bytes = await file.arrayBuffer();
  await fs.writeFile(absolutePath, Buffer.from(bytes));

  return {
    originalName,
    storedFileName,
    relativePath,
    absolutePath,
    size: file.size
  };
}

/**
 * Elimina de manera segura un archivo almacenado, protegiendo contra Directory Traversal.
 */
export async function deleteStorageFile(relativePath: string): Promise<boolean> {
  if (!relativePath) return false;
  try {
    const normalizedRelative = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    const absolutePath = path.join(process.cwd(), normalizedRelative);
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    console.warn(`[storage] No se pudo eliminar el archivo en "${relativePath}":`, error);
    return false;
  }
}
