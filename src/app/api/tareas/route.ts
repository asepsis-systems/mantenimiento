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
          // Calcular itemNumber consecutivo por mes para la fecha de próxima ejecución
          const childFecha = parentTask.proximaEjecucion;
          const yearMonthStr = childFecha.substring(0, 7);
          const maxItem = await db.tarea.findFirst({
            where: { fecha: { startsWith: yearMonthStr } },
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
      certificadoPath,
      horaInicio,
      frecuenciaHrs,
      proximoMantenimientoHrs,
      sparePartId,
      cantidadUsada,
      unidadMedida
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

    // Calcular automáticamente el ítem correlativo del mes si se dejó vacío
    let calculatedItemNumber = itemNumber;
    if (calculatedItemNumber === undefined || calculatedItemNumber === null || calculatedItemNumber === '') {
      const yearMonthStr = taskFecha.substring(0, 7);
      const maxItem = await db.tarea.findFirst({
        where: { fecha: { startsWith: yearMonthStr } },
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

    // Lógica de validación de Inventario y descuento de Stock
    let finalRepuestos = repuestos;
    let finalCantidad = cantidad;

    if (sparePartId) {
      const part = await db.sparePart.findUnique({
        where: { id: sparePartId }
      });
      if (!part) {
        return NextResponse.json({ success: false, error: 'El repuesto seleccionado no existe en el inventario.' }, { status: 404 });
      }

      const qtyToUse = Number(cantidadUsada);
      if (isNaN(qtyToUse) || qtyToUse <= 0) {
        return NextResponse.json({ success: false, error: 'La cantidad utilizada debe ser un número mayor a cero.' }, { status: 400 });
      }

      if (part.stock < qtyToUse) {
        return NextResponse.json({ 
          success: false, 
          error: `Stock insuficiente en inventario para "${part.name}". Solicitado: ${qtyToUse}, Disponible: ${part.stock}` 
        }, { status: 400 });
      }

      // Autogenerar la descripción detallada del repuesto e historial
      const locText = [part.almacenado, part.seccion].filter(Boolean).join(' / ');
      const locSuffix = locText ? ` [Ubicación: ${locText}]` : '';
      const brandSuffix = part.marca1 ? ` - Marca: ${part.marca1}` : '';
      const methodSuffix = part.metodo ? ` [Método: ${part.metodo}]` : '';
      
      finalRepuestos = `${part.name} (Cód: ${part.code}${brandSuffix}${methodSuffix}${locSuffix})`;
      finalCantidad = `${qtyToUse} ${unidadMedida || 'unidades'}`;
    }

    // Ejecutar creación y descuento dentro de una transacción atómica segura
    const tarea = await db.$transaction(async (tx) => {
      if (sparePartId) {
        const qtyToUse = Number(cantidadUsada);
        // Validar stock dentro de la transacción para evitar condiciones de carrera (Race Conditions)
        const part = await tx.sparePart.findUnique({
          where: { id: sparePartId }
        });
        if (!part || part.stock < qtyToUse) {
          throw new Error(`Stock insuficiente para el repuesto "${part?.name || 'Desconocido'}"`);
        }

        // Descontar del inventario
        await tx.sparePart.update({
          where: { id: sparePartId },
          data: {
            stock: {
              decrement: qtyToUse
            }
          }
        });
      }

      // Crear la tarea en la base de datos
      const nuevaTarea = await tx.tarea.create({
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
          repuestos: finalRepuestos || null,
          cantidad: finalCantidad || null,
          frecuenciaMeses: finalFrecuenciaMeses,
          esRecurrente: finalEsRecurrente,
          fechaUltimaEjecucion: finalFechaUltimaEjecucion,
          proximaEjecucion: finalProximaEjecucion,
          tareaPadreId: tareaPadreId || null,
          fechaCulminado: finalFechaCulminado,
          certificadoNombre: finalCertificadoNombre,
          certificadoPath: finalCertificadoPath,
          horaInicio: horaInicio !== undefined && horaInicio !== null && horaInicio !== '' ? Number(horaInicio) : null,
          frecuenciaHrs: frecuenciaHrs !== undefined && frecuenciaHrs !== null && frecuenciaHrs !== '' ? Number(frecuenciaHrs) : null,
          proximoMantenimientoHrs: proximoMantenimientoHrs !== undefined && proximoMantenimientoHrs !== null && proximoMantenimientoHrs !== '' ? Number(proximoMantenimientoHrs) : null
        }
      });

      return nuevaTarea;
    });

    return NextResponse.json({ success: true, tarea });
  } catch (error: any) {
    console.error('Error creating tarea:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
