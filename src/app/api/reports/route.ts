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

    const report = await db.$transaction(async (tx) => {
      const rep = await tx.report.create({
        data: {
          title: title || 'Reporte semanal de mantenimiento',
          periodFrom: periodFrom || '',
          periodTo: periodTo || ''
        }
      });

      // Create a single blank item, machine, and task structure
      await tx.item.create({
        data: {
          reportId: rep.id,
          itemNumber: 1,
          date: '',
          responsable: '',
          machines: {
            create: [
              {
                name: '',
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
              }
            ]
          }
        }
      });

      return rep;
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Error creating blank template report:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
