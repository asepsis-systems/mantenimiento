import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const carpetaId = formData.get('carpetaId') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se ha proporcionado ningún archivo.' },
        { status: 400 }
      );
    }

    const licenseIdFromForm = formData.get('id') as string | null;
    const licenseId = licenseIdFromForm || crypto.randomUUID();
    const originalName = file.name;
    const extension = path.extname(originalName);
    
    // Set up local storage path inside MTTO project
    const uploadDir = path.join(process.cwd(), 'uploads', 'licencias');
    
    // Ensure the directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Unique file name to avoid collisions
    const fileName = `${licenseId}${extension}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Write buffer to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    let license;

    if (licenseIdFromForm) {
      // Update existing license
      license = await db.license.update({
        where: { id: licenseIdFromForm },
        data: {
          archivoNombre: originalName,
          archivoPath: `uploads/licencias/${fileName}`
        }
      });
    } else {
      // Format current date as default DD/MM/YYYY
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const todayStr = `${dd}/${mm}/${yyyy}`;

      // Create the license record with default fields and file info
      license = await db.license.create({
        data: {
          id: licenseId,
          name: originalName,
          entity: 'POR ESPECIFICAR',
          code: 'S/N',
          issueDate: todayStr,
          expiryDate: todayStr,
          status: 'EN_TRAMITE',
          archivoNombre: originalName,
          archivoPath: `uploads/licencias/${fileName}`,
          carpetaId: carpetaId && carpetaId !== 'null' && carpetaId !== '' ? carpetaId : null
        }
      });
    }

    return NextResponse.json({ success: true, license });
  } catch (error: any) {
    console.error('Error in licenses upload API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
