import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function addMonths(dateStr: string, months: number): string {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, 1);
  date.setMonth(date.getMonth() + months);
  const maxDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const targetDay = Math.min(day, maxDays);
  date.setDate(targetDay);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(request: NextRequest) {
  try {
    // Rutina inteligente de comprobación de tareas recurrentes vencidas
    try {
      const today = new Date().toISOString().split('T')[0];
      // Buscar todas las tareas culminadas recurrentes con proximaEjecucion <= hoy
      const overdueRecurrentTareas = await db.tarea.findMany({
        where: {
          estado: 'CULMINADO',
          esRecurrente: true,
          frecuenciaMeses: { not: null },
          proximaEjecucion: {
            not: null,
            lte: today
          }
        }
      });

      for (const parentTask of overdueRecurrentTareas) {
        if (!parentTask.proximaEjecucion) continue;

        // Verificar si ya se creó una tarea hija vinculada a este padre
        const existingChild = await db.tarea.findFirst({
          where: {
            tareaPadreId: parentTask.id
          }
        });

        if (!existingChild) {
          // Calcular itemNumber consecutivo para la fecha de próxima ejecución
          const childFecha = parentTask.proximaEjecucion;
          const maxItem = await db.tarea.findFirst({
            where: { fecha: childFecha },
            orderBy: { itemNumber: 'desc' },
            select: { itemNumber: true }
          });
          const childItemNumber = (maxItem?.itemNumber || 0) + 1;

          // Crear la tarea hija en estado PENDIENTE
          await db.tarea.create({
            data: {
              responsable: parentTask.responsable,
              descripcion: parentTask.descripcion,
              estado: 'PENDIENTE',
              itemNumber: childItemNumber,
              fecha: childFecha,
              equipo: parentTask.equipo,
              sede: parentTask.sede,
              falla: null, // Sin falla por ser preventivo planificado
              tipo: parentTask.tipo || 'Preventivo',
              repuestos: null,
              cantidad: null,
              frecuenciaMeses: parentTask.frecuenciaMeses,
              esRecurrente: parentTask.esRecurrente,
              tareaPadreId: parentTask.id
            }
          });
        }
      }
    } catch (autoGenError) {
      console.error('Error in task auto-generation routine:', autoGenError);
    }

    const tareas = await db.tarea.findMany({
      orderBy: { fecha_creacion: 'desc' }
    });
    return NextResponse.json({ success: true, tareas });
  } catch (error: any) {
    console.error('Error fetching tareas:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      responsable, 
      descripcion, 
      estado, 
      itemNumber, 
      fecha, 
      equipo, 
      sede, 
      falla, 
      tipo, 
      repuestos, 
      cantidad,
      frecuenciaMeses,
      esRecurrente,
      tareaPadreId,
      fechaCulminado,
      certificadoNombre,
      certificadoPath
    } = body;

    if (!descripcion || !descripcion.trim()) {
      return NextResponse.json({ success: false, error: 'La descripción es obligatoria.' }, { status: 400 });
    }
    if (!responsable || !responsable.trim()) {
      return NextResponse.json({ success: false, error: 'El responsable es obligatorio.' }, { status: 400 });
    }

    // Guardar automáticamente el responsable en la tabla de Responsables si no existe
    const cleanResponsable = responsable.trim();
    try {
      const existingResp = await db.responsable.findFirst({
        where: { nombre: cleanResponsable }
      });
      if (!existingResp) {
        await db.responsable.create({
          data: { nombre: cleanResponsable }
        });
      }
    } catch (dbErr) {
      console.error('Error saving automatic responsible:', dbErr);
    }

    // Formatear fecha por defecto si no existe (formato YYYY-MM-DD)
    const taskFecha = fecha || new Date().toISOString().split('T')[0];

    // Mapear estados anteriores y validar nuevos
    let cleanEstado = 'PENDIENTE';
    if (estado === 'HECHO' || estado === 'CULMINADO') {
      cleanEstado = 'CULMINADO';
    } else if (estado === 'EN_PROCESO') {
      cleanEstado = 'EN_PROCESO';
    }

    let finalFechaCulminado = fechaCulminado || null;
    if (cleanEstado === 'CULMINADO') {
      if (!finalFechaCulminado) {
        finalFechaCulminado = taskFecha;
      }
    } else {
      // No debe tener fecha de culminado si está pendiente o en proceso
      finalFechaCulminado = null;
    }

    const finalCertificadoNombre = certificadoNombre || null;
    const finalCertificadoPath = certificadoPath || null;

    // Calcular automáticamente el ítem correlativo del día si se dejó vacío
    let calculatedItemNumber = itemNumber;
    if (calculatedItemNumber === undefined || calculatedItemNumber === null || calculatedItemNumber === '') {
      const maxItem = await db.tarea.findFirst({
        where: { fecha: taskFecha },
        orderBy: { itemNumber: 'desc' },
        select: { itemNumber: true }
      });
      calculatedItemNumber = (maxItem?.itemNumber || 0) + 1;
    } else {
      calculatedItemNumber = Number(calculatedItemNumber);
    }

    // Calcular variables de programación CMMS
    const finalFrecuenciaMeses = frecuenciaMeses !== undefined && frecuenciaMeses !== null && frecuenciaMeses !== '' ? Number(frecuenciaMeses) : null;
    const finalEsRecurrente = esRecurrente !== undefined ? Boolean(esRecurrente) : true;
    let finalFechaUltimaEjecucion = null;
    let finalProximaEjecucion = null;

    if (finalFechaCulminado || cleanEstado === 'CULMINADO') {
      finalFechaUltimaEjecucion = finalFechaCulminado || taskFecha;
      if (finalFrecuenciaMeses !== null && finalEsRecurrente) {
        finalProximaEjecucion = addMonths(finalFechaUltimaEjecucion, finalFrecuenciaMeses);
      }
    }

    const tarea = await db.tarea.create({
      data: {
        responsable: responsable.trim(),
        descripcion: descripcion.trim(),
        estado: cleanEstado,
        itemNumber: calculatedItemNumber,
        fecha: taskFecha,
        equipo: equipo || null,
        sede: sede || null,
        falla: falla || null,
        tipo: tipo || null,
        repuestos: repuestos || null,
        cantidad: cantidad || null,
        frecuenciaMeses: finalFrecuenciaMeses,
        esRecurrente: finalEsRecurrente,
        fechaUltimaEjecucion: finalFechaUltimaEjecucion,
        proximaEjecucion: finalProximaEjecucion,
        tareaPadreId: tareaPadreId || null,
        fechaCulminado: finalFechaCulminado,
        certificadoNombre: finalCertificadoNombre,
        certificadoPath: finalCertificadoPath
      }
    });

    return NextResponse.json({ success: true, tarea });
  } catch (error: any) {
    console.error('Error creating tarea:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
