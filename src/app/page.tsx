'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Edit3, 
  LogOut, 
  Calendar, 
  User as UserIcon, 
  Wrench,
  AlertCircle,
  Table,
  LayoutGrid,
  Printer,
  Eye,
  CheckCircle,
  Clock,
  ChevronDown
} from 'lucide-react';
import { exportReportToExcel } from '@/lib/excel';

interface ReportSummary {
  id: string;
  title: string;
  periodFrom: string;
  periodTo: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

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
  shadow: boolean;
  cantidad: string;
  estado: string;
  
  itemSpan: number;
  machineSpan: number;
  fallaSpan: number;
  tipoSpan: number;
  descripcionSpan: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [flatRows, setFlatRows] = useState<FlatRow[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban'); // Default to kanban!
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Security: Logout on browser back button navigation
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {
        console.error('Error logging out on back navigation:', err);
      } finally {
        window.location.href = '/login';
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Fetch initial summaries and user
  useEffect(() => {
    const fetchUserDataAndReports = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);

        const repRes = await fetch('/api/reports');
        const repData = await repRes.json();
        if (repData.success) {
          setReports(repData.reports);
          if (repData.reports.length > 0) {
            setSelectedReportId(repData.reports[0].id);
          }
        } else {
          setError(repData.error || 'Error al cargar reportes');
        }
      } catch (err) {
        setError('Error de comunicación con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndReports();
  }, [router]);

  // Fetch detailed report when selected id changes
  useEffect(() => {
    if (!selectedReportId) {
      setActiveReport(null);
      setFlatRows([]);
      return;
    }

    const fetchReportDetail = async () => {
      setDetailLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/reports/${selectedReportId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setActiveReport(data.report);
          computeFlatRows(data.report);
        } else {
          setError(data.error || 'Error al cargar los detalles del reporte');
        }
      } catch (err) {
        setError('Error de red al cargar el reporte');
      } finally {
        setDetailLoading(false);
      }
    };

    fetchReportDetail();
  }, [selectedReportId]);

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
            shadow: false,
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

      // Spans calculation
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const handleCreateReport = async () => {
    setCreateLoading(true);
    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      const formatDate = (date: Date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = String(date.getFullYear()).substring(2);
        return `${d}/${m}/${y}`;
      };

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Reporte semanal de mantenimiento',
          periodFrom: formatDate(today),
          periodTo: formatDate(nextWeek)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Redirect to edit page for the newly created report
        router.push(`/reports/${data.report.id}/edit`);
      } else {
        alert(data.error || 'Error al crear el reporte');
      }
    } catch (err) {
      alert('Error de conexión al crear el reporte');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedReportId || !activeReport) return;
    const dateRange = `del ${activeReport.periodFrom} al ${activeReport.periodTo}`;
    if (!confirm(`¿Está seguro que desea eliminar el reporte de la semana "${dateRange}"? esta acción es irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/reports/${selectedReportId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        const remaining = reports.filter(r => r.id !== selectedReportId);
        setReports(remaining);
        if (remaining.length > 0) {
          setSelectedReportId(remaining[0].id);
        } else {
          setSelectedReportId(null);
        }
      } else {
        alert(data.error || 'Error al eliminar reporte');
      }
    } catch (err) {
      alert('Error de conexión al eliminar reporte');
    }
  };

  const handleExportExcel = async () => {
    if (!selectedReportId) return;
    try {
      const res = await fetch(`/api/reports/${selectedReportId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        exportReportToExcel(data.report);
      } else {
        alert(data.error || 'Error al cargar reporte para exportar');
      }
    } catch (err) {
      alert('Error al exportar archivo Excel');
    }
  };

