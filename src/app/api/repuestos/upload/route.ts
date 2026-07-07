import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se ha proporcionado ninguna imagen.' },
        { status: 400 }
      );
    }

    const originalName = file.name;
    const extension = path.extname(originalName).toLowerCase();
    
    // Validate image format
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { success: false, error: 'Formato de imagen no permitido. Solo se aceptan JPG, PNG, WEBP, GIF o SVG.' },
        { status: 400 }
      );
    }

    // Generate folder
    const uploadDir = path.join(process.cwd(), 'uploads', 'repuestos');
    await fs.mkdir(uploadDir, { recursive: true });

    // Unique name
    const fileId = crypto.randomUUID();
    const fileName = `${fileId}${extension}`;
    const filePath = path.join(uploadDir, fileName);

    // Save buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      fotoNombre: originalName,
      fotoPath: `uploads/repuestos/${fileName}`
    });
  } catch (error: any) {
    console.error('Error in repuestos image upload API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
