import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

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

    // Definir el ancho de las columnas (A-L)
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
      { header: '', key: 'J', width: 14 },  // Columna derecha bloque 1 (Herramientas, etc.)
      { header: '', key: 'K', width: 14 },  // Columna derecha bloque 2
      { header: '', key: 'L', width: 14 },  // Columna derecha bloque 3
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

    // Helper para aplicar bordes y fondos a rangos completos (incluyendo celdas combinadas)
    const borderRange = (sheet: ExcelJS.Worksheet, startCell: string, endCell: string, border: any, fill?: any) => {
      const start = sheet.getCell(startCell);
      const end = sheet.getCell(endCell);
      const startRow = Math.min(Number(start.row), Number(end.row));
      const endRow = Math.max(Number(start.row), Number(end.row));
      const startCol = Math.min(Number(start.col), Number(end.col));
      const endCol = Math.max(Number(start.col), Number(end.col));

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cell = sheet.getCell(r, c);
          cell.border = border;
          if (fill) cell.fill = fill;
        }
      }
    };

    // ─── 1. DISEÑO DE CABECERA (LOGOS, TÍTULOS Y REVISIÓN) ─────────────────
    
    // Unir A1:A3 para el logo
    worksheet.mergeCells('A1:A3');
    const cellLogo = worksheet.getCell('A1');
    borderRange(worksheet, 'A1', 'A3', borderThin);

    // Cargar e insertar Logo en A1:B3 de forma dinámica (flotando desde A hasta parte de B para el espacio horizontal)
    const logoPath = path.join(process.cwd(), 'public', 'logo2.jpg');
    if (fs.existsSync(logoPath)) {
      const logoImage = workbook.addImage({
        filename: logoPath,
        extension: 'jpeg',
      });
      worksheet.addImage(logoImage, {
        tl: { col: 0.05, row: 0.15 } as any,
        br: { col: 1.5, row: 2.85 } as any,
        editAs: 'oneCell',
      });
    } else {
      // Fallback de texto si no existe el archivo de imagen
      cellLogo.value = 'T&CH  |  ASEPSIS';
      cellLogo.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF0A2540' } };
      cellLogo.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    }

    // Unir B1:I3 para el Título Principal del Informe
    worksheet.mergeCells('B1:I3');
    const cellTitle = worksheet.getCell('B1');
    cellTitle.value = 'INFORME DE CONFORMIDAD DE MANTENIMIENTO\nPREVENTIVO PARA AUTOCLAVES';
    cellTitle.font = { name: 'Arial', size: 10, bold: true };
    cellTitle.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    borderRange(worksheet, 'B1', 'I3', borderThin);

    // Unir J1:L2 para Revisión (en la columna J-L que es la de herramientas)
    worksheet.mergeCells('J1:L2');
    const cellRevision = worksheet.getCell('J1');
    cellRevision.value = 'REVISION: 02\n';
    cellRevision.font = { name: 'Arial', size: 8, bold: true };
    cellRevision.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    borderRange(worksheet, 'J1', 'L2', borderThin);

    // J3:L3 para Página 1 de 1
    worksheet.mergeCells('J3:L3');
    const cellPagina = worksheet.getCell('J3');
    cellPagina.value = 'Pagina 1 de 1';
    cellPagina.font = { name: 'Arial', size: 8 };
    cellPagina.alignment = { vertical: 'middle', horizontal: 'left' };
    borderRange(worksheet, 'J3', 'L3', borderThin);

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

    // ─── 4. CONTENIDO COLUMNA DERECHA COMBINADA J:L (HERRAMIENTAS, MEDIDORES, CONCLUSIONES) ───
    
    // A) HERRAMIENTAS A UTILIZAR (Filas 6 a 12)
    worksheet.mergeCells('J6:L6');
    const cellHertTitle = worksheet.getCell('J6');
    cellHertTitle.value = 'HERRAMIENTAS A UTILIZAR';
    cellHertTitle.font = { name: 'Arial', size: 9, bold: true };
    cellHertTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    borderRange(worksheet, 'J6', 'L6', borderThin, fillGrayHeader);

    const herramientas = [
      'Destornilladores.',
      'Llaves hexagonales,mixtas y francesas',
      'Alicates',
      'Cuchilla'
    ];

    herramientas.forEach((herr, idx) => {
      const row = 7 + idx;
      worksheet.mergeCells(`J${row}:L${row}`);
      const cell = worksheet.getCell(`J${row}`);
      cell.value = herr;
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      borderRange(worksheet, `J${row}`, `L${row}`, borderThin);
    });

    // Bordes vacíos hasta fila 12 para cerrar el bloque de Herramientas de forma limpia
    for (let row = 11; row <= 12; row++) {
      worksheet.mergeCells(`J${row}:L${row}`);
      borderRange(worksheet, `J${row}`, `L${row}`, borderThin);
    }

    // B) EQUIPO DE MEDICION A USAR (Filas 14 a 18)
    worksheet.mergeCells('J14:L14');
    const cellMedTitle = worksheet.getCell('J14');
    cellMedTitle.value = 'EQUIPO DE MEDICION A USAR';
    cellMedTitle.font = { name: 'Arial', size: 9, bold: true };
    cellMedTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    borderRange(worksheet, 'J14', 'L14', borderThin, fillGrayHeader);

    const equiposMedicion = [
      'Multimetro marca Sperry-modelo DSA500',
      'Manometro marca winters'
    ];

    equiposMedicion.forEach((eq, idx) => {
      const row = 15 + idx;
      worksheet.mergeCells(`J${row}:L${row}`);
      const cell = worksheet.getCell(`J${row}`);
      cell.value = eq;
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      borderRange(worksheet, `J${row}`, `L${row}`, borderThin);
    });

    // Bordes vacíos hasta fila 18
    for (let row = 17; row <= 18; row++) {
      worksheet.mergeCells(`J${row}:L${row}`);
      borderRange(worksheet, `J${row}`, `L${row}`, borderThin);
    }

    // C) CONCLUSIONES/RECOMENDACIONES (Filas 20 a 25)
    worksheet.mergeCells('J20:L20');
    const cellConcTitle = worksheet.getCell('J20');
    cellConcTitle.value = 'CONCLUSIONES/RECOMENDACIONES';
    cellConcTitle.font = { name: 'Arial', size: 9, bold: true };
    cellConcTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    borderRange(worksheet, 'J20', 'L20', borderThin, fillGrayHeader);

    const conclusiones = [
      'Prueba en vacio y con carga',
      'Verificacion de parametros',
      'Equipo queda operativo'
    ];

    conclusiones.forEach((conc, idx) => {
      const row = 21 + idx;
      worksheet.mergeCells(`J${row}:L${row}`);
      const cell = worksheet.getCell(`J${row}`);
      cell.value = conc;
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      borderRange(worksheet, `J${row}`, `L${row}`, borderThin);
    });

    // Bordes vacíos hasta fila 25
    for (let row = 24; row <= 25; row++) {
      worksheet.mergeCells(`J${row}:L${row}`);
      borderRange(worksheet, `J${row}`, `L${row}`, borderThin);
    }

    // ─── 5. FIRMA Y SELLO CON LOGO DE T&CH (FILA 31 EN ADELANTE) ──────────
    // Cargar e insertar la Firma Digital de Eddy Montes (Jefe de Mantenimiento)
    const firmaPath = path.join(process.cwd(), 'public', 'firma_eddy.png');
    if (fs.existsSync(firmaPath)) {
      const firmaImage = workbook.addImage({
        filename: firmaPath,
        extension: 'png',
      });
      worksheet.addImage(firmaImage, {
        tl: { col: 0.1, row: 30 } as any, // Ubicado a la izquierda (A31)
        br: { col: 3.5, row: 35 } as any, // Se extiende hasta la columna D
        editAs: 'oneCell',
      });
    }

    // Ajustar alturas de filas de forma general para comodidad visual premium
    worksheet.getRow(1).height = 18;
    worksheet.getRow(2).height = 18;
    worksheet.getRow(3).height = 18;
    worksheet.getRow(5).height = 24;
    for (let i = 6; i <= 28; i++) {
      worksheet.getRow(i).height = 20;
    }

    // Ajustar altura de las filas para la firma al final
    for (let rowNum = 30; rowNum <= 36; rowNum++) {
      worksheet.getRow(rowNum).height = 20;
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