  const handlePrint = () => {
    window.print();
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

  const getInitials = (name: string) => {
    if (!name) return '??';
    const cleanName = name.trim().toUpperCase();
    const words = cleanName.split(/\s+/);
    if (words.length >= 2) {
      return (cleanName.startsWith('ING. ') && words.length >= 3)
        ? (words[1][0] || '') + (words[2][0] || '')
        : (words[0][0] || '') + (words[1][0] || '');
    }
    return cleanName.substring(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-amber-500 text-white',
      'bg-sky-500 text-white',
      'bg-emerald-500 text-white',
      'bg-violet-500 text-white',
      'bg-pink-500 text-white',
      'bg-indigo-500 text-white',
      'bg-rose-500 text-white',
      'bg-teal-500 text-white'
    ];
    if (!name) return colors[0];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  // Filter tasks out of flatRows
  const validTasks = flatRows.filter(row => !row.taskId.startsWith('empty-') && row.descripcion.trim() !== '');

  const todoTasks = validTasks.filter(row => row.estado.toLowerCase().trim() === 'pendiente');
  const doingTasks = validTasks.filter(row => ['proceso', 'haciendo', 'en proceso', 'en_proceso'].includes(row.estado.toLowerCase().trim()));
  const doneTasks = validTasks.filter(row => ['completado', 'hecho', 'finalizado'].includes(row.estado.toLowerCase().trim()));

  const columns = [
    {
      key: 'doing',
      title: 'Haciendo',
      tasks: doingTasks,
      countText: `Los filtros coinciden con ${doingTasks.length} ${doingTasks.length === 1 ? 'tarjeta' : 'tarjetas'}`,
      dotColor: 'bg-amber-500'
    },
    {
      key: 'done',
      title: 'Hecho',
      tasks: doneTasks,
      countText: `Los filtros coinciden con ${doneTasks.length} ${doneTasks.length === 1 ? 'tarjeta' : 'tarjetas'}`,
      dotColor: 'bg-emerald-500'
    },
    {
      key: 'todo',
      title: 'Por hacer',
      tasks: todoTasks,
      countText: `Los filtros coinciden con ${todoTasks.length} ${todoTasks.length === 1 ? 'tarjeta' : 'tarjetas'}`,
      dotColor: 'bg-slate-400'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <svg className="animate-spin h-10 w-10 text-brand-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-500 font-medium animate-pulse">Cargando panel de reportes...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col print-container">
      {/* Header Banner */}
      <header className="bg-slate-900 text-white shadow-xl shadow-slate-950/10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-emerald-500 flex items-center justify-center shadow-md">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ASEPSIS SYSTEMS</h1>
              <p className="text-xs text-slate-400 font-light">Control de Reportes de Mantenimiento</p>
            </div>
          </div>

          {/* Central Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 shrink-0">
            <button
              onClick={() => router.push('/')}
              className="py-1.5 px-3.5 rounded-xl text-xs font-semibold text-white bg-white/10 transition-all animate-none"
            >
              Reporte Semanal
            </button>
            <button
              onClick={() => router.push('/repuestos')}
              className="py-1.5 px-3.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
            >
              Repuestos
            </button>
            <button
              onClick={() => router.push('/licencias')}
              className="py-1.5 px-3.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
            >
              Licencias
            </button>
          </nav>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl py-1.5 px-3">
                <UserIcon className="w-4 h-4 text-brand-400" />
                <div className="text-left">
                  <p className="text-xs font-semibold leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-400 leading-none capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>
            )}

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/users')}
                className="py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-all active:scale-95 flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4 text-brand-400" />
                <span>Gestionar Usuarios</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 transition-all active:scale-95"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Local print styles */}
      <style>{`
        @media print {
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .kanban-print-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 16px !important;
            background: white !important;
            color: black !important;
          }
          .kanban-print-col {
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 16px !important;
            padding: 16px !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .kanban-print-card {
            background: white !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            color: #0f172a !important;
            page-break-inside: avoid !important;
          }
          .kanban-print-card-title {
            color: #0f172a !important;
          }
          .kanban-print-badge {
            background: #f1f5f9 !important;
            border: 1px solid #cbd5e1 !important;
            color: #334155 !important;
          }
          .kanban-print-avatar {
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
            background: #f1f5f9 !important;
          }
        }
      `}</style>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1350px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 no-print">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Panel de Control</h2>
            <p className="text-sm text-slate-500">Visualiza, edita e imprime las tareas del reporte semanal de mantenimiento.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Period Selector Dropdown */}
            {reports.length > 0 && selectedReportId && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-350 rounded-2xl py-3 px-4.5 text-slate-700 text-sm font-semibold transition-all active:scale-[0.98] shadow-xs"
                >
                  <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>
                    {activeReport 
                      ? `Periodo: del ${activeReport.periodFrom} al ${activeReport.periodTo}`
                      : 'Cargando periodo...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 py-2 animate-in fade-in slide-in-from-top-2 duration-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-1 border-b border-slate-100">Seleccionar Semana</p>
                    <div className="max-h-60 overflow-y-auto mt-1">
                      {reports.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setSelectedReportId(r.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between ${
                            r.id === selectedReportId
                              ? 'bg-brand-50 text-brand-700 font-bold'
                              : 'text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          <span>del {r.periodFrom} al {r.periodTo}</span>
                          {r.id === selectedReportId && <span className="w-1.5 h-1.5 bg-brand-600 rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-2xl border border-slate-200/40">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-850 shadow-xs border border-slate-200/20'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tabla</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                  viewMode === 'kanban'
                    ? 'bg-white text-slate-850 shadow-xs border border-slate-200/20'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
            </div>

            {/* Create Report Button (technician/admin) */}
            {user?.role !== 'VIEWER' && (
              <button
                onClick={handleCreateReport}
                disabled={createLoading}
                className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-4.5 rounded-2xl shadow-lg shadow-brand-600/15 hover:shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
              >
                {createLoading ? (
                  <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4.5 h-4.5" />
                )}
                <span>Nuevo Reporte</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm no-print">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Selected report contents display */}
        {reports.length === 0 ? (
          <div className="h-[45vh] rounded-3xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center p-8 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No hay reportes de mantenimiento</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-1">
              {user?.role === 'VIEWER' 
                ? 'No se encontraron reportes semanales registrados.'
                : 'Comienza creando tu primer reporte semanal con el botón superior.'}
            </p>
            {user?.role !== 'VIEWER' && (
              <button
                onClick={handleCreateReport}
                className="mt-5 text-brand-600 hover:text-brand-500 font-semibold text-sm flex items-center gap-1.5 hover:underline"
              >
                Crear reporte ahora &rarr;
              </button>
            )}
          </div>
        ) : detailLoading ? (
          <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
            <svg className="animate-spin h-10 w-10 text-brand-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-slate-500 font-medium animate-pulse text-xs">Cargando tareas del periodo...</span>
          </div>
        ) : activeReport ? (
          <div className="space-y-6">
            {/* Active Report Actions Panel (Not Printed) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <Calendar className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm uppercase">{activeReport.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Semana del {activeReport.periodFrom} al {activeReport.periodTo}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-amber-500/35 hover:bg-amber-50 text-slate-700 hover:text-amber-800 font-semibold py-2.5 px-4 rounded-xl transition-all text-xs shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar Excel</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-brand-500/35 hover:bg-brand-50 text-slate-700 hover:text-brand-800 font-semibold py-2.5 px-4 rounded-xl transition-all text-xs shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir PDF</span>
                </button>

                {user?.role !== 'VIEWER' && (
                  <button
                    onClick={() => router.push(`/reports/${activeReport.id}/edit`)}
                    className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 text-emerald-700 font-semibold py-2.5 px-4 rounded-xl transition-all text-xs"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Editar Reporte</span>
                  </button>
                )}

                {user?.role === 'ADMIN' && (
                  <button
                    onClick={handleDeleteReport}
                    className="p-2.5 rounded-xl text-slate-450 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/40 hover:border-rose-100 transition-colors"
                    title="Eliminar Reporte"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Rendering depending on viewMode */}
            {viewMode === 'table' ? (
              /* Screenshot-fidelity Table view wrapper */
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 overflow-x-auto print:border-none print:shadow-none print:p-0">
                {/* Print Title (only visible on print output) */}
                <div className="hidden print:block mb-6">
                  <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wide">{activeReport.title}</h1>
                  <p className="text-slate-600 font-medium text-xs mt-1">Periodo del : {activeReport.periodFrom} al {activeReport.periodTo}</p>
                </div>

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

                        {/* Estado */}
                        <td className={getStatusStyle(row.estado)}>
                          {row.estado}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Premium Trello-style Kanban Board */
              <div className="w-full">
                {/* Print Title (only visible on print output) */}
                <div className="hidden print:block mb-6">
                  <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wide">{activeReport.title}</h1>
                  <p className="text-slate-600 font-medium text-xs mt-1">Periodo del : {activeReport.periodFrom} al {activeReport.periodTo}</p>
                </div>

                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden kanban-print-grid">
                  {/* Background Grid Pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-20 pointer-events-none" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 kanban-print-grid">
                    {columns.map((col) => (
                      <div 
                        key={col.key} 
                        className="bg-slate-900/65 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col max-h-[720px] min-h-[450px] kanban-print-col"
                      >
                        {/* Column Header */}
                        <div className="flex items-center justify-between pb-1 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                            <h3 className="font-bold text-white text-sm uppercase tracking-wide">{col.title}</h3>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-white/5 py-0.5 px-2 rounded-full border border-white/5 font-semibold">
                            {col.tasks.length}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 font-light italic shrink-0">{col.countText}</p>

                        {/* Task Cards Container */}
                        <div className="space-y-3 overflow-y-auto flex-1 mt-4 pr-1 py-1">
                          {col.tasks.length === 0 ? (
                            <div className="h-28 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-[10.5px] text-slate-600 bg-white/2 italic">
                              No hay tareas registradas
                            </div>
                          ) : (
                            col.tasks.map((task) => (
                              <div 
                                key={task.taskId} 
                                className="bg-slate-800/85 border border-white/10 hover:border-brand-400/40 rounded-xl p-4.5 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group kanban-print-card"
                              >
                                {/* Title (Description) */}
                                <div className="flex items-start gap-2.5">
                                  {col.key === 'done' ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                  ) : col.key === 'doing' ? (
                                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                  )}
                                  <h4 className="font-semibold text-white text-xs leading-snug group-hover:text-brand-300 transition-colors kanban-print-card-title">
                                    {task.descripcion}
                                  </h4>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  <span className="text-[8.5px] font-bold text-brand-400 bg-brand-950/60 border border-brand-900/40 py-0.5 px-2 rounded-md uppercase tracking-wider shrink-0 kanban-print-badge">
                                    {task.machineName}
                                  </span>
                                  {task.falla && (
                                    <span className="text-[8.5px] font-medium text-slate-400 bg-slate-900/50 border border-white/5 py-0.5 px-2 rounded-md shrink-0 kanban-print-badge">
                                      Falla: {task.falla}
                                    </span>
                                  )}
                                  {task.repuestos && task.repuestos !== '-' && (
                                    <span className="text-[8.5px] font-medium text-slate-400 bg-slate-900/50 border border-white/5 py-0.5 px-2 rounded-md shrink-0 kanban-print-badge">
                                      Insumo: {task.repuestos} {task.cantidad !== '-' ? `(x${task.cantidad})` : ''}
                                    </span>
                                  )}
                                </div>

                                {/* Card Footer */}
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 shrink-0">
                                  <div className="flex items-center gap-1 text-[9.5px] text-slate-500 font-light group-hover:text-slate-400 transition-colors">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Ver detalles</span>
                                  </div>
                                  
                                  {/* Assignee Avatar circle */}
                                  <div 
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[9.5px] font-bold shadow-xs select-none border border-slate-900/50 transition-all shrink-0 hover:scale-105 kanban-print-avatar ${getAvatarColor(task.itemResponsable)}`}
                                    title={`Responsable: ${task.itemResponsable}`}
                                  >
                                    {getInitials(task.itemResponsable)}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No se pudo seleccionar el reporte activo.
          </div>
        )}
      </main>
    </div>
  );
}
