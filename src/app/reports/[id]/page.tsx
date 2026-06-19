'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileSpreadsheet, Printer, Calendar, Wrench, AlertCircle } from 'lucide-react';
import { exportReportToExcel } from '@/lib/excel';

interface Task {
  id: string;
  falla: string;
  tipo: string;
  descripcion: string;
  repuestos: string;
  cantidad: string;
  estado: string;
}

interface Machine {
  id: string;
  name: string;
  tasks: Task[];
}

interface Item {
  id: string;
  itemNumber: number;
  date: string;
  responsable: string;
  machines: Machine[];
}

interface Report {
  id: string;
  title: string;
  periodFrom: string;
  periodTo: string;
  items: Item[];
}

interface FlatRow {
  itemIndex: number;
  itemId: string;
  itemDate: string;
  itemResponsable: string;
  
  machineId: string;
  machineName: string;
  
  taskId: string;
  falla: string;
  tipo: string;
  descripcion: string;
  repuestos: string;
  cantidad: string;
  estado: string;
  
  itemSpan: number;
  machineSpan: number;
  fallaSpan: number;
  tipoSpan: number;
  descripcionSpan: number;
}

export default function ReportViewer({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flatRows, setFlatRows] = useState<FlatRow[]>([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/${id}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setReport(data.report);
          computeFlatRows(data.report);
        } else {
          setError(data.error || 'Error al cargar el reporte');
        }
      } catch (err) {
        setError('Error de comunicación con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const computeFlatRows = (rep: Report) => {
    const rows: FlatRow[] = [];

    rep.items.forEach((item) => {
      const itemStartIdx = rows.length;
      
      item.machines.forEach((machine) => {
        const machineStartIdx = rows.length;
        const tasks = machine.tasks.length > 0 ? machine.tasks : [{
          id: `empty-${machine.id}`,
          falla: '',
          tipo: '',
          descripcion: '',
          repuestos: '-',
          cantidad: '-',
          estado: ''
        }];

        tasks.forEach((task) => {
          rows.push({
            itemIndex: item.itemNumber,
            itemId: item.id,
            itemDate: item.date,
            itemResponsable: item.responsable,
            machineId: machine.id,
            machineName: machine.name,
            taskId: task.id,
            falla: task.falla,
            tipo: task.tipo,
            descripcion: task.descripcion,
            repuestos: task.repuestos,
            cantidad: task.cantidad,
            estado: task.estado,
            
            itemSpan: 0,
            machineSpan: 0,
            fallaSpan: 0,
            tipoSpan: 0,
            descripcionSpan: 0
          });
        });

        const machineEndIdx = rows.length - 1;
        rows[machineStartIdx].machineSpan = machineEndIdx - machineStartIdx + 1;
      });

      const itemEndIdx = rows.length - 1;
      rows[itemStartIdx].itemSpan = itemEndIdx - itemStartIdx + 1;

      // Dynamic span calculation inside the item for Falla, Tipo, and Descripcion
      // Column "Falla" (4)
      let fallaStart = itemStartIdx;
      for (let idx = itemStartIdx + 1; idx <= itemEndIdx; idx++) {
        const prev = rows[idx - 1].falla;
        const curr = rows[idx].falla;
        if (curr && prev && curr === prev) {
          // continues
        } else {
          rows[fallaStart].fallaSpan = idx - fallaStart;
          fallaStart = idx;
        }
      }
      rows[fallaStart].fallaSpan = itemEndIdx - fallaStart + 1;

      // Column "Tipo" (5)
      let tipoStart = itemStartIdx;
      for (let idx = itemStartIdx + 1; idx <= itemEndIdx; idx++) {
        const prev = rows[idx - 1].tipo;
        const curr = rows[idx].tipo;
        if (curr && prev && curr === prev) {
          // continues
        } else {
          rows[tipoStart].tipoSpan = idx - tipoStart;
          tipoStart = idx;
        }
      }
      rows[tipoStart].tipoSpan = itemEndIdx - tipoStart + 1;

      // Column "Descripcion" (6)
      let descStart = itemStartIdx;
      for (let idx = itemStartIdx + 1; idx <= itemEndIdx; idx++) {
        const prev = rows[idx - 1].descripcion;
        const curr = rows[idx].descripcion;
        if (curr && prev && curr === prev) {
          // continues
        } else {
          rows[descStart].descripcionSpan = idx - descStart;
          descStart = idx;
        }
      }
      rows[descStart].descripcionSpan = itemEndIdx - descStart + 1;
    });

    setFlatRows(rows);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (report) {
      exportReportToExcel(report);
    }
  };

  const getStatusStyle = (status: string) => {
    const lower = status.toLowerCase().trim();
    if (lower === 'completado') {
      return 'bg-[#c2e7d9] text-[#1e4620] font-semibold text-center align-middle border border-slate-400/80 px-2 py-3';
    } else if (lower === 'proceso') {
      return 'bg-[#fcf3cf] text-[#7d6608] font-semibold text-center align-middle border border-slate-400/80 px-2 py-3';
    } else if (lower === 'pendiente') {
      return 'bg-[#fadbd8] text-[#78281f] font-semibold text-center align-middle border border-slate-400/80 px-2 py-3';
    }
    return 'bg-white text-slate-800 text-center align-middle border border-slate-400/80 px-2 py-3';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <svg className="animate-spin h-10 w-10 text-cyan-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-500 font-medium">Cargando reporte semanal...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-14 h-14 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">No se pudo cargar el reporte</h2>
          <p className="text-slate-500 mt-2">{error || 'El reporte no existe o fue eliminado.'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 inline-flex items-center gap-2 bg-slate-850 hover:bg-slate-750 text-white font-medium py-2 px-4 rounded-xl transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Panel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col print-container">
      {/* Top Navbar (Not Printed) */}
      <nav className="bg-white border-b border-slate-200/80 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2.5 rounded-2xl hover:bg-slate-100 border border-slate-200/40 hover:border-slate-200 text-slate-600 transition-all active:scale-95"
              title="Volver al Panel"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Reporte Semanal</p>
              <h2 className="text-sm font-bold text-slate-800">Visualizar Documento</h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-amber-500/35 hover:bg-amber-50 text-slate-700 hover:text-amber-800 font-semibold py-2.5 px-4 rounded-2xl transition-all text-sm shadow-xs"
            >
              <FileSpreadsheet className="w-4.5 h-4.5" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-2xl transition-all text-sm shadow-md shadow-cyan-600/10 hover:shadow-cyan-500/15"
            >
              <Printer className="w-4.5 h-4.5" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Report Container */}
      <main className="flex-1 max-w-[1250px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex justify-center items-start print:p-0">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-10 w-full overflow-x-auto print:border-none print:shadow-none print:p-0">
          
          {/* Header titles */}
          <div className="mb-6 flex flex-col items-start">
            <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wide print:text-lg">
              {report.title}
            </h1>
            <p className="text-slate-600 font-medium text-sm mt-1 print:text-xs">
              Periodo del : {report.periodFrom} al {report.periodTo}
            </p>
          </div>

          {/* Screenshot-fidelity Table */}
          <table className="w-full border-collapse border border-slate-800 text-xs min-w-[1000px] text-slate-900 leading-normal">
            <thead>
              <tr className="bg-white">
                <th className="border border-slate-850 py-3.5 px-2.5 text-center font-bold w-12">Item</th>
                <th className="border border-slate-850 py-3.5 px-3.5 text-center font-bold w-20">Fecha</th>
                <th className="border border-slate-850 py-3.5 px-4 text-center font-bold w-28">Responsable</th>
                <th className="border border-slate-850 py-3.5 px-4 text-center font-bold w-36">Equipo/Maquina</th>
                <th className="border border-slate-850 py-3.5 px-4.5 text-center font-bold w-48">Falla</th>
                <th className="border border-slate-850 py-3.5 px-3.5 text-center font-bold w-28">Tipo de Mantenimiento</th>
                <th className="border border-slate-850 py-3.5 px-5 text-center font-bold">Descripcion del trabajo</th>
                <th className="border border-slate-850 py-3.5 px-4 text-center font-bold w-44">Repuestos/ Insumos usados</th>
                <th className="border border-slate-850 py-3.5 px-2.5 text-center font-bold w-16">Cantidad</th>
                <th className="border border-slate-850 py-3.5 px-3 text-center font-bold w-28">Estado</th>
              </tr>
            </thead>
            <tbody>
              {flatRows.map((row, idx) => (
                <tr key={row.taskId} className="bg-white hover:bg-slate-50/40 transition-colors">
                  
                  {/* Item Index */}
                  {row.itemSpan > 0 && (
                    <td 
                      rowSpan={row.itemSpan} 
                      className="border border-slate-850 font-semibold text-center align-middle p-2.5 w-12"
                    >
                      {row.itemIndex}
                    </td>
                  )}

                  {/* Fecha */}
                  {row.itemSpan > 0 && (
                    <td 
                      rowSpan={row.itemSpan} 
                      className="border border-slate-850 text-center align-middle p-2.5 w-20"
                    >
                      {row.itemDate}
                    </td>
                  )}

                  {/* Responsable */}
                  {row.itemSpan > 0 && (
                    <td 
                      rowSpan={row.itemSpan} 
                      className="border border-slate-850 text-center align-middle uppercase p-2.5 w-28 font-medium"
                    >
                      {row.itemResponsable}
                    </td>
                  )}

                  {/* Equipo/Maquina */}
                  {row.machineSpan > 0 && (
                    <td 
                      rowSpan={row.machineSpan} 
                      className="border border-slate-850 font-semibold text-left align-middle px-3 py-2.5 w-36"
                    >
                      {row.machineName}
                    </td>
                  )}

                  {/* Falla */}
                  {row.fallaSpan > 0 && (
                    <td 
                      rowSpan={row.fallaSpan} 
                      className="border border-slate-850 text-left align-middle px-3 py-2.5 w-48"
                    >
                      {row.falla || '-'}
                    </td>
                  )}

                  {/* Tipo de Mantenimiento */}
                  {row.tipoSpan > 0 && (
                    <td 
                      rowSpan={row.tipoSpan} 
                      className="border border-slate-850 text-center align-middle px-2 py-2.5 w-28 capitalize"
                    >
                      {row.tipo || '-'}
                    </td>
                  )}

                  {/* Descripcion */}
                  {row.descripcionSpan > 0 && (
                    <td 
                      rowSpan={row.descripcionSpan} 
                      className="border border-slate-850 text-left align-middle px-3 py-2.5"
                    >
                      {row.descripcion || '-'}
                    </td>
                  )}

                  {/* Repuestos */}
                  <td className="border border-slate-850 text-left align-middle px-3 py-2.5 w-44">
                    {row.repuestos}
                  </td>

                  {/* Cantidad */}
                  <td className="border border-slate-850 text-center align-middle p-2.5 w-16">
                    {row.cantidad}
                  </td>

                  {/* Estado (badge completely colored) */}
                  <td className={getStatusStyle(row.estado)}>
                    {row.estado}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
