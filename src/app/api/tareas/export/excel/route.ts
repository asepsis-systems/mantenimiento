import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de tarea no especificado.' }, { status: 400 });
    }

    // Buscar la tarea en la base de datos
    const tarea = await db.tarea.findUnique({
      where: { id }
    });

    if (!tarea) {
      return NextResponse.json({ success: false, error: 'Tarea no encontrada.' }, { status: 404 });
    }

    // Crear un nuevo Workbook de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Conformidad');

    // Configurar el diseño de la hoja (mostrar líneas de cuadrícula)
    worksheet.views = [{ showGridLines: true }];

    // Definir el ancho de las columnas
    worksheet.columns = [
      { header: '', key: 'A', width: 6 },   // Item
      { header: '', key: 'B', width: 55 },  // Descripción de Actividad
      { header: '', key: 'C', width: 6 },   // V-1
      { header: '', key: 'D', width: 6 },   // V-2
      { header: '', key: 'E', width: 6 },   // V-3
      { header: '', key: 'F', width: 6 },   // V-4
      { header: '', key: 'G', width: 6 },   // V-5
      { header: '', key: 'H', width: 6 },   // V-6
      { header: '', key: 'I', width: 3 },   // Espaciador
      { header: '', key: 'J', width: 40 },  // Columna derecha (Herramientas, etc.)
    ];

    // Estilos de bordes comunes
    const borderThin = {
      top: { style: 'thin' as const, color: { argb: 'FF000000' } },
      left: { style: 'thin' as const, color: { argb: 'FF000000' } },
      bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
      right: { style: 'thin' as const, color: { argb: 'FF000000' } },
    };

    const fillGrayHeader = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFF2F2F2' },
    };

    // ─── 1. DISEÑO DE CABECERA (LOGOS, TÍTULOS Y REVISIÓN) ─────────────────
    
    // Unir A1:B3 para los logos / empresa
    worksheet.mergeCells('A1:B3');
    const cellLogo = worksheet.getCell('A1');
    cellLogo.value = 'T&CH  |  ASEPSIS';
    cellLogo.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF0A2540' } };
    cellLogo.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cellLogo.border = borderThin;

    // Unir C1:H2 para el Título Principal del Informe
    worksheet.mergeCells('C1:H2');
    const cellTitle = worksheet.getCell('C1');
    cellTitle.value = 'INFORME DE CONFORMIDAD DE MANTENIMIENTO\nPREVENTIVO PARA AUTOCLAVES';
    cellTitle.font = { name: 'Arial', size: 10, bold: true };
    cellTitle.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cellTitle.border = borderThin;

    // Unir J1:J2 para Revisión (en la columna J que es la de herramientas)
    const cellRevision = worksheet.getCell('J1');
    cellRevision.value = 'REVISION: 02\n';
    cellRevision.font = { name: 'Arial', size: 8, bold: true };
    cellRevision.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cellRevision.border = borderThin;

    // J3 para Página 1 de 1
    const cellPagina = worksheet.getCell('J2');
    cellPagina.value = 'Pagina 1 de 1';
    cellPagina.font = { name: 'Arial', size: 8 };
    cellPagina.alignment = { vertical: 'middle', horizontal: 'left' };
    cellPagina.border = borderThin;

    // ─── 2. SECCIÓN FECHA Y AUTOCLAVES (FILA 5) ──────────────────────────
    
    // Formatear Fecha
    let fechaFormateada = '';
    if (tarea.fechaCulminado) {
      // De YYYY-MM-DD a DD/MM/YY
      const parts = tarea.fechaCulminado.split('-');
      if (parts.length === 3) {
        fechaFormateada = `${parts[2]}/${parts[1]}/${parts[0].substring(2)}`;
      } else {
        fechaFormateada = tarea.fechaCulminado;
      }
    } else {
      // Usar fecha general de tarea o fecha actual como fallback
      fechaFormateada = tarea.fecha || new Date().toLocaleDateString('es-PE', { year: '2-digit', month: '2-digit', day: '2-digit' });
    }

    worksheet.getCell('B5').value = `FECHA REALIZADA:  ${fechaFormateada}`;
    worksheet.getCell('B5').font = { name: 'Arial', size: 9, bold: true };
    worksheet.getCell('B5').alignment = { vertical: 'middle', horizontal: 'left' };

    // Cabecera de columnas de autoclaves V-1 a V-6 (C5 a H5)
    const autoclavesHeaders = ['V-1', 'V-2', 'V-3', 'V-4', 'V-5', 'V-6'];
    autoclavesHeaders.forEach((label, idx) => {
      const colChar = String.fromCharCode(67 + idx); // C, D, E, F, G, H
      const cell = worksheet.getCell(`${colChar}5`);
      cell.value = label;
      cell.font = { name: 'Arial', size: 9, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = borderThin;
      cell.fill = fillGrayHeader;
    });

    // Determinar qué autoclave marcar
    // Analizar el nombre del equipo, p.ej. "AUTOCLAVE V3", "AUTOCLAVE V-2 TRUJILLO", etc.
    const equipoUpper = (tarea.equipo || '').toUpperCase();
    let markedColIndex = -1; // -1 significa ninguno
    if (equipoUpper.includes('V1') || equipoUpper.includes('V-1')) markedColIndex = 0;
    else if (equipoUpper.includes('V2') || equipoUpper.includes('V-2')) markedColIndex = 1;
    else if (equipoUpper.includes('V3') || equipoUpper.includes('V-3')) markedColIndex = 2;
    else if (equipoUpper.includes('V4') || equipoUpper.includes('V-4')) markedColIndex = 3;
    else if (equipoUpper.includes('V5') || equipoUpper.includes('V-5')) markedColIndex = 4;
    else if (equipoUpper.includes('V6') || equipoUpper.includes('V-6')) markedColIndex = 5;
    else {
      // Fallback predeterminado por si no detecta autoclave específica: por defecto V-3 (según el modelo)
      markedColIndex = 2;
    }

    // ─── 3. CHECKLIST DE 23 ACTIVIDADES (FILAS 6 A 28) ────────────────────
    const actividades = [
      'Desmontaje y limpieza del deposito de agua',
      'Desmontaje, revision, limpieza y/o cambio de valvulas de entrada de agua',
      'Desmontaje y revision de valvulas de seguridad de camara y recamara',
      'Limpieza de camara',
      'Limpieza de filtros de drenaje',
      'Verificacion de estado de trampas',
      'Limpieza de asiento de junta de puerta',
      'Limpieza y/o cambio de junta de puerta',
      'Desmontaje y limpieza de purgadores',
      'Limpieza de filtros de entrada de agua y vapor',
      'Revision,limpieza y/o cambio de restrictores',
      'Revision y/o cambio de accesorios de piston de pierta',
      'Desmontaje de electrobomba para revision y/o mantenimiento',
      'Desmontaje de valvula reductora de presion para mantenimiento',
      'Regulacion de presostato doble',
      'Regulacion de vacuostato doble',
      'Revision de valvulas de manometros',
      'Ajuste o cambio valvula de bola burletes',
      'Revision y limpieza del sistema electronico',
      'Cambio de valvulas manuales de purga y entrada de vapor',
      'Cambio de filtro esteril de aire',
      'Revision de venturi',
      'Verificacion de sistema de funcionamiento'
    ];

    actividades.forEach((actividad, i) => {
      const rowNum = 6 + i;
      
      // Número de Item (A)
      const cellItem = worksheet.getCell(`A${rowNum}`);
      cellItem.value = i + 1;
      cellItem.font = { name: 'Arial', size: 9 };
      cellItem.alignment = { vertical: 'middle', horizontal: 'center' };
      cellItem.border = borderThin;

      // Descripción (B)
      const cellDesc = worksheet.getCell(`B${rowNum}`);
      cellDesc.value = actividad;
      cellDesc.font = { name: 'Arial', size: 9 };
      cellDesc.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      cellDesc.border = borderThin;

      // Columnas Autoclaves V1 a V6
      for (let c = 0; c < 6; c++) {
        const colChar = String.fromCharCode(67 + c);
        const cellAc = worksheet.getCell(`${colChar}${rowNum}`);
        cellAc.border = borderThin;
        cellAc.alignment = { vertical: 'middle', horizontal: 'center' };
        cellAc.font = { name: 'Arial', size: 10, bold: true };
        
        // Poner la "A" en la columna que corresponde
        if (c === markedColIndex) {
          cellAc.value = 'A';
        } else {
          cellAc.value = '';
        }
      }
    });

    // ─── 4. CONTENIDO COLUMNA DERECHA (HERRAMIENTAS, MEDIDORES, CONCLUSIONES) ───
    
    // A) HERRAMIENTAS A UTILIZAR (Filas 6 a 11)
    const cellHertTitle = worksheet.getCell('J6');
    cellHertTitle.value = 'HERRAMIENTAS A UTILIZAR';
    cellHertTitle.font = { name: 'Arial', size: 9, bold: true };
    cellHertTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    cellHertTitle.fill = fillGrayHeader;
    cellHertTitle.border = borderThin;

    const herramientas = [
      'Destornilladores.',
      'Llaves hexagonales,mixtas y francesas',
      'Alicates',
      'Cuchilla'
    ];

    herramientas.forEach((herr, idx) => {
      const row = 7 + idx;
      const cell = worksheet.getCell(`J${row}`);
      cell.value = herr;
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = borderThin;
    });

    // Bordes vacíos hasta fila 11 para cerrar el bloque de Herramientas de forma limpia
    for (let row = 11; row <= 12; row++) {
      worksheet.getCell(`J${row}`).border = borderThin;
    }

    // B) EQUIPO DE MEDICION A USAR (Filas 14 a 17)
    const cellMedTitle = worksheet.getCell('J14');
    cellMedTitle.value = 'EQUIPO DE MEDICION A USAR';
    cellMedTitle.font = { name: 'Arial', size: 9, bold: true };
    cellMedTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    cellMedTitle.fill = fillGrayHeader;
    cellMedTitle.border = borderThin;

    const equiposMedicion = [
      'Multimetro marca Sperry-modelo DSA500',
      'Manometro marca winters'
    ];

    equiposMedicion.forEach((eq, idx) => {
      const row = 15 + idx;
      const cell = worksheet.getCell(`J${row}`);
      cell.value = eq;
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = borderThin;
    });

    // Bordes vacíos hasta fila 18
    for (let row = 17; row <= 18; row++) {
      worksheet.getCell(`J${row}`).border = borderThin;
    }

    // C) CONCLUSIONES/RECOMENDACIONES (Filas 20 a 24)
    const cellConcTitle = worksheet.getCell('J20');
    cellConcTitle.value = 'CONCLUSIONES/RECOMENDACIONES';
    cellConcTitle.font = { name: 'Arial', size: 9, bold: true };
    cellConcTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    cellConcTitle.fill = fillGrayHeader;
    cellConcTitle.border = borderThin;

    const conclusiones = [
      'Prueba en vacio y con carga',
      'Verificacion de parametros',
      'Equipo queda operativo'
    ];

    conclusiones.forEach((conc, idx) => {
      const row = 21 + idx;
      const cell = worksheet.getCell(`J${row}`);
      cell.value = conc;
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = borderThin;
    });

    // Bordes vacíos hasta fila 25
    for (let row = 24; row <= 25; row++) {
      worksheet.getCell(`J${row}`).border = borderThin;
    }

    // Ajustar alturas de filas de forma general para comodidad visual premium
    worksheet.getRow(1).height = 18;
    worksheet.getRow(2).height = 18;
    worksheet.getRow(3).height = 18;
    worksheet.getRow(5).height = 24;
    for (let i = 6; i <= 28; i++) {
      worksheet.getRow(i).height = 20;
    }

    // Escribir el buffer y retornar la respuesta como archivo descargable
    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = `Informe_Conformidad_${tarea.equipo?.replace(/\s+/g, '_')}_${fechaFormateada.replace(/\//g, '-')}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error: any) {
    console.error('Error al exportar Excel:', error);
    return NextResponse.json({ success: false, error: 'Ocurrió un error inesperado al generar el archivo Excel.' }, { status: 500 });
  }
}
