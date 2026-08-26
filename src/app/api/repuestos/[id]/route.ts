import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      name, 
      code, 
      stock, 
      minStock, 
      price, 
      location, 
      isMatachana,
      metodo,
      metodo2,
      repuesto,
      codigoMarca,
      marca1,
      comentario,
      fotoNombre,
      fotoPath,
      almacenado,
      seccion,
      correlativo,
      descripcion,
      codigoMatachana,
      kit1,
      kit2,
      usados
    } = body;

    const finalCode = isMatachana ? codigoMatachana : code;
    const finalName = isMatachana ? descripcion : name;

    if (!finalName || !finalCode) {
      return NextResponse.json({ success: false, error: 'El nombre/descripción y el código son obligatorios.' }, { status: 400 });
    }

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    const scriptToken = process.env.GOOGLE_SCRIPT_TOKEN || '';

    if (scriptUrl && scriptUrl.trim() !== '') {
      try {
        const payload = isMatachana
          ? {
              metodo: metodo || '',
              metodo2: metodo2 || '',
              correlativo: correlativo || '',
              descripcion: descripcion || '',
              codigoMatachana: codigoMatachana || '',
              kit1: kit1 || '',
              kit2: kit2 || '',
              stock: Number(stock) || 0,
              usados: Number(usados) || 0,
              location: location || ''
            }
          : {
              metodo: metodo || '',
              code: finalCode,
              name: finalName,
              repuesto: repuesto || '',
              codigoMarca: codigoMarca || '',
              marca1: marca1 || '',
              comentario: comentario || '',
              stock: Number(stock) || 0,
              fotoPath: fotoPath || '',
              almacenado: almacenado || '',
              seccion: seccion || ''
            };

        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: scriptToken,
            action: 'update',
            sheet: isMatachana ? 'Rpts. Matchana' : 'Inventario',
            payload
          })
        });

        if (!response.ok) {
          const text = await response.text();
          return NextResponse.json({ success: false, error: `Error en Google Sheets API: ${response.statusText}. Detalle: ${text}` }, { status: 400 });
        }

        const resData = await response.json();
        if (!resData.success) {
          return NextResponse.json({ success: false, error: resData.error || 'Error al actualizar en Google Sheets.' }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Error de red al conectar con Google Sheets: ${err.message}` }, { status: 500 });
      }

      // Upsert/mirror in the local DB
      const sparePart = await db.sparePart.upsert({
        where: { code: finalCode },
        update: {
          name: finalName,
          code: finalCode,
          stock: Number(stock) || 0,
          minStock: Number(minStock) || 0,
          price: price ? Number(price) : null,
          location: location || '',
          isMatachana: Boolean(isMatachana),
          metodo: metodo || '',
          metodo2: metodo2 || '',
          repuesto: repuesto || '',
          codigoMarca: codigoMarca || '',
          marca1: marca1 || '',
          comentario: comentario || '',
          fotoNombre: fotoNombre || '',
          fotoPath: fotoPath || '',
          almacenado: almacenado || '',
          seccion: seccion || '',
          correlativo: correlativo || '',
          descripcion: descripcion || '',
          codigoMatachana: codigoMatachana || '',
          kit1: kit1 || '',
          kit2: kit2 || '',
          usados: Number(usados) || 0
        },
        create: {
          name: finalName,
          code: finalCode,
          stock: Number(stock) || 0,
          minStock: Number(minStock) || 0,
          price: price ? Number(price) : null,
          location: location || '',
          isMatachana: Boolean(isMatachana),
          metodo: metodo || '',
          metodo2: metodo2 || '',
          repuesto: repuesto || '',
          codigoMarca: codigoMarca || '',
          marca1: marca1 || '',
          comentario: comentario || '',
          fotoNombre: fotoNombre || '',
          fotoPath: fotoPath || '',
          almacenado: almacenado || '',
          seccion: seccion || '',
          correlativo: correlativo || '',
          descripcion: descripcion || '',
          codigoMatachana: codigoMatachana || '',
          kit1: kit1 || '',
          kit2: kit2 || '',
          usados: Number(usados) || 0
        }
      });

      return NextResponse.json({ success: true, sparePart });
    }

    // Default local behavior (for local-only)
    const existing = await db.sparePart.findFirst({
      where: { 
        code: finalCode,
        NOT: { id }
      }
    });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Ya existe otro repuesto con ese código.' }, { status: 400 });
    }

    const sparePart = await db.sparePart.update({
      where: { id },
      data: {
        name: finalName,
        code: finalCode,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        price: price ? Number(price) : null,
        location: location || '',
        isMatachana: Boolean(isMatachana),
        metodo: metodo || '',
        metodo2: metodo2 || '',
        repuesto: repuesto || '',
        codigoMarca: codigoMarca || '',
        marca1: marca1 || '',
        comentario: comentario || '',
        fotoNombre: fotoNombre || '',
        fotoPath: fotoPath || '',
        almacenado: almacenado || '',
        seccion: seccion || '',
        correlativo: correlativo || '',
        descripcion: descripcion || '',
        codigoMatachana: codigoMatachana || '',
        kit1: kit1 || '',
        kit2: kit2 || '',
        usados: Number(usados) || 0
      }
    });

    return NextResponse.json({ success: true, sparePart });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    const scriptToken = process.env.GOOGLE_SCRIPT_TOKEN || '';

    // Find the part to know if it's Matachana or general
    const part = await db.sparePart.findFirst({
      where: {
        OR: [
          { id },
          { code: id },
          { codigoMatachana: id }
        ]
      }
    });

    if (part && scriptUrl && scriptUrl.trim() !== '') {
      try {
        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: scriptToken,
            action: 'delete',
            sheet: part.isMatachana ? 'Rpts. Matchana' : 'Inventario',
            payload: {
              code: part.isMatachana ? part.codigoMatachana : part.code
            }
          })
        });

        if (!response.ok) {
          const text = await response.text();
          return NextResponse.json({ success: false, error: `Error en Google Sheets API: ${response.statusText}. Detalle: ${text}` }, { status: 400 });
        }

        const resData = await response.json();
        if (!resData.success) {
          return NextResponse.json({ success: false, error: resData.error || 'Error al eliminar en Google Sheets.' }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Error de red al conectar con Google Sheets: ${err.message}` }, { status: 500 });
      }
    }

    // Always perform local delete (if record exists)
    if (part) {
      await db.sparePart.delete({
        where: { id: part.id }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

