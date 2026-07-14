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
    const licenseIdFromForm = formData.get('id') as string | null;
    const docType = (formData.get('docType') as string | null) || 'certificado';
    const expiryDate = (formData.get('expiryDate') as string | null)?.trim() || null;
    const entity = (formData.get('entity') as string | null)?.trim() || null;
    const code = (formData.get('code') as string | null)?.trim() || null;
    const issueDate = (formData.get('issueDate') as string | null)?.trim() || null;
    const status = (formData.get('status') as string | null)?.trim() || null;

    if (!file && !licenseIdFromForm) {
      return NextResponse.json(
        { success: false, error: 'No se ha proporcionado ningún archivo.' },
        { status: 400 }
      );
    }

    const allowedDocTypes = ['certificado', 'protocolo', 'informeTecnico', 'factura', 'presupuesto', 'checklist'];
    if (!allowedDocTypes.includes(docType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de documento no válido.' },
        { status: 400 }
      );
    }

    const licenseId = licenseIdFromForm || crypto.randomUUID();
    
    // Set up local storage path inside MTTO project
    const uploadDir = path.join(process.cwd(), 'uploads', 'licencias');
    
    // Ensure the directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    let fileName = '';
    let filePath = '';
    let originalName = '';

    if (file) {
      originalName = file.name;
      const extension = path.extname(originalName);
      fileName = `${licenseId}-${docType}${extension}`;
      filePath = path.join(uploadDir, fileName);
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(filePath, buffer);
    }

    const fieldMap: Record<string, { nameField: string; pathField: string; expiryField: string }> = {
      certificado: { nameField: 'archivoNombreCertificado', pathField: 'archivoPathCertificado', expiryField: 'vencimientoCertificado' },
      protocolo: { nameField: 'archivoNombreProtocolo', pathField: 'archivoPathProtocolo', expiryField: 'vencimientoProtocolo' },
      informeTecnico: { nameField: 'archivoNombreInformeTecnico', pathField: 'archivoPathInformeTecnico', expiryField: 'vencimientoInformeTecnico' },
      factura: { nameField: 'archivoNombreFactura', pathField: 'archivoPathFactura', expiryField: 'vencimientoFactura' },
      presupuesto: { nameField: 'archivoNombrePresupuesto', pathField: 'archivoPathPresupuesto', expiryField: 'vencimientoPresupuesto' },
      checklist: { nameField: 'archivoNombreCheckList', pathField: 'archivoPathCheckList', expiryField: 'vencimientoCheckList' }
    };

    const selectedFields = fieldMap[docType];
    const fileData = {} as any;
    
    if (file) {
      fileData[selectedFields.nameField] = originalName;
      fileData[selectedFields.pathField] = `uploads/licencias/${fileName}`;
    }

    if (expiryDate) {
      fileData[selectedFields.expiryField] = expiryDate;
    }

    let license;

    if (licenseIdFromForm) {
      // Update existing license
      const updateData: any = { ...fileData };
      if (entity !== null) updateData.entity = entity;
      if (code !== null) updateData.code = code;
      if (issueDate !== null) updateData.issueDate = issueDate;
      if (status !== null) updateData.status = status;

      license = await db.license.update({
        where: { id: licenseIdFromForm },
        data: updateData
      });
    } else {
      // Create new (only if file was provided, otherwise it would have errored above)
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const todayStr = `${dd}/${mm}/${yyyy}`;

      license = await db.license.create({
        data: {
          id: licenseId,
          name: originalName || 'Documento sin nombre',
          entity: entity || 'POR ESPECIFICAR',
          code: code || 'S/N',
          issueDate: issueDate || todayStr,
          expiryDate: expiryDate || todayStr,
          status: status || 'EN_TRAMITE',
          carpetaId: carpetaId && carpetaId !== 'null' && carpetaId !== '' ? carpetaId : null,
          ...fileData
        }
      });
    }

    return NextResponse.json({ success: true, license });
  } catch (error: any) {
    console.error('Error in licenses upload API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
