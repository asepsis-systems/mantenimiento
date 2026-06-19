import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await db.report.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { itemNumber: 'asc' },
          include: {
            machines: {
              include: {
                tasks: true
              }
            }
          }
        }
      }
    });

    if (!report) {
      return NextResponse.json({ success: false, error: 'Reporte no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { title, periodFrom, periodTo, items } = body;

    if (!title || !periodFrom || !periodTo) {
      return NextResponse.json({ success: false, error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    const { id } = await params;
    const reportId = id;

    const existingReport = await db.report.findUnique({ where: { id: reportId } });
    if (!existingReport) {
      return NextResponse.json({ success: false, error: 'Reporte no encontrado' }, { status: 404 });
    }

    // Run transaction to replace items, machines, and tasks
    await db.$transaction(async (tx) => {
      await tx.report.update({
        where: { id: reportId },
        data: { title, periodFrom, periodTo }
      });

      await tx.item.deleteMany({ where: { reportId } });

      if (items && Array.isArray(items)) {
        for (const item of items) {
          await tx.item.create({
            data: {
              reportId: reportId,
              itemNumber: parseInt(item.itemNumber) || 1,
              date: item.date || '',
              responsable: item.responsable || '',
              machines: {
                create: (item.machines || []).map((m: any) => ({
                  name: m.name || '',
                  tasks: {
                    create: (m.tasks || []).map((t: any) => ({
                      falla: t.falla || '',
                      tipo: t.tipo || '',
                      descripcion: t.descripcion || '',
                      repuestos: t.repuestos || '',
                      cantidad: t.cantidad || '',
                      estado: t.estado || 'pendiente'
                    }))
                  }
                }))
              }
            }
          });
        }
      }
    });

    const updatedReport = await db.report.findUnique({
      where: { id: reportId },
      include: {
        items: {
          orderBy: { itemNumber: 'asc' },
          include: {
            machines: {
              include: {
                tasks: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true, report: updatedReport });
  } catch (error: any) {
    console.error('Error updating report:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportId = id;
    const existingReport = await db.report.findUnique({ where: { id: reportId } });
    if (!existingReport) {
      return NextResponse.json({ success: false, error: 'Reporte no encontrado' }, { status: 404 });
    }

    await db.report.delete({ where: { id: reportId } });
    return NextResponse.json({ success: true, message: 'Reporte eliminado con éxito' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
