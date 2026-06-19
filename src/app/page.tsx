'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Eye, 
  Edit3, 
  LogOut, 
  Calendar, 
  User as UserIcon, 
  Wrench,
  AlertCircle
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

export default function Dashboard() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Security: Logout on browser back button navigation
  useEffect(() => {
    // Push dummy state to the history stack
    window.history.pushState(null, '', window.location.href);

    const handlePopState = async () => {
      try {
        console.log('Detectado botón de retroceso. Cerrando sesión por seguridad...');
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

  // Fetch user and reports
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);

        // Fetch reports
        const repRes = await fetch('/api/reports');
        const repData = await repRes.json();
        if (repData.success) {
          setReports(repData.reports);
        } else {
          setError(repData.error || 'Error al cargar reportes');
        }
      } catch (err) {
        setError('Error de comunicación con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

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
      // Create empty report with today's dates as placeholder format
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
        // Redirect to edit page
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

  const handleDeleteReport = async (id: string, title: string) => {
    if (!confirm(`¿Está seguro que desea eliminar el reporte "${title}"? esta acción es irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setReports(reports.filter(r => r.id !== id));
      } else {
        alert(data.error || 'Error al eliminar reporte');
      }
    } catch (err) {
      alert('Error de conexión al eliminar reporte');
    }
  };

  const handleExportExcel = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`);
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <svg className="animate-spin h-10 w-10 text-cyan-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-500 font-medium animate-pulse">Cargando panel de reportes...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Banner */}
      <header className="bg-slate-900 text-white shadow-xl shadow-slate-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center shadow-md">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ASEPSIS SYSTEMS</h1>
              <p className="text-xs text-slate-400 font-light">Control de Reportes de Mantenimiento</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl py-1.5 px-3">
                <UserIcon className="w-4 h-4 text-cyan-400" />
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
                <UserIcon className="w-4 h-4 text-cyan-400" />
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Panel de Control</h2>
            <p className="text-sm text-slate-500">Crea, edita y exporta reportes semanales de mantenimiento.</p>
          </div>

          {user?.role !== 'VIEWER' && (
            <button
              onClick={handleCreateReport}
              disabled={createLoading}
              className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-3 px-5 rounded-2xl shadow-lg shadow-cyan-600/15 hover:shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {createLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <Plus className="w-5 h-5" />
              )}
              <span>Crear Reporte Semanal</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Reports Grid */}
        {reports.length === 0 ? (
          <div className="h-[45vh] rounded-3xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center p-8 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No hay reportes disponibles</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-1">
              {user?.role === 'VIEWER' 
                ? 'No se encontraron reportes semanales en la base de datos.'
                : 'Comienza creando tu primer reporte semanal utilizando el botón superior.'}
            </p>
            {user?.role !== 'VIEWER' && (
              <button
                onClick={handleCreateReport}
                className="mt-5 text-cyan-600 hover:text-cyan-500 font-semibold text-sm flex items-center gap-1.5 hover:underline"
              >
                Crear reporte ahora &rarr;
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div 
                key={report.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-slate-300/80 transition-premium flex flex-col p-6 group"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 group-hover:bg-cyan-100/70 flex items-center justify-center text-cyan-600 transition-colors">
                    <Calendar className="w-6 h-6" />
                  </div>
                  
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={() => handleDeleteReport(report.id, `${report.periodFrom} - ${report.periodTo}`)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Eliminar Reporte"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>

                {/* Card Title & Dates */}
                <div className="mb-6 flex-1">
                  <h3 className="font-bold text-slate-800 text-lg leading-snug">{report.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <span className="font-semibold text-cyan-600 bg-cyan-50 py-0.5 px-2.5 rounded-lg border border-cyan-100">
                      Periodo
                    </span>
                    <span>del {report.periodFrom} al {report.periodTo}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="grid grid-cols-3 gap-2.5 border-t border-slate-100 pt-4.5">
                  <button
                    onClick={() => router.push(`/reports/${report.id}`)}
                    className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-slate-50 hover:bg-cyan-50 text-slate-600 hover:text-cyan-700 border border-slate-200/40 hover:border-cyan-100 transition-colors"
                    title="Ver PDF / Imprimir"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-[10px] font-medium">Ver Reporte</span>
                  </button>

                  <button
                    onClick={() => router.push(`/reports/${report.id}/edit`)}
                    disabled={user?.role === 'VIEWER'}
                    className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200/40 hover:border-emerald-100 transition-colors disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:text-slate-600 disabled:hover:border-slate-200/40"
                    title="Editar Reporte"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="text-[10px] font-medium">Editar</span>
                  </button>

                  <button
                    onClick={() => handleExportExcel(report.id)}
                    className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200/40 hover:border-amber-100 transition-colors"
                    title="Exportar a Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="text-[10px] font-medium">Excel</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
