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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const tarea = await db.tarea.findUnique({
      where: { id }
    });
    if (!tarea) {
      return NextResponse.json({ success: false, error: 'Tarea no encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, tarea });
  } catch (error: any) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
      fechaUltimaEjecucion,
      proximaEjecucion,
      tareaPadreId,
      fechaCulminado,
      certificadoNombre,
      certificadoPath
    } = body;

    // Check if task exists
    const existing = await db.tarea.findUnique({
      where: { id }
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Tarea no encontrada.' }, { status: 404 });
    }

    const updateData: any = {};
    if (responsable !== undefined) {
      if (!responsable.trim()) {
        return NextResponse.json({ success: false, error: 'El responsable no puede estar vacío.' }, { status: 400 });
      }
      updateData.responsable = responsable.trim();
    }

    if (descripcion !== undefined) {
      if (!descripcion.trim()) {
        return NextResponse.json({ success: false, error: 'La descripción no puede estar vacía.' }, { status: 400 });
      }
      updateData.descripcion = descripcion.trim();
    }

    // Resolviendo la fecha final de la tarea (fecha de registro)
    let finalFecha = existing.fecha;
    if (fecha !== undefined) {
      finalFecha = fecha === '' ? new Date().toISOString().split('T')[0] : fecha;
      updateData.fecha = finalFecha;
      
      // Si la fecha cambió y NO se está especificando manualmente un nuevo itemNumber,
      // recalculamos el correlativo del día para la nueva fecha de forma automática.
      if (fecha !== existing.fecha && itemNumber === undefined) {
        const maxItem = await db.tarea.findFirst({
          where: { fecha: finalFecha },
          orderBy: { itemNumber: 'desc' },
          select: { itemNumber: true }
        });
        updateData.itemNumber = (maxItem?.itemNumber || 0) + 1;
      }
    }

    // Resolviendo los nuevos valores
    let finalFechaCulminado = fechaCulminado !== undefined ? (fechaCulminado === '' ? null : fechaCulminado) : existing.fechaCulminado;
    const finalCertificadoNombre = certificadoNombre !== undefined ? (certificadoNombre === '' ? null : certificadoNombre) : existing.certificadoNombre;
    const finalCertificadoPath = certificadoPath !== undefined ? (certificadoPath === '' ? null : certificadoPath) : existing.certificadoPath;

    if (certificadoNombre !== undefined) updateData.certificadoNombre = finalCertificadoNombre;
    if (certificadoPath !== undefined) updateData.certificadoPath = finalCertificadoPath;

    // Lógica de transición de estado automática:
    // Si tiene fecha de culminado y certificado de operatividad, pasa automáticamente a CULMINADO.
    // Si el usuario borra uno de los dos y no se está enviando un estado explícito, revertimos a PENDIENTE (o mantemos el estado explícito).
    let targetEstado = estado !== undefined 
      ? (estado === 'HECHO' || estado === 'CULMINADO' ? 'CULMINADO' : estado)
      : existing.estado;

    if (finalFechaCulminado && finalCertificadoPath) {
      targetEstado = 'CULMINADO';
    } else if (estado === undefined && existing.estado === 'CULMINADO' && (!finalFechaCulminado || !finalCertificadoPath)) {
      targetEstado = 'PENDIENTE';
    }

    // Si el estado final es CULMINADO, autocompletar la fecha de culminación si no está especificada
    if (targetEstado === 'CULMINADO') {
      if (!finalFechaCulminado) {
        finalFechaCulminado = finalFecha;
      }
    } else {
      // Si el nuevo estado no es CULMINADO, vaciar la fecha de culminación
      finalFechaCulminado = null;
    }

    updateData.fechaCulminado = finalFechaCulminado;
    updateData.estado = targetEstado;

    if (itemNumber !== undefined) {
      updateData.itemNumber = itemNumber === '' ? null : Number(itemNumber);
    }
    
    if (equipo !== undefined) updateData.equipo = equipo === '' ? null : equipo;
    if (sede !== undefined) updateData.sede = sede === '' ? null : sede;
    if (falla !== undefined) updateData.falla = falla === '' ? null : falla;
    if (tipo !== undefined) updateData.tipo = tipo === '' ? null : tipo;
    if (repuestos !== undefined) updateData.repuestos = repuestos === '' ? null : repuestos;
    if (cantidad !== undefined) updateData.cantidad = cantidad === '' ? null : cantidad;

    if (frecuenciaMeses !== undefined) {
      updateData.frecuenciaMeses = frecuenciaMeses === '' ? null : frecuenciaMeses === null ? null : Number(frecuenciaMeses);
    }
    if (esRecurrente !== undefined) {
      updateData.esRecurrente = Boolean(esRecurrente);
    }
    if (fechaUltimaEjecucion !== undefined) {
      updateData.fechaUltimaEjecucion = fechaUltimaEjecucion === '' ? null : fechaUltimaEjecucion;
    }
    if (proximaEjecucion !== undefined) {
      updateData.proximaEjecucion = proximaEjecucion === '' ? null : proximaEjecucion;
    }
    if (tareaPadreId !== undefined) {
      updateData.tareaPadreId = tareaPadreId === '' ? null : tareaPadreId;
    }

    // Lógica CMMS en base a fecha de culminado y frecuencia, independiente del estado (PENDIENTE o CULMINADO)
    const calcFechaCulminado = finalFechaCulminado;
    const calcFrecuencia = frecuenciaMeses !== undefined 
      ? (frecuenciaMeses === '' ? null : frecuenciaMeses === null ? null : Number(frecuenciaMeses))
      : existing.frecuenciaMeses;
    const calcEsRecurrente = esRecurrente !== undefined 
      ? Boolean(esRecurrente) 
      : existing.esRecurrente;

    if (calcFechaCulminado) {
      updateData.fechaUltimaEjecucion = calcFechaCulminado;
      if (calcFrecuencia !== null && calcFrecuencia !== undefined && calcEsRecurrente !== false) {
        if (proximaEjecucion === undefined) {
          updateData.proximaEjecucion = addMonths(calcFechaCulminado, Number(calcFrecuencia));
        }
      } else {
        if (proximaEjecucion === undefined) {
          updateData.proximaEjecucion = null;
        }
      }
    } else {
      // Si no hay fecha de culminación, la última ejecución y próxima ejecución se limpian
      if (fechaUltimaEjecucion === undefined) {
        updateData.fechaUltimaEjecucion = null;
      }
      if (proximaEjecucion === undefined) {
        updateData.proximaEjecucion = null;
      }
    }

    const tarea = await db.tarea.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, tarea });
  } catch (error: any) {
    console.error(`Error updating tarea ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const existing = await db.tarea.findUnique({
      where: { id }
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Tarea no encontrada.' }, { status: 404 });
    }

    await db.tarea.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting tarea ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
