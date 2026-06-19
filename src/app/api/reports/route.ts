import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const reports = await db.report.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        periodFrom: true,
        periodTo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, periodFrom, periodTo } = body;

    const templateItems = [
      {
        itemNumber: 1,
        responsable: 'PROMAQUIRSA',
        machines: ['Ablandador', 'Osmosis (Lima)', 'Osmosis (Trujillo)']
      },
      {
        itemNumber: 2,
        responsable: 'METRINDUST',
        machines: ['Autoclave V1,V2,V3', 'Autoclave V4,V5,V6', 'Caldero']
      },
      {
        itemNumber: 3,
        responsable: 'Ing. Naveros Mantenimiento',
        machines: ['Autoclave V3']
      },
      {
        itemNumber: 4,
        responsable: 'Mantenimiento',
        machines: ['ETTO']
      },
      {
        itemNumber: 5,
        responsable: 'PROINSAC',
        machines: ['Autoclave V1 equipos, lavadora']
      },
      {
        itemNumber: 6,
        responsable: 'Ing. Naveros',
        machines: ['Formaldehido', 'V1', 'OE 5XL (TRUJILLO)']
      },
      {
        itemNumber: 7,
        responsable: 'LOGIC ENERGY',
        machines: ['OE 02']
      }
    ];

    const report = await db.$transaction(async (tx) => {
      const rep = await tx.report.create({
        data: {
          title: title || 'Reporte semanal de mantenimiento',
          periodFrom: periodFrom || '',
          periodTo: periodTo || ''
        }
      });

      for (const item of templateItems) {
        await tx.item.create({
          data: {
            reportId: rep.id,
            itemNumber: item.itemNumber,
            date: '',
            responsable: item.responsable,
            machines: {
              create: item.machines.map(name => ({
                name: name,
                tasks: {
                  create: [
                    {
                      falla: '',
                      tipo: 'correctivo',
                      descripcion: '',
                      repuestos: '-',
                      cantidad: '-',
                      estado: 'pendiente'
                    }
                  ]
                }
              }))
            }
          }
        });
      }

      return rep;
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Error creating template report:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
