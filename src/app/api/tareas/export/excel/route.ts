import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

// Helper de normalización para comparar nombres de equipos sin importar acentos, espacios ni caracteres especiales
function normalizeString(val: string): string {
  return val
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar tildes/acentos
    .replace(/[^A-Z0-9]/g, ""); // Conservar solo letras y números
}

interface TemplateConfig {
  matches: (equipo: string) => boolean;
  templatePath: string;
  sheetToUse: string;
  fill: (sheet: ExcelJS.Worksheet, tarea: any, equipo: string, fechaFormateada: string, workbook: ExcelJS.Workbook) => void;
}

// Registro de plantillas configuradas (Fácilmente extensible para futuros equipos)
const templates: TemplateConfig[] = [
  {
    // 1. FORMATO DE CONFORMIDAD PARA AUTOCLAVES (V-1 a V-6)
    matches: (equipo: string) => {
      const eqNorm = normalizeString(equipo);
      return eqNorm.includes('AUTOCLAVE');
    },
    templatePath: path.join(process.cwd(), 'public', 'templates', 'CONFORMIDAD DE MANTENIMIENTO PREVENTIVO DE AUTOCLAVE FORMATO.xlsx'),
    sheetToUse: 'Hoja8', // Usamos la pestaña Hoja8 que es la plantilla original vacía y limpia
    fill: (sheet, tarea, equipo, fechaFormateada, workbook) => {
      // 1. Fecha Realizada en B5
      sheet.getCell('B5').value = `     FECHA   REALIZADA:   ${fechaFormateada}`;
      sheet.getCell('B5').font = { name: 'Arial', size: 9, bold: true };
      sheet.getCell('B5').alignment = { vertical: 'middle', horizontal: 'left' };

      // 2. Determinar columna del autoclave (C=V-1, D=V-2, E=V-3, F=V-4, G=V-5, H=V-6)
      const eqUpper = equipo.toUpperCase();
      let markedColIndex = -1; // Índice de columna a marcar (0 a 5)
      if (eqUpper.includes('V1') || eqUpper.includes('V-1')) markedColIndex = 0;
      else if (eqUpper.includes('V2') || eqUpper.includes('V-2')) markedColIndex = 1;
      else if (eqUpper.includes('V3') || eqUpper.includes('V-3')) markedColIndex = 2;
      else if (eqUpper.includes('V4') || eqUpper.includes('V-4')) markedColIndex = 3;
      else if (eqUpper.includes('V5') || eqUpper.includes('V-5')) markedColIndex = 4;
      else if (eqUpper.includes('V6') || eqUpper.includes('V-6')) markedColIndex = 5;

      // 3. Completar checklist (Filas 6 a 28 inclusive - las 23 actividades)
      for (let r = 6; r <= 28; r++) {
        for (let c = 0; c < 6; c++) {
          const colChar = String.fromCharCode(67 + c); // Columnas C, D, E, F, G, H
          const cell = sheet.getCell(`${colChar}${r}`);
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.font = { name: 'Arial', size: 10, bold: true };
          
          if (c === markedColIndex) {
            cell.value = 'A';
          } else {
            cell.value = '';
          }
        }
      }

      // 4. Insertar firma digitalizada con sello
      const firmaPath = path.join(process.cwd(), 'public', 'firma_eddy.png');
      if (fs.existsSync(firmaPath)) {
        const firmaImage = workbook.addImage({
          filename: firmaPath,
          extension: 'png',
        });
        sheet.addImage(firmaImage, {
          tl: { col: 0.1, row: 30 } as any, // Esquina superior izquierda en columna A, fila 31
          br: { col: 3.5, row: 35 } as any, // Ancho de columna A a D, alto de fila 31 a 36
          editAs: 'oneCell',
        });
      }
    }
  },
  {
    // 2. FORMATO DE CONFORMIDAD PARA EQUIPOS STERI-VAC (OE)
    matches: (equipo: string) => {
      const eqNorm = normalizeString(equipo);
      return eqNorm.includes('OE') || eqNorm.includes('STERI');
    },
    templatePath: path.join(process.cwd(), 'public', 'templates', 'MANTTO PREVENTIVO DE STERI-VAC OE-01.xlsx'),
    sheetToUse: 'Hoja1',
    fill: (sheet, tarea, equipo, fechaFormateada, workbook) => {
      // 1. Fecha Realizada en B6
      sheet.getCell('B6').value = `FECHA REALIZADA: ${fechaFormateada}`;
      sheet.getCell('B6').font = { name: 'Arial', size: 9, bold: true };
      sheet.getCell('B6').alignment = { vertical: 'middle', horizontal: 'left' };

      // 2. Determinar dinámicamente la columna en la fila 6 (de la C=Col 3 hasta la N=Col 14)
      const eqNorm = normalizeString(equipo);
      let markedColIndex = -1;
      for (let c = 3; c <= 14; c++) {
        const headerVal = sheet.getCell(6, c).value;
        if (headerVal) {
          const headerNorm = normalizeString(headerVal.toString());
          if (eqNorm.includes(headerNorm)) {
            markedColIndex = c;
            break;
          }
        }
      }

      // 3. Completar checklist (Filas 7 a 27 inclusive - las 21 actividades)
      for (let r = 7; r <= 27; r++) {
        for (let c = 3; c <= 14; c++) {
          const cell = sheet.getCell(r, c);
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.font = { name: 'Arial', size: 10, bold: true };
          
          if (c === markedColIndex) {
            cell.value = 'A';
          } else {
            cell.value = '';
          }
        }
      }

      // 4. Insertar firma digitalizada con sello
      const firmaPath = path.join(process.cwd(), 'public', 'firma_eddy.png');
      if (fs.existsSync(firmaPath)) {
        const firmaImage = workbook.addImage({
          filename: firmaPath,
          extension: 'png',
        });
        sheet.addImage(firmaImage, {
          tl: { col: 0.1, row: 28 } as any, // Anclado en columna A, fila 29
          br: { col: 3.5, row: 33 } as any, // Abarca columnas A a D, alto de fila 29 a 34
          editAs: 'oneCell',
        });
      }
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de tarea no especificado.' }, { status: 400 });
    }

    // 1. Obtener la tarea de la base de datos
    const tarea = await db.tarea.findUnique({
      where: { id }
    });

    if (!tarea) {
      return NextResponse.json({ success: false, error: 'Tarea no encontrada.' }, { status: 404 });
    }

    // 2. VALIDACIÓN ESTRICTA: El archivo Excel debe generarse ÚNICAMENTE para mantenimientos preventivos
    const tipoMantenimiento = (tarea.tipo || '').toUpperCase();
    if (tipoMantenimiento !== 'PREVENTIVO') {
      return NextResponse.json({ 
        success: false, 
        error: 'El informe de conformidad en Excel únicamente se genera para mantenimientos de tipo PREVENTIVO.' 
      }, { status: 400 });
    }

    // 3. Buscar plantilla configurada para el equipo
    const config = templates.find((t) => t.matches(tarea.equipo || ''));
    if (!config) {
      return NextResponse.json({ 
        success: false, 
        error: `No se encuentra configurada una plantilla de conformidad en Excel para el equipo: ${tarea.equipo || 'Sin Nombre'}.` 
      }, { status: 400 });
    }

    if (!fs.existsSync(config.templatePath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Archivo de plantilla física no encontrado en el servidor.' 
      }, { status: 500 });
    }

    // 4. Cargar la plantilla nativa usando ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(config.templatePath);

    const sheet = workbook.getWorksheet(config.sheetToUse);
    if (!sheet) {
      return NextResponse.json({ 
        success: false, 
        error: 'La hoja de trabajo de la plantilla seleccionada no pudo ser localizada.' 
      }, { status: 500 });
    }

    // Asegurar que se visualicen las líneas de cuadrícula
    sheet.views = [{ showGridLines: true }];

    // 5. Formatear la fecha para el reporte (de YYYY-MM-DD a DD/MM/YY)
    let fechaFormateada = '';
    if (tarea.fechaCulminado) {
      const parts = tarea.fechaCulminado.split('-');
      if (parts.length === 3) {
        fechaFormateada = `${parts[2]}/${parts[1]}/${parts[0].substring(2)}`;
      } else {
        fechaFormateada = tarea.fechaCulminado;
      }
    } else {
      fechaFormateada = tarea.fecha || new Date().toLocaleDateString('es-PE', { year: '2-digit', month: '2-digit', day: '2-digit' });
    }

    // 6. Rellenar dinámicamente según la configuración de la plantilla
    config.fill(sheet, tarea, tarea.equipo || '', fechaFormateada, workbook);

    // 7. Limpieza estricta: Eliminar el resto de hojas innecesarias y renombrar la de interés a "Conformidad"
    workbook.worksheets.forEach((ws) => {
      if (ws.name !== config.sheetToUse) {
        workbook.removeWorksheet(ws.id);
      }
    });
    sheet.name = 'Conformidad';

    // 8. Escribir el buffer y retornar el archivo como descarga directa
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
    return NextResponse.json({ 
      success: false, 
      error: 'Ocurrió un error inesperado al procesar la plantilla de conformidad.' 
    }, { status: 500 });
  }
}
