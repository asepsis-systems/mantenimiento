import * as XLSX from 'xlsx';

interface ExcelTask {
  id: string;
  falla: string;
  tipo: string;
  descripcion: string;
  repuestos: string;
  cantidad: string;
  estado: string;
}

interface ExcelMachine {
  id: string;
  name: string;
  tasks: ExcelTask[];
}

interface ExcelItem {
  id: string;
  itemNumber: number;
  date: string;
  responsable: string;
  machines: ExcelMachine[];
}

interface ExcelReport {
  title: string;
  periodFrom: string;
  periodTo: string;
  items: ExcelItem[];
}

export function exportReportToExcel(report: ExcelReport) {
  // Create worksheet
  const wsData: any[][] = [];

  // Title rows
  wsData.push([report.title]);
  wsData.push([`Periodo del : ${report.periodFrom} al ${report.periodTo}`]);
  wsData.push([]); // blank row

  // Headers row
  const headers = [
    'Item',
    'Fecha',
    'Responsable',
    'Equipo/Maquina',
    'Extra 1',
    'Extra 2',
    'Falla',
    'Tipo de Mantenimiento',
    'Descripcion del trabajo',
    'Repuestos/ Insumos usados',
    'Cantidad',
    'Estado'
  ];
  wsData.push(headers);

  const startRowIndex = 4; // Headers are on row 4 (index 3)
  let currentRowIndex = startRowIndex;
  const merges: XLSX.Range[] = [];

  // Title merges
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } });
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 9 } });

  // Loop through items
  report.items.forEach((item) => {
    const itemStartRow = currentRowIndex;
    
    // Count total tasks in item
    let totalTasksInItem = 0;
    item.machines.forEach(m => {
      totalTasksInItem += m.tasks.length || 1;
    });
    if (totalTasksInItem === 0) totalTasksInItem = 1;

    // Fill data rows first
    item.machines.forEach((machine) => {
      const machineStartRow = currentRowIndex;
      const tasks = machine.tasks.length > 0 ? machine.tasks : [{
        falla: '',
        tipo: '',
        descripcion: '',
        repuestos: '-',
        cantidad: '-',
        estado: ''
      }];

      tasks.forEach((task) => {
        wsData.push([
          item.itemNumber,
          item.date,
          item.responsable,
          machine.name,
          '',
          '',
        ]);
        currentRowIndex++;
      });

      const machineEndRow = currentRowIndex - 1;
      if (machineEndRow > machineStartRow) {
        merges.push({
          s: { r: machineStartRow, c: 3 },
          e: { r: machineEndRow, c: 3 }
        });
      }
    });

    const itemEndRow = currentRowIndex - 1;

    // Item level merges (Item, Fecha, Responsable)
    if (itemEndRow > itemStartRow) {
      merges.push({ s: { r: itemStartRow, c: 0 }, e: { r: itemEndRow, c: 0 } }); // Item
      merges.push({ s: { r: itemStartRow, c: 1 }, e: { r: itemEndRow, c: 1 } }); // Fecha
      merges.push({ s: { r: itemStartRow, c: 2 }, e: { r: itemEndRow, c: 2 } }); // Responsable
    }

    // Dynamic merges inside the item for Falla, Tipo, and Descripcion
    const itemRows = wsData.slice(itemStartRow, itemEndRow + 1);
    
    // Merge Falla (col 4), Tipo (col 5), and Descripcion (col 6)
    [4, 5, 6].forEach((colIdx) => {
      let mergeStart = itemStartRow;
      for (let r = 1; r < itemRows.length; r++) {
        const prevVal = itemRows[r - 1][colIdx];
        const currVal = itemRows[r][colIdx];
        
        // If current value matches previous, and it's not empty/blank
        if (currVal && prevVal && currVal === prevVal) {
          // continue merging
        } else {
          // end of match, check if we had a span
          const mergeEnd = itemStartRow + r - 1;
          if (mergeEnd > mergeStart) {
            merges.push({ s: { r: mergeStart, c: colIdx }, e: { r: mergeEnd, c: colIdx } });
          }
          mergeStart = itemStartRow + r;
        }
      }
      // handle the last span
      const mergeEnd = itemStartRow + itemRows.length - 1;
      if (mergeEnd > mergeStart) {
        merges.push({ s: { r: mergeStart, c: colIdx }, e: { r: mergeEnd, c: colIdx } });
      }
    });
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set merges
  ws['!merges'] = merges;

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // Item
    { wch: 12 }, // Fecha
    { wch: 25 }, // Responsable
    { wch: 25 }, // Equipo/Maquina
    { wch: 30 }, // Falla
    { wch: 20 }, // Tipo de Mantenimiento
    { wch: 45 }, // Descripcion
    { wch: 25 }, // Repuestos
    { wch: 10 }, // Cantidad
    { wch: 15 }  // Estado
  ];

  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Mantenimiento');

  // Save/Download Excel file
  const fileName = `Reporte_Mantenimiento_${report.periodFrom.replace(/\//g, '-')}_${report.periodTo.replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
