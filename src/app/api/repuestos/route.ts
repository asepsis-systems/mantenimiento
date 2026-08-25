import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    const scriptToken = process.env.GOOGLE_SCRIPT_TOKEN || '';

    // Always fetch Matachana parts from DB
    const dbMatachanaParts = await db.sparePart.findMany({
      where: { isMatachana: true },
      orderBy: { name: 'asc' }
    });

    let generalParts: any[] = [];

    if (scriptUrl && scriptUrl.trim() !== '') {
      try {
        const response = await fetch(`${scriptUrl}?token=${encodeURIComponent(scriptToken)}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 0 } // Ensure fresh data on every fetch
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success && Array.isArray(resData.data)) {
            generalParts = resData.data.map((item: any) => ({
              id: item.code, // Use code as ID for frontend consistency
              name: item.name || '',
              code: item.code || '',
              stock: Number(item.stock) || 0,
              minStock: 0,
              price: null,
              location: item.almacenado || '',
              isMatachana: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              metodo: item.metodo || '',
              metodo2: '',
              repuesto: item.repuesto || '',
              codigoMarca: item.codigoMarca || '',
              marca1: item.marca1 || '',
              comentario: item.comentario || '',
              fotoNombre: item.fotoPath || '',
              fotoPath: item.fotoPath || '',
              almacenado: item.almacenado || '',
              seccion: item.seccion || '',
              correlativo: '',
              descripcion: '',
              codigoMatachana: '',
              kit1: '',
              kit2: '',
              usados: 0
            }));
          } else {
            console.error('Google Sheets Apps Script returned success: false', resData.error);
            // Fallback to local DB if script reports error
            generalParts = await db.sparePart.findMany({
              where: { isMatachana: false },
              orderBy: { name: 'asc' }
            });
          }
        } else {
          console.error('Failed to fetch from Google Sheets Apps Script', response.status, response.statusText);
          // Fallback to local DB
          generalParts = await db.sparePart.findMany({
            where: { isMatachana: false },
            orderBy: { name: 'asc' }
          });
        }
      } catch (fetchError: any) {
        console.error('Error fetching from Google Sheets Apps Script:', fetchError.message);
        // Fallback to local DB
        generalParts = await db.sparePart.findMany({
          where: { isMatachana: false },
          orderBy: { name: 'asc' }
        });
      }
    } else {
      // Load everything from local DB if GOOGLE_SCRIPT_URL is not set
      generalParts = await db.sparePart.findMany({
        where: { isMatachana: false },
        orderBy: { name: 'asc' }
      });
    }

    const spareParts = [...generalParts, ...dbMatachanaParts];
    return NextResponse.json({ success: true, spareParts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
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

    if (!name || !code) {
      return NextResponse.json({ success: false, error: 'El nombre y código son obligatorios.' }, { status: 400 });
    }

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    const scriptToken = process.env.GOOGLE_SCRIPT_TOKEN || '';

    // If it's a general part and Google Sheets integration is enabled
    if (!isMatachana && scriptUrl && scriptUrl.trim() !== '') {
      try {
        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: scriptToken,
            action: 'create',
            payload: {
              metodo: metodo || '',
              code,
              name,
              repuesto: repuesto || '',
              codigoMarca: codigoMarca || '',
              marca1: marca1 || '',
              comentario: comentario || '',
              stock: Number(stock) || 0,
              fotoPath: fotoPath || '',
              almacenado: almacenado || '',
              seccion: seccion || ''
            }
          })
        });

        if (!response.ok) {
          const text = await response.text();
          return NextResponse.json({ success: false, error: `Error en Google Sheets API: ${response.statusText}. Detalle: ${text}` }, { status: 400 });
        }

        const resData = await response.json();
        if (!resData.success) {
          return NextResponse.json({ success: false, error: resData.error || 'Error al guardar en Google Sheets.' }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Error de red al conectar con Google Sheets: ${err.message}` }, { status: 500 });
      }
    } else {
      // If doing local only, check for duplicate codes in local DB
      const existing = await db.sparePart.findUnique({
        where: { code }
      });
      if (existing) {
        return NextResponse.json({ success: false, error: 'Ya existe un repuesto con ese código.' }, { status: 400 });
      }
    }

    // Mirror / Upsert the record in the local DB so fallback is always updated
    const sparePart = await db.sparePart.upsert({
      where: { code },
      update: {
        name,
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
        name,
        code,
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

