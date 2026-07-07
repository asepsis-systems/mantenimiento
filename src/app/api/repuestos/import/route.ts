import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'La lista de repuestos a importar es requerida y debe ser un arreglo.' },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[]
    };

    for (const item of items) {
      const { name, code, stock, minStock, price, location, isMatachana } = item;

      if (!name || !code) {
        results.errors.push(`Fila omitida: Nombre y Código son obligatorios.`);
        continue;
      }

      const formattedCode = String(code).trim().toUpperCase();
      const formattedName = String(name).trim();
      const parsedStock = Number(stock) || 0;
      const parsedMinStock = Number(minStock) || 0;
      const parsedPrice = price !== undefined && price !== null && price !== '' ? Number(price) : null;
      const formattedLocation = location ? String(location).trim() : '';

      try {
        // Use upsert to update existing or create new
        const existing = await db.sparePart.findUnique({
          where: { code: formattedCode }
        });

        if (existing) {
          await db.sparePart.update({
            where: { id: existing.id },
            data: {
              name: formattedName,
              stock: parsedStock,
              minStock: parsedMinStock,
              price: parsedPrice,
              location: formattedLocation,
              isMatachana: isMatachana !== undefined ? Boolean(isMatachana) : existing.isMatachana
            }
          });
          results.updated++;
        } else {
          await db.sparePart.create({
            data: {
              name: formattedName,
              code: formattedCode,
              stock: parsedStock,
              minStock: parsedMinStock,
              price: parsedPrice,
              location: formattedLocation,
              isMatachana: Boolean(isMatachana)
            }
          });
          results.created++;
        }
      } catch (err: any) {
        results.errors.push(`Error en código ${formattedCode}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      created: results.created,
      updated: results.updated,
      errors: results.errors
    });
  } catch (error: any) {
    console.error('Error during bulk import of spare parts:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
