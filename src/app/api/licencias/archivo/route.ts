import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const file = searchParams.get('file');
    const list = searchParams.get('list');
    const type = searchParams.get('type');

    const uploadDir = path.join(process.cwd(), 'uploads', 'licencias');

    // 1) Serve a physical file by filename
    if (file) {
      const safeName = path.basename(file);
      const filePath = path.join(uploadDir, safeName);
      try {
        await fs.access(filePath);
      } catch {
        return NextResponse.json({ success: false, error: 'Archivo no encontrado.' }, { status: 404 });
      }
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(safeName).toLowerCase();
      const mime: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif'
      };
      const contentType = mime[ext] || 'application/octet-stream';
      const isViewable = ['.pdf', '.jpg', '.jpeg', '.png', '.gif'].includes(ext);
      const disposition = isViewable ? 'inline' : 'attachment';
      return new Response(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `${disposition}; filename="${encodeURIComponent(safeName)}"`
        }
      });
    }

    // 2) List files for a given license id
    if (id && list === 'true') {
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        const names = await fs.readdir(uploadDir);
        const matched: any[] = [];
        for (const n of names) {
          if (n.includes(id)) {
            const stat = await fs.stat(path.join(uploadDir, n));
            matched.push({ fileName: n, size: stat.size, mtime: stat.mtime });
          }
        }
        matched.sort((a, b) => (b.mtime as Date).getTime() - (a.mtime as Date).getTime());
        return NextResponse.json({ success: true, files: matched });
      } catch (err: any) {
        console.error('Error reading licencias upload dir:', err);
        return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
      }
    }

    // 3) Serve a document stored as a field on the license record (by id + type)
    if (id && type) {
      const license = await db.license.findUnique({ where: { id } });
      if (!license) return NextResponse.json({ success: false, error: 'Licencia no encontrada.' }, { status: 404 });

      const fieldMap: Record<string, { nameField: string; pathField: string }> = {
        certificado: { nameField: 'archivoNombreCertificado', pathField: 'archivoPathCertificado' },
        protocolo: { nameField: 'archivoNombreProtocolo', pathField: 'archivoPathProtocolo' },
        informeTecnico: { nameField: 'archivoNombreInformeTecnico', pathField: 'archivoPathInformeTecnico' },
        factura: { nameField: 'archivoNombreFactura', pathField: 'archivoPathFactura' },
        presupuesto: { nameField: 'archivoNombrePresupuesto', pathField: 'archivoPathPresupuesto' },
        checklist: { nameField: 'archivoNombreCheckList', pathField: 'archivoPathCheckList' }
      };

      const docFields = fieldMap[type];
      if (!docFields) return NextResponse.json({ success: false, error: 'Tipo de documento no válido.' }, { status: 400 });

      const originalName = (license as any)[docFields.nameField] as string | undefined;
      const relativePath = (license as any)[docFields.pathField] as string | undefined;
      if (!originalName || !relativePath) return NextResponse.json({ success: false, error: 'Documento no encontrado para este tipo.' }, { status: 404 });

      const filePath = path.join(process.cwd(), relativePath);
      try { await fs.access(filePath); } catch { return NextResponse.json({ success: false, error: 'El archivo físico no existe.' }, { status: 404 }); }

      const fileBuffer = await fs.readFile(filePath);
      const extension = path.extname(originalName).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
      const contentType = mimeTypes[extension] || 'application/octet-stream';
      const isViewable = ['.pdf', '.jpg', '.jpeg', '.png', '.gif'].includes(extension);
      const disposition = isViewable ? 'inline' : 'attachment';
      return new Response(fileBuffer, { headers: { 'Content-Type': contentType, 'Content-Disposition': `${disposition}; filename="${encodeURIComponent(originalName)}"` } });
    }

    return NextResponse.json({ success: false, error: 'Parámetros insuficientes. Use ?file= or ?id=...&list=true or ?id=...&type=...' }, { status: 400 });
  } catch (error: any) {
    console.error('Licencias archivo GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id || !type) {
      return NextResponse.json({ success: false, error: 'Se requiere id de la licencia y tipo de documento.' }, { status: 400 });
    }

    const license = await db.license.findUnique({ where: { id } });
    if (!license) {
      return NextResponse.json({ success: false, error: 'Licencia no encontrada.' }, { status: 404 });
    }

    const fieldMap: Record<string, { nameField: string; pathField: string }> = {
      certificado: { nameField: 'archivoNombreCertificado', pathField: 'archivoPathCertificado' },
      protocolo: { nameField: 'archivoNombreProtocolo', pathField: 'archivoPathProtocolo' },
      informeTecnico: { nameField: 'archivoNombreInformeTecnico', pathField: 'archivoPathInformeTecnico' },
      factura: { nameField: 'archivoNombreFactura', pathField: 'archivoPathFactura' },
      presupuesto: { nameField: 'archivoNombrePresupuesto', pathField: 'archivoPathPresupuesto' },
      checklist: { nameField: 'archivoNombreCheckList', pathField: 'archivoPathCheckList' }
    };

    const docFields = fieldMap[type];
    if (!docFields) {
      return NextResponse.json({ success: false, error: 'Tipo de documento no válido.' }, { status: 400 });
    }

    const relativePath = (license as any)[docFields.pathField] as string | undefined;

    // 1) Delete physical file if exists
    if (relativePath) {
      const filePath = path.join(process.cwd(), relativePath);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error('Error deleting physical file:', err);
      }
    }

    // 2) Update database fields
    const updateData: any = {};
    updateData[docFields.nameField] = null;
    updateData[docFields.pathField] = null;

    await db.license.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
