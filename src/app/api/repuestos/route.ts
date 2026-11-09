import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const spareParts = await db.sparePart.findMany({
      orderBy: { name: 'asc' }
    });
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

    const finalCode = isMatachana ? (codigoMatachana || code) : code;
    const finalName = isMatachana ? (descripcion || name) : name;

    if (!finalName || !finalCode) {
      return NextResponse.json({ success: false, error: 'El nombre/descripción y el código son obligatorios.' }, { status: 400 });
    }

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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = await db.sparePart.deleteMany({});
    return NextResponse.json({ success: true, count: result.count, message: 'Inventario limpiado con éxito.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
