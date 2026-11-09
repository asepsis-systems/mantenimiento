import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

async function findPhysicalFile(fileParam: string): Promise<string | null> {
  const directPath = path.join(process.cwd(), fileParam);
  try {
    await fs.access(directPath);
    return directPath;
  } catch {}

  const safeName = path.basename(fileParam);
  const candidates = [
    path.join(process.cwd(), 'uploads', 'licencias', safeName),
    path.join(process.cwd(), 'uploads', 'lima', 'licencias', safeName),
    path.join(process.cwd(), 'uploads', 'trujillo', 'licencias', safeName),
    path.join(process.cwd(), 'uploads', 'cochera', 'licencias', safeName),
    path.join(process.cwd(), 'uploads', 'general', 'licencias', safeName),
  ];

  for (const c of candidates) {
    try {
      await fs.access(c);
      return c;
    } catch {}
  }

  // Recursive search under uploads/ if still not found
  try {
    const uploadsRoot = path.join(process.cwd(), 'uploads');
    const findInDir = async (dir: string): Promise<string | null> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const res = await findInDir(full);
          if (res) return res;
        } else if (entry.name === safeName) {
          return full;
        }
      }
      return null;
    };
    return await findInDir(uploadsRoot);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const file = searchParams.get('file');
    const list = searchParams.get('list');
    const type = searchParams.get('type');

    // 1) Serve a physical file by filename or relative path across any sede folder
    if (file) {
      const filePath = await findPhysicalFile(file);
      if (!filePath) {
        return NextResponse.json({ success: false, error: 'Archivo no encontrado.' }, { status: 404 });
      }

      const fileBuffer = await fs.readFile(filePath);
      const safeName = path.basename(filePath);
      const ext = path.extname(safeName).toLowerCase();
      const mime: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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

    // 2) List files for a given license id (from database metadata and sede directories)
    if (id && list === 'true') {
      try {
        const matched: any[] = [];
        const seenNames = new Set<string>();

        // From DB record
        const license = await db.license.findUnique({ where: { id } });
        const docTypes = [
          { type: 'certificado', name: 'archivoNombreCertificado', path: 'archivoPathCertificado', label: 'Certificado de Operatividad' },
          { type: 'protocolo', name: 'archivoNombreProtocolo', path: 'archivoPathProtocolo', label: 'Protocolo de Prueba' },
          { type: 'informeTecnico', name: 'archivoNombreInformeTecnico', path: 'archivoPathInformeTecnico', label: 'Informe Técnico' },
          { type: 'factura', name: 'archivoNombreFactura', path: 'archivoPathFactura', label: 'Factura / Comprobante' },
          { type: 'presupuesto', name: 'archivoNombrePresupuesto', path: 'archivoPathPresupuesto', label: 'Presupuesto' },
          { type: 'checklist', name: 'archivoNombreCheckList', path: 'archivoPathCheckList', label: 'Checklist de Inspección' }
        ];

        if (license) {
          for (const d of docTypes) {
            const originalName = (license as any)[d.name];
            const relativePath = (license as any)[d.path];
            if (originalName && relativePath) {
              const base = path.basename(relativePath);
              seenNames.add(base);
              let size = 0;
              let mtime = license.updatedAt || new Date();
              try {
                const stat = await fs.stat(path.join(process.cwd(), relativePath));
                size = stat.size;
                mtime = stat.mtime;
              } catch {}

              matched.push({
                fileName: base,
                originalName: originalName,
                docType: d.type,
                docTypeName: d.label,
                relativePath: relativePath,
                size,
                mtime
              });
            }
          }
        }

        // From physical folders
        const dirsToScan = [
          path.join(process.cwd(), 'uploads', 'licencias'),
          path.join(process.cwd(), 'uploads', 'lima', 'licencias'),
          path.join(process.cwd(), 'uploads', 'trujillo', 'licencias'),
          path.join(process.cwd(), 'uploads', 'cochera', 'licencias'),
          path.join(process.cwd(), 'uploads', 'general', 'licencias'),
        ];

        for (const dir of dirsToScan) {
          try {
            await fs.mkdir(dir, { recursive: true });
            const files = await fs.readdir(dir);
            for (const f of files) {
              if (f.includes(id) && !seenNames.has(f)) {
                seenNames.add(f);
                const stat = await fs.stat(path.join(dir, f));
                let docTypeName = 'Documento Adjunto';
                let docType = 'documento';
                const lower = f.toLowerCase();
                if (lower.includes('informetecnico')) { docTypeName = 'Informe Técnico'; docType = 'informeTecnico'; }
                else if (lower.includes('certificado')) { docTypeName = 'Certificado de Operatividad'; docType = 'certificado'; }
                else if (lower.includes('protocolo')) { docTypeName = 'Protocolo de Prueba'; docType = 'protocolo'; }
                else if (lower.includes('factura')) { docTypeName = 'Factura / Comprobante'; docType = 'factura'; }
                else if (lower.includes('presupuesto')) { docTypeName = 'Presupuesto'; docType = 'presupuesto'; }
                else if (lower.includes('checklist')) { docTypeName = 'Checklist'; docType = 'checklist'; }

                matched.push({
                  fileName: f,
                  originalName: f,
                  docType,
                  docTypeName,
                  size: stat.size,
                  mtime: stat.mtime
                });
              }
            }
          } catch {}
        }

        matched.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());
        return NextResponse.json({ success: true, files: matched });
      } catch (err: any) {
        console.error('Error reading licencias files:', err);
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

      const filePath = await findPhysicalFile(relativePath);
      if (!filePath) return NextResponse.json({ success: false, error: 'El archivo físico no existe.' }, { status: 404 });

      const fileBuffer = await fs.readFile(filePath);

      let extension = path.extname(originalName).toLowerCase();
      const realExt = path.extname(filePath).toLowerCase();
      if (!extension && realExt) {
        extension = realExt;
      }
      if (!extension) {
        if (fileBuffer.length > 4 && fileBuffer[0] === 0x25 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x44 && fileBuffer[3] === 0x46) {
          extension = '.pdf';
        } else {
          extension = '.pdf';
        }
      }

      const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };

      const contentType = mimeTypes[extension] || 'application/pdf';
      const isViewable = ['.pdf', '.jpg', '.jpeg', '.png', '.gif'].includes(extension);
      const disposition = isViewable ? 'inline' : 'attachment';

      let downloadName = originalName.trim();
      if (!downloadName.toLowerCase().endsWith(extension)) {
        downloadName = `${downloadName}${extension}`;
      }

      return new Response(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `${disposition}; filename="${encodeURIComponent(downloadName)}"`
        }
      });
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
      const filePath = await findPhysicalFile(relativePath);
      if (filePath) {
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.error('Error deleting physical file:', err);
        }
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
