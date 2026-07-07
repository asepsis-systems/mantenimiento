'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus,
  LogOut, 
  User as UserIcon, 
  AlertCircle,
  CheckCircle,
  Search,
  Calendar,
  RotateCcw,
  Edit2,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Check,
  Clock
} from 'lucide-react';

import { TaskModal } from '@/components/TaskModal';
import { TaskForm } from '@/components/TaskForm';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

interface Tarea {
  id: string;
  responsable: string;
  descripcion: string;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  itemNumber?: number | null;
  fecha?: string | null;
  equipo?: string | null;
  sede?: string | null;
  falla?: string | null;
  tipo?: string | null;
  repuestos?: string | null;
  cantidad?: string | null;
  frecuenciaMeses?: number | null;
  fechaUltimaEjecucion?: string | null;
  proximaEjecucion?: string | null;
  esRecurrente?: boolean;
  tareaPadreId?: string | null;
  certificadoNombre?: string | null;
  certificadoPath?: string | null;
  fechaCulminado?: string | null;
}

interface Responsable {
  id: string;
  nombre: string;
}

export default function Dashboard() {
  const router = useRouter();
  
  // App states
  const [user, setUser] = useState<User | null>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  
  // Loading & Feedback states
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters & Inputs
  const [selectedRespFilter, setSelectedRespFilter] = useState<string | null>(null);
  const [searchRespQuery, setSearchRespQuery] = useState('');
  const [newRespName, setNewRespName] = useState('');

  // Advanced Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDIENTE' | 'EN_PROCESO' | 'CULMINADO'>('ALL');

  // Sorting
  const [sortField, setSortField] = useState<'fecha' | 'responsable' | 'equipo' | 'estado' | 'cantidad'>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal control states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Tarea | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteRespId, setConfirmDeleteRespId] = useState<string | null>(null);

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renamingResp, setRenamingResp] = useState<Responsable | null>(null);
  const [newRenamedName, setNewRenamedName] = useState('');

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

  // Fetch initial data
  const fetchData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const [tareasRes, respRes] = await Promise.all([
        fetch('/api/tareas'),
        fetch('/api/responsables')
      ]);

      const tareasData = await tareasRes.json();
      const respData = await respRes.json();

      if (tareasData.success) {
        setTareas(tareasData.tareas);
      } else {
        setError(tareasData.error || 'Error al cargar tareas');
      }

      if (respData.success) {
        setResponsables(respData.responsables);
      } else {
        setError(respData.error || 'Error al cargar responsables');
      }
    } catch (err) {
      setError('Error de comunicación con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  // Toast feedback helper
  const showFeedback = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccess(msg);
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(msg);
      setSuccess('');
      setTimeout(() => setError(''), 4000);
    }
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

  // --- RESPONSABLES CRUD ---
  const handleAddResponsible = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRespName.trim()) return;

    try {
      const res = await fetch('/api/responsables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newRespName })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResponsables(prev => [...prev, data.responsable].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setNewRespName('');
        showFeedback('success', 'Responsable agregado con éxito.');
      } else {
        showFeedback('error', data.error || 'Error al agregar responsable.');
      }
    } catch (err) {
      showFeedback('error', 'Error de red al agregar responsable.');
    }
  };

  const handleRenameResponsible = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingResp || !newRenamedName.trim()) return;

    try {
      const res = await fetch(`/api/responsables/${renamingResp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newRenamedName })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update list of responsibles
        setResponsables(prev => 
          prev.map(r => r.id === renamingResp.id ? data.responsable : r)
              .sort((a, b) => a.nombre.localeCompare(b.nombre))
        );
        
        // Update local tasks associated with the old name
        setTareas(prev => 
          prev.map(t => t.responsable === renamingResp.nombre ? { ...t, responsable: data.responsable.nombre } : t)
        );

        if (selectedRespFilter === renamingResp.nombre) {
          setSelectedRespFilter(data.responsable.nombre);
        }

        setIsRenameModalOpen(false);
        setRenamingResp(null);
        showFeedback('success', 'Responsable renombrado con éxito.');
      } else {
        showFeedback('error', data.error || 'Error al renombrar responsable.');
      }
    } catch (err) {
      showFeedback('error', 'Error de red al renombrar responsable.');
    }
  };

  const handleDeleteResponsible = async () => {
    if (!confirmDeleteRespId) return;

    try {
      const respToDelete = responsables.find(r => r.id === confirmDeleteRespId);
      const res = await fetch(`/api/responsables/${confirmDeleteRespId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setResponsables(prev => prev.filter(r => r.id !== confirmDeleteRespId));
        
        // Clear filter if selected
        if (respToDelete && selectedRespFilter === respToDelete.nombre) {
          setSelectedRespFilter(null);
        }

        setConfirmDeleteRespId(null);
        showFeedback('success', 'Responsable eliminado con éxito.');
      } else {
        showFeedback('error', data.error || 'Error al eliminar responsable.');
      }
    } catch (err) {
      showFeedback('error', 'Error de red al eliminar responsable.');
    }
  };

  // --- TAREAS CRUD ---
  const handleCreateOrUpdateTask = async (values: any) => {
    setIsSubmitting(true);
    try {
      if (editingTask) {
        // Update task
        const res = await fetch(`/api/tareas/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setTareas(prev => prev.map(t => t.id === editingTask.id ? data.tarea : t));
          setIsTaskModalOpen(false);
          setEditingTask(null);
          showFeedback('success', 'Tarea actualizada con éxito.');
        } else {
          showFeedback('error', data.error || 'Error al actualizar tarea.');
        }
      } else {
        // Create task
        const res = await fetch('/api/tareas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setTareas(prev => [data.tarea, ...prev]);
          setIsTaskModalOpen(false);
          showFeedback('success', 'Tarea creada con éxito.');
        } else {
          showFeedback('error', data.error || 'Error al crear tarea.');
        }
      }
    } catch (err) {
      showFeedback('error', 'Error de comunicación con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadCertificado = async (taskId: string, file: File) => {
    if (!file) return;
    setUploadingTaskId(taskId);
    setIsTableLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('id', taskId);

      const res = await fetch('/api/tareas/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTareas(prev => prev.map(t => t.id === taskId ? data.tarea : t));
        showFeedback('success', 'Certificado cargado con éxito.');
      } else {
        showFeedback('error', data.error || 'Error al cargar el certificado.');
      }
    } catch (err) {
      showFeedback('error', 'Error de red al subir el certificado.');
    } finally {
      setUploadingTaskId(null);
      setIsTableLoading(false);
    }
  };

  const handleUpdateFechaCulminado = async (taskId: string, val: string) => {
    setEditingDateId(null);
    setIsTableLoading(true);

    try {
      const res = await fetch(`/api/tareas/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaCulminado: val })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTareas(prev => prev.map(t => t.id === taskId ? data.tarea : t));
        showFeedback('success', 'Fecha de culminación actualizada con éxito.');
      } else {
        showFeedback('error', data.error || 'Error al actualizar fecha.');
      }
    } catch (err) {
      showFeedback('error', 'Error de red al actualizar fecha.');
    } finally {
      setIsTableLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, targetEstado: string) => {
    const task = tareas.find(t => t.id === id);
    if (!task || task.estado === targetEstado) return;

    const originalEstado = task.estado;

    // Optimistic Update
    setTareas(prev => prev.map(t => t.id === id ? { ...t, estado: targetEstado } : t));

    try {
      const res = await fetch(`/api/tareas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: targetEstado })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTareas(prev => prev.map(t => t.id === id ? { ...t, estado: originalEstado } : t));
        showFeedback('error', data.error || 'Error al cambiar estado.');
      } else {
        showFeedback('success', 'Estado de tarea actualizado con éxito.');
      }
    } catch (err) {
      setTareas(prev => prev.map(t => t.id === id ? { ...t, estado: originalEstado } : t));
      showFeedback('error', 'Error de red al actualizar estado.');
    }
  };

  const handleDeleteTask = async () => {
    if (!confirmDeleteId) return;

    try {
      const res = await fetch(`/api/tareas/${confirmDeleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setTareas(prev => prev.filter(t => t.id !== confirmDeleteId));
        setConfirmDeleteId(null);
        showFeedback('success', 'Tarea eliminada con éxito.');
      } else {
        showFeedback('error', data.error || 'Error al eliminar tarea.');
      }
    } catch (err) {
      showFeedback('error', 'Error de red al eliminar tarea.');
    }
  };

  // --- FILTERS & COMPUTATIONS ---

  // Reset pagination to page 1 whenever any filter parameter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, searchTerm, selectedRespFilter, pageSize]);

  // Extract task date in YYYY-MM-DD format
  const getTaskDate = (t: Tarea) => {
    if (t.fecha) return t.fecha;
    if (t.fecha_creacion) return t.fecha_creacion.substring(0, 10);
    return '';
  };

  // Spanish date formatter (e.g., "Jueves, 02 de Julio de 2026")
  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return 'Sin fecha';
    const cleanStr = dateStr.includes('T') ? dateStr.substring(0, 10) : dateStr;
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const formatter = new Intl.DateTimeFormat('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formatted = formatter.format(dateObj);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    return dateStr;
  };

  // Small date formatter (e.g. "02/07/2026")
  const formatSmallDate = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanStr = dateStr.includes('T') ? dateStr.substring(0, 10) : dateStr;
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Task aging check: PENDIENTE and older than 7 days
  const isTaskDelayed = (t: Tarea) => {
    if (t.estado !== 'PENDIENTE') return false;
    const tDate = getTaskDate(t);
    if (!tDate) return false;
    const parts = tDate.split('-');
    if (parts.length === 3) {
      const taskTime = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
      const todayTime = new Date().setHours(0, 0, 0, 0);
      const diffDays = (todayTime - taskTime) / (1000 * 60 * 60 * 24);
      return diffDays > 7;
    }
    return false;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const getDaysDiff = (date1: string, date2: string) => {
    const parts1 = date1.split('-');
    const parts2 = date2.split('-');
    if (parts1.length !== 3 || parts2.length !== 3) return 0;
    const d1 = new Date(Number(parts1[0]), Number(parts1[1]) - 1, Number(parts1[2]));
    const d2 = new Date(Number(parts2[0]), Number(parts2[1]) - 1, Number(parts2[2]));
    const diffTime = d2.getTime() - d1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getIsCurrentMonth = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length < 2) return false;
    const todayParts = todayStr.split('-');
    return parts[0] === todayParts[0] && parts[1] === todayParts[1];
  };

  const addMonths = (dateStr: string, months: number): string => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
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
  };

  const renderProximoBadge = (t: Tarea) => {
    // 1. Si la tarea tiene una fecha de culminación explícita
    if (t.fechaCulminado) {
      if (t.frecuenciaMeses && t.esRecurrente !== false) {
        const targetDate = addMonths(t.fechaCulminado, t.frecuenciaMeses);
        const diff = getDaysDiff(todayStr, targetDate);
        const tooltipText = `Próximo mantenimiento: ${formatSmallDate(targetDate)}`;

        if (diff < 0) {
          const absDiff = Math.abs(diff);
          return (
            <div className="relative group/badge inline-block select-none cursor-help" title={tooltipText}>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold rounded-full shadow-xs animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                <span>⚠️ Vencido hace {absDiff} d</span>
              </span>
            </div>
          );
        } else {
          return (
            <span className="text-slate-500 font-semibold text-xs select-none" title={tooltipText}>
              {formatSmallDate(targetDate)}
            </span>
          );
        }
      } else {
        // Tareas con fecha de culminación pero sin recurrencia ("Única")
        return <span className="text-slate-400 font-semibold text-xs select-none">Sin recurrencia</span>;
      }
    }

    // 2. Si es una tarea ya culminada pero sin fechaCulminado (fallback heredado)
    const isCompleted = t.estado === 'CULMINADO' || t.estado === 'HECHO';
    if (isCompleted) {
      if (!t.frecuenciaMeses || !t.esRecurrente) {
        return <span className="text-slate-400 font-semibold text-xs select-none">Sin recurrencia</span>;
      }
      const targetDate = t.proximaEjecucion;
      if (!targetDate) {
        return <span className="text-slate-400 font-light text-xs">-</span>;
      }
      const diff = getDaysDiff(todayStr, targetDate);
      const tooltipText = `Próximo mantenimiento: ${formatSmallDate(targetDate)}`;

      if (diff < 0) {
        const absDiff = Math.abs(diff);
        return (
          <div className="relative group/badge inline-block select-none cursor-help" title={tooltipText}>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold rounded-full shadow-xs animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              <span>⚠️ Vencido hace {absDiff} d</span>
            </span>
          </div>
        );
      } else {
        return (
          <span className="text-slate-500 font-semibold text-xs select-none" title={tooltipText}>
            {formatSmallDate(targetDate)}
          </span>
        );
      }
    }

    // 3. Tareas pendientes o en proceso sin fecha de culminación (usa fecha de planificación t.fecha)
    const targetDate = t.fecha;
    if (!targetDate) {
      return <span className="text-slate-400 font-light text-xs">-</span>;
    }

    const diff = getDaysDiff(todayStr, targetDate);
    const tooltipText = `Próximo mantenimiento: ${formatSmallDate(targetDate)}`;

    if (diff < 0) {
      const absDiff = Math.abs(diff);
      return (
        <div className="relative group/badge inline-block select-none cursor-help" title={tooltipText}>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold rounded-full shadow-xs animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            <span>⚠️ Vencido hace {absDiff} d</span>
          </span>
        </div>
      );
    } else {
      return (
        <span className="text-slate-500 font-semibold text-xs select-none" title={tooltipText}>
          {formatSmallDate(targetDate)}
        </span>
      );
    }
  };

  // Filter computation
  const filteredTareas = tareas.filter(t => {
    // Responsable filter
    if (selectedRespFilter && t.responsable.toLowerCase() !== selectedRespFilter.toLowerCase()) {
      return false;
    }

    // Date range filter
    const tDate = getTaskDate(t);
    if (fromDate && tDate < fromDate) return false;
    if (toDate && tDate > toDate) return false;

    // Search query matching
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const cleanEst = t.estado === 'HECHO' ? 'culminado' : t.estado.toLowerCase();
      const matches = 
        (t.responsable || '').toLowerCase().includes(q) ||
        (t.equipo || '').toLowerCase().includes(q) ||
        (t.falla || '').toLowerCase().includes(q) ||
        (t.descripcion || '').toLowerCase().includes(q) ||
        (t.repuestos || '').toLowerCase().includes(q) ||
        (t.tipo || '').toLowerCase().includes(q) ||
        cleanEst.includes(q);
      if (!matches) return false;
    }

    return true;
  });

  // KPI counters calculated strictly over the filtered dataset
  const totalCount = filteredTareas.length;
  const pendientesCount = filteredTareas.filter(t => t.estado === 'PENDIENTE').length;
  const enProcesoCount = filteredTareas.filter(t => t.estado === 'EN_PROCESO').length;
  const culminadasCount = filteredTareas.filter(t => t.estado === 'CULMINADO' || t.estado === 'HECHO').length;

  // CMMS KPI Counters
  const proximosCount = filteredTareas.filter(t => t.estado !== 'CULMINADO' && t.fecha && getDaysDiff(todayStr, t.fecha) >= 0 && getDaysDiff(todayStr, t.fecha) <= 30).length;
  const vencidosCount = filteredTareas.filter(t => t.estado !== 'CULMINADO' && t.fecha && getDaysDiff(todayStr, t.fecha) < 0).length;
  const estaSemanaCount = filteredTareas.filter(t => t.estado !== 'CULMINADO' && t.fecha && getDaysDiff(todayStr, t.fecha) >= 0 && getDaysDiff(todayStr, t.fecha) <= 7).length;
  const esteMesCount = filteredTareas.filter(t => t.estado !== 'CULMINADO' && t.fecha && getIsCurrentMonth(t.fecha)).length;

  // Apply quick status filter
  const finalFilteredTareas = filteredTareas.filter(t => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDIENTE') return t.estado === 'PENDIENTE';
    if (statusFilter === 'EN_PROCESO') return t.estado === 'EN_PROCESO';
    if (statusFilter === 'CULMINADO') return t.estado === 'CULMINADO' || t.estado === 'HECHO';
    return true;
  });

  // Sorting computation
  const sortedTareas = [...finalFilteredTareas].sort((a, b) => {
    let valA: any = '';
    let valB: any = '';

    if (sortField === 'fecha') {
      valA = getTaskDate(a);
      valB = getTaskDate(b);
    } else if (sortField === 'responsable') {
      valA = (a.responsable || '').toLowerCase();
      valB = (b.responsable || '').toLowerCase();
    } else if (sortField === 'equipo') {
      valA = (a.equipo || '').toLowerCase();
      valB = (b.equipo || '').toLowerCase();
    } else if (sortField === 'estado') {
      const priority = (s: string) => {
        const clean = s === 'HECHO' ? 'CULMINADO' : s;
        if (clean === 'PENDIENTE') return 1;
        if (clean === 'EN_PROCESO') return 2;
        if (clean === 'CULMINADO') return 3;
        return 4;
      };
      valA = priority(a.estado);
      valB = priority(b.estado);
    } else if (sortField === 'cantidad') {
      valA = parseInt(a.cantidad || '0', 10) || 0;
      valB = parseInt(b.cantidad || '0', 10) || 0;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;

    // Secondary sort: itemNumber ascending or creation date descending
    if (sortField !== 'fecha') {
      const dateA = getTaskDate(a);
      const dateB = getTaskDate(b);
      if (dateA !== dateB) return dateA > dateB ? -1 : 1;
    }
    const itemA = a.itemNumber || 9999;
    const itemB = b.itemNumber || 9999;
    return itemA - itemB;
  });

  // Stable daily correlatives computation starting from 1 (render-time sequential)
  // Maps task.id to its 1-based index within its date group
  const getStableItemNumbers = () => {
    const groups: Record<string, string[]> = {};
    
    // Group all task IDs by date
    sortedTareas.forEach(t => {
      const d = getTaskDate(t);
      if (!groups[d]) groups[d] = [];
      groups[d].push(t.id);
    });

    const itemMap: Record<string, number> = {};
    Object.keys(groups).forEach(d => {
      // Sort tasks within this day by their original itemNumber or creation time to keep order stable
      const dayTasks = groups[d].map(id => tareas.find(x => x.id === id)!);
      dayTasks.sort((a, b) => {
        if (a.itemNumber !== undefined && a.itemNumber !== null && b.itemNumber !== undefined && b.itemNumber !== null) {
          return a.itemNumber - b.itemNumber;
        }
        return new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime();
      });

      dayTasks.forEach((t, idx) => {
        itemMap[t.id] = idx + 1;
      });
    });

    return itemMap;
  };

  const computedItemNumbers = getStableItemNumbers();

  // Pagination slicing
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const paginatedTareas = sortedTareas.slice(startIndex, endIndex);

  // Trigger search trigger visual feedback
  const handleSearchTrigger = () => {
    setIsTableLoading(true);
    setTimeout(() => setIsTableLoading(false), 350);
  };

  // Clear all advanced date filters and search terms
  const handleClearFilters = () => {
    setIsTableLoading(true);
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setSelectedRespFilter(null);
    setTimeout(() => setIsTableLoading(false), 300);
    showFeedback('success', 'Filtros restaurados con éxito.');
  };

  // Print friendly PDF respecting current filters
  const handleExportTasksPDF = () => {
    const origin = window.location.origin;
    const escapeHtml = (s?: string) => {
      if (!s) return '';
      return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // Build visual grouping of rows by date for the PDF report
    let lastDate = '';
    const rowsHtml = sortedTareas.map(t => {
      const currDate = getTaskDate(t);
      const isHeaderNeeded = currDate !== lastDate;
      lastDate = currDate;

      const itemNum = computedItemNumbers[t.id] || t.itemNumber || 1;
      
      const headerRow = isHeaderNeeded ? `
        <tr style="background-color:#f1f5f9; font-weight:bold;">
          <td colspan="12" style="padding:10px; border:1px solid #cbd5e1; font-size:12px; color:#1e293b;">
            📅 ${formatFriendlyDate(currDate)} (${sortedTareas.filter(x => getTaskDate(x) === currDate).length} tareas)
          </td>
        </tr>
      ` : '';

      const stateBadge = t.estado === 'PENDIENTE' ? '<span style="background-color:#ffe4e6;color:#9f1239;padding:2px 8px;border-radius:12px;font-weight:bold;font-size:11px;">🔴 Pendiente</span>' :
                         t.estado === 'EN_PROCESO' ? '<span style="background-color:#fef3c7;color:#92400e;padding:2px 8px;border-radius:12px;font-weight:bold;font-size:11px;">🟡 En Proceso</span>' :
                         '<span style="background-color:#d1fae5;color:#065f46;padding:2px 8px;border-radius:12px;font-weight:bold;font-size:11px;">🟢 Culminado</span>';

      const targetDate = (t.estado === 'CULMINADO' || t.estado === 'HECHO') ? t.proximaEjecucion : t.fecha;
      const proximoText = targetDate ? formatSmallDate(targetDate) : '-';
      const frecuenciaText = t.frecuenciaMeses ? `🔄 ${t.frecuenciaMeses} ${t.frecuenciaMeses === 1 ? 'Mes' : 'Meses'}` : 'Única';

      return `
        ${headerRow}
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;font-weight:bold;">${itemNum}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;font-weight:600;">${escapeHtml(t.responsable)}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;"><strong>${escapeHtml(t.equipo || '')}</strong> <br/><small style="color:#64748b">${escapeHtml(t.sede || '')}</small></td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;color:#b91c1c;">${escapeHtml(t.falla || '-')}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;"><strong>${escapeHtml(t.tipo || '')}</strong><br/>${escapeHtml(t.descripcion)}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;">${escapeHtml(t.repuestos || '-')}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${escapeHtml(t.cantidad || '-')}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;color:#0369a1;font-weight:600;">${t.certificadoPath ? '📎 Sí' : '-'}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${t.fechaCulminado ? formatSmallDate(t.fechaCulminado) : '-'}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${stateBadge}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${escapeHtml(frecuenciaText)}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;font-weight:500;">${escapeHtml(proximoText)}</td>
        </tr>
      `;
    }).join('\n');

    const activeRangeText = fromDate || toDate 
      ? `Período: ${fromDate ? formatSmallDate(fromDate) : 'Inicio'} hasta ${toDate ? formatSmallDate(toDate) : 'Fin'}`
      : 'Todos los registros registrados';

    const activeSearchText = searchTerm.trim() ? `Búsqueda: "${escapeHtml(searchTerm)}"` : '';
    const activeRespText = selectedRespFilter ? `Filtrado por responsable: ${escapeHtml(selectedRespFilter)}` : '';

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Control de Reportes de Mantenimiento - Export PDF</title>
          <style>
            @media print {
              @page { size: landscape; margin: 15mm; }
            }
            body{font-family:'Segoe UI',Inter,sans-serif;color:#0f172a;padding:20px;background-color:#fff;}
            table{border-collapse:collapse;width:100%;margin-top:20px;}
            th{background-color:#0f172a;color:#ffffff;padding:10px;border:1px solid #475569;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;}
            td{vertical-align:top;line-height:1.4;}
            .kpi-row{display:flex;gap:15px;margin-bottom:15px;}
            .kpi-box{border:1px solid #e2e8f0;border-radius:12px;padding:10px;text-align:center;flex:1;}
            .kpi-title{font-size:9px;text-transform:uppercase;color:#64748b;font-weight:bold;margin-bottom:4px;}
            .kpi-num{font-size:16px;font-weight:bold;}
          </style>
        </head>
        <body>
          <div style="display:flex;align-items:center;justify-content:between;border-bottom:2px solid #0f172a;padding-bottom:15px;margin-bottom:20px;">
            <div style="display:flex;align-items:center;gap:15px;">
              <img src="${origin}/logo2.jpg" alt="Logo" style="height:48px;object-fit:contain;border-radius:8px;" />
              <div>
                <h1 style="margin:0;font-size:22px;letter-spacing:-0.5px;color:#0f172a;">Control de Reportes de Mantenimiento</h1>
                <div style="font-size:12px;color:#64748b;font-weight:500;">Módulo CMMS Empresarial • ASEPSIS S.A.C.</div>
              </div>
            </div>
            <div style="text-align:right;font-size:11px;color:#64748b;">
              <strong>Generado por:</strong> ${escapeHtml(user?.name || 'Administrador')}<br/>
              <strong>Fecha:</strong> ${new Date().toLocaleString('es-PE')}
            </div>
          </div>

          <div style="font-size:12px;background-color:#f8fafc;padding:10px 15px;border-radius:8px;border-left:4px solid #263fff;margin-bottom:20px;">
            <strong>Filtros Activos:</strong> ${activeRangeText} ${activeSearchText ? ` | ${activeSearchText}` : ''} ${activeRespText ? ` | ${activeRespText}` : ''}
          </div>

          <div class="kpi-row">
            <div class="kpi-box" style="border-left:4px solid #2563eb;">
              <div class="kpi-title">Total Tareas</div>
              <div class="kpi-num" style="color:#2563eb;">${totalCount}</div>
            </div>
            <div class="kpi-box" style="border-left:4px solid #dc2626;">
              <div class="kpi-title">Pendientes</div>
              <div class="kpi-num" style="color:#dc2626;">${pendientesCount}</div>
            </div>
            <div class="kpi-box" style="border-left:4px solid #d97706;">
              <div class="kpi-title">En Proceso</div>
              <div class="kpi-num" style="color:#d97706;">${enProcesoCount}</div>
            </div>
            <div class="kpi-box" style="border-left:4px solid #16a34a;">
              <div class="kpi-title">Culminadas</div>
              <div class="kpi-num" style="color:#16a34a;">${culminadasCount}</div>
            </div>
            <div class="kpi-box" style="border-left:4px solid #7c3aed;">
              <div class="kpi-title">Vencidos</div>
              <div class="kpi-num" style="color:#7c3aed;">${vencidosCount}</div>
            </div>
            <div class="kpi-box" style="border-left:4px solid #06b6d4;">
              <div class="kpi-title">Próximos 30d</div>
              <div class="kpi-num" style="color:#06b6d4;">${proximosCount}</div>
            </div>
            <div class="kpi-box" style="border-left:4px solid #ec4899;">
              <div class="kpi-title">Esta Semana</div>
              <div class="kpi-num" style="color:#ec4899;">${estaSemanaCount}</div>
            </div>
            <div class="kpi-box" style="border-left:4px solid #14b8a6;">
              <div class="kpi-title">Este Mes</div>
              <div class="kpi-num" style="color:#14b8a6;">${esteMesCount}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:4%;text-align:center;">Item</th>
                <th style="width:11%;">Responsable</th>
                <th style="width:12%;">Equipo / Máquina</th>
                <th style="width:10%;">Falla</th>
                <th style="width:16%;">Tipo y Descripción</th>
                <th style="width:9%;">Repuestos</th>
                <th style="width:4%;text-align:center;">Cant</th>
                <th style="width:10%;text-align:center;">Certificado</th>
                <th style="width:8%;text-align:center;">Fecha Culm.</th>
                <th style="width:8%;text-align:center;">Estado</th>
                <th style="width:8%;text-align:center;">Frecuencia</th>
                <th style="width:10%;text-align:center;">Próximo Mant.</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="12" style="text-align:center;padding:20px;color:#94a3b8;">No se encontraron registros para los filtros seleccionados.</td></tr>'}
            </tbody>
          </table>
          
          <div style="margin-top:40px;display:flex;justify-content:space-between;font-size:11px;color:#64748b;border-top:1px dashed #cbd5e1;padding-top:15px;">
            <span>ASEPSIS S.A.C. - Sistema de Mantenimiento Preventivo Programado (CMMS)</span>
            <span>Página 1 de 1</span>
          </div>
        </body>
      </html>`;

    const win = window.open('', '_blank');
    if (!win) {
      alert('Por favor, permite las ventanas emergentes para poder imprimir o guardar el reporte en PDF.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 800);
  };

  const handleSort = (field: 'fecha' | 'responsable' | 'equipo' | 'estado' | 'cantidad') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const isViewer = user?.role === 'VIEWER';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin h-10 w-10 text-brand-500" />
        <span className="text-slate-600 font-semibold animate-pulse text-sm">Cargando panel de tareas empresariales...</span>
      </div>
    );
  }

  // Visual variables for visual agrupations in current paginated index
  let lastGroupDate = '';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col transition-all duration-300">
      
      {/* Floating Dark Translucent Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {success && (
          <div className="pointer-events-auto bg-slate-900/95 text-slate-100 border border-slate-750 backdrop-blur-md rounded-2xl p-4.5 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-emerald-500/10 rounded-xl p-1 shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold leading-tight text-white">Éxito</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">{success}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="pointer-events-auto bg-slate-900/95 text-slate-100 border border-slate-750 backdrop-blur-md rounded-2xl p-4.5 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-rose-500/10 rounded-xl p-1 shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold leading-tight text-white">Atención</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Header Banner */}
      <header className="bg-slate-900 text-white shadow-xl shadow-slate-950/10 no-print sticky top-0 z-30">
        <div className="max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-white rounded-xl p-1 shadow-md shrink-0 flex items-center justify-center w-11 h-10 transition-transform hover:scale-105 duration-200">
              <img 
                src="/logo2.jpg" 
                alt="Asepsis Logo" 
                className="h-8 w-auto object-contain rounded-lg"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Mantenimiento</h1>
              <p className="text-[11px] text-slate-400 font-light">Control de Reportes de Mantenimiento</p>
            </div>
          </div>

          {/* Central Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 shrink-0">
            <button
              onClick={() => router.push('/')}
              className="py-1.5 px-4 rounded-xl text-xs font-bold text-white bg-white/10 transition-all cursor-pointer hover:bg-white/15"
            >
              Reporte Semanal
            </button>
            <button
              onClick={() => router.push('/repuestos')}
              className="py-1.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Repuestos
            </button>
            <button
              onClick={() => router.push('/licencias')}
              className="py-1.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Licencias
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl py-1.5 px-3">
                <UserIcon className="w-4 h-4 text-brand-400" />
                <div className="text-left">
                  <p className="text-xs font-bold leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-400 leading-none capitalize mt-0.5">{user.role.toLowerCase()}</p>
                </div>
              </div>
            )}

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/users')}
                className="py-2 px-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-brand-400" />
                <span>Usuarios</span>
              </button>
            )}

            <button
              onClick={handleExportTasksPDF}
              className="py-2 px-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 border border-brand-500/30 text-xs font-bold text-white transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-brand-600/15 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Exportar PDF</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-2xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 transition-all active:scale-95 cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1850px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Actions bar / Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl">Control de Tareas de Mantenimiento</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Supervisión y control integral de actividades mecánicas de planta.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-500 transition-all duration-200 hover:scale-[1.02] active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Crear nueva tarea</span>
          </button>
        </div>

        {/* --- STATS CARDS DASHBOARD HEADER --- */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          {/* Card: TOTAL */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setCurrentPage(1);
            }}
            className={`flex items-center justify-between p-4.5 rounded-2xl border text-left transition-all duration-300 outline-none select-none cursor-pointer w-full group/card ${
              statusFilter === 'ALL'
                ? 'bg-blue-50/25 border-blue-500 shadow-md shadow-blue-500/5 ring-2 ring-blue-500/10 scale-[1.02]'
                : 'bg-white border-slate-100 shadow-xs hover:border-blue-200 hover:scale-[1.02] hover:shadow-sm'
            }`}
          >
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total de Tareas</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight block mt-1">{totalCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Filtradas actualmente</span>
            </div>
            <div className={`rounded-2xl p-3 shrink-0 transition-all duration-300 ${
              statusFilter === 'ALL' ? 'bg-blue-100 text-blue-600 scale-110' : 'bg-blue-50 text-blue-500 group-hover/card:bg-blue-100 group-hover/card:text-blue-600 group-hover/card:scale-110'
            }`}>
              <ClipboardList className="w-6 h-6" />
            </div>
          </button>

          {/* Card: PENDIENTES */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter('PENDIENTE');
              setCurrentPage(1);
            }}
            className={`flex items-center justify-between p-4.5 rounded-2xl border text-left transition-all duration-300 outline-none select-none cursor-pointer w-full group/card ${
              statusFilter === 'PENDIENTE'
                ? 'bg-rose-50/25 border-rose-500 shadow-md shadow-rose-500/5 ring-2 ring-rose-500/10 scale-[1.02]'
                : 'bg-white border-slate-100 shadow-xs hover:border-rose-200 hover:scale-[1.02] hover:shadow-sm'
            }`}
          >
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pendientes</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight block mt-1">{pendientesCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Esperando atención</span>
            </div>
            <div className={`rounded-2xl p-3 shrink-0 transition-all duration-300 ${
              statusFilter === 'PENDIENTE' ? 'bg-rose-100 text-rose-600 scale-110' : 'bg-rose-50 text-rose-500 group-hover/card:bg-rose-100 group-hover/card:text-rose-600 group-hover/card:scale-110'
            }`}>
              <AlertCircle className="w-6 h-6" />
            </div>
          </button>

          {/* Card: EN PROCESO */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter('EN_PROCESO');
              setCurrentPage(1);
            }}
            className={`flex items-center justify-between p-4.5 rounded-2xl border text-left transition-all duration-300 outline-none select-none cursor-pointer w-full group/card ${
              statusFilter === 'EN_PROCESO'
                ? 'bg-amber-50/25 border-amber-500 shadow-md shadow-amber-500/5 ring-2 ring-amber-500/10 scale-[1.02]'
                : 'bg-white border-slate-100 shadow-xs hover:border-amber-200 hover:scale-[1.02] hover:shadow-sm'
            }`}
          >
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">En Proceso</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-500 tracking-tight block mt-1">{enProcesoCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Siendo ejecutadas</span>
            </div>
            <div className={`rounded-2xl p-3 shrink-0 transition-all duration-300 ${
              statusFilter === 'EN_PROCESO' ? 'bg-amber-100 text-amber-600 scale-110' : 'bg-amber-50 text-amber-500 group-hover/card:bg-amber-100 group-hover/card:text-amber-600 group-hover/card:scale-110'
            }`}>
              <TrendingUp className="w-6 h-6" />
            </div>
          </button>

          {/* Card: CULMINADAS */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter('CULMINADO');
              setCurrentPage(1);
            }}
            className={`flex items-center justify-between p-4.5 rounded-2xl border text-left transition-all duration-300 outline-none select-none cursor-pointer w-full group/card ${
              statusFilter === 'CULMINADO'
                ? 'bg-emerald-50/25 border-emerald-500 shadow-md shadow-emerald-500/5 ring-2 ring-emerald-500/10 scale-[1.02]'
                : 'bg-white border-slate-100 shadow-xs hover:border-emerald-200 hover:scale-[1.02] hover:shadow-sm'
            }`}
          >
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Culminadas</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight block mt-1">{culminadasCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Finalizadas con éxito</span>
            </div>
            <div className={`rounded-2xl p-3 shrink-0 transition-all duration-300 ${
              statusFilter === 'CULMINADO' ? 'bg-emerald-100 text-emerald-600 scale-110' : 'bg-emerald-50 text-emerald-500 group-hover/card:bg-emerald-100 group-hover/card:text-emerald-600 group-hover/card:scale-110'
            }`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </button>

        </section>

        {/* --- CMMS PREVENTIVE KPI CARDS --- */}
        <div className="mb-4 flex items-center gap-2">
          <Clock className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Mantenimiento Preventivo Programado (CMMS)</h3>
        </div>
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card: VENCIDOS */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-xs flex items-center justify-between hover:scale-[1.02] transition-all duration-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vencidos</span>
              <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight block mt-1 ${vencidosCount > 0 ? 'text-rose-600' : 'text-slate-750'}`}>{vencidosCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Preventivos fuera de fecha</span>
            </div>
            <div className={`rounded-2xl p-3 shrink-0 ${vencidosCount > 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          {/* Card: PRÓXIMOS 30 DÍAS */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-xs flex items-center justify-between hover:scale-[1.02] transition-all duration-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Próximos 30 días</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 tracking-tight block mt-1">{proximosCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Mantenimientos programados</span>
            </div>
            <div className="bg-indigo-50 text-indigo-500 rounded-2xl p-3 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          {/* Card: ESTA SEMANA */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-xs flex items-center justify-between hover:scale-[1.02] transition-all duration-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Esta Semana</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-violet-600 tracking-tight block mt-1">{estaSemanaCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Siguientes 7 días</span>
            </div>
            <div className="bg-violet-50 text-violet-500 rounded-2xl p-3 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card: ESTE MES */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-xs flex items-center justify-between hover:scale-[1.02] transition-all duration-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Este Mes</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-600 tracking-tight block mt-1">{esteMesCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Mes calendario actual</span>
            </div>
            <div className="bg-cyan-50 text-cyan-500 rounded-2xl p-3 shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* --- DYNAMIC FILTER CARD PANEL --- */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4.5 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4.5 h-4.5 text-brand-500 shrink-0" />
            <h3 className="font-extrabold text-slate-800 text-sm">Filtros y Búsqueda</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Input Calendar: Desde */}
            <div className="md:col-span-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Desde</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); handleSearchTrigger(); }}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl py-2 px-3 pl-10 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Input Calendar: Hasta */}
            <div className="md:col-span-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Hasta</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); handleSearchTrigger(); }}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl py-2 px-3 pl-10 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Quick Multi-column Search */}
            <div className="md:col-span-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Búsqueda rápida</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); handleSearchTrigger(); }}
                  placeholder="Responsable, equipo, falla, descripción..."
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-3 pl-10 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:border-brand-500 focus:bg-white transition-all placeholder-slate-400"
                />
              </div>
            </div>

            {/* Actions Filters Buttons */}
            <div className="md:col-span-2 flex items-end gap-2">
              <button
                type="button"
                onClick={handleSearchTrigger}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all duration-200 active:scale-95 cursor-pointer text-center"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition-all duration-200 cursor-pointer"
                title="Limpiar Filtros"
              >
                <RotateCcw className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Quick Responsable Filter Selector Row */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Filtrar por Responsable:</span>
            <button
              onClick={() => { setSelectedRespFilter(null); handleSearchTrigger(); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                selectedRespFilter === null 
                  ? 'bg-brand-50 text-brand-600 border border-brand-200 font-bold' 
                  : 'bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos
            </button>
            {responsables.slice(0, 10).map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedRespFilter(r.nombre); handleSearchTrigger(); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase cursor-pointer transition-all ${
                  selectedRespFilter === r.nombre 
                    ? 'bg-brand-50 text-brand-600 border border-brand-200 font-bold' 
                    : 'bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                {r.nombre}
              </button>
            ))}
          </div>
        </section>

        {/* --- MAIN MODERN DATA GRID CONTAINER --- */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
          
          {/* Table list header status info */}
          <div className="px-6 py-4.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">Listado de Tareas de Planta</h3>
              {isTableLoading && <Loader2 className="animate-spin h-4 w-4 text-brand-500 shrink-0" />}
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Mostrando <span className="text-slate-800">{totalCount > 0 ? startIndex + 1 : 0}</span> al <span className="text-slate-800">{endIndex}</span> de <span className="text-brand-600 font-bold">{totalCount}</span> registros
            </div>
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm table-auto border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-15">
                  <th className="p-3 pl-6 text-center border-b border-slate-100 w-16">Item</th>
                  <th onClick={() => handleSort('responsable')} className="p-3 text-left border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 select-none">
                    <div className="flex items-center gap-1">
                      <span>Responsable</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('equipo')} className="p-3 text-left border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 select-none">
                    <div className="flex items-center gap-1">
                      <span>Equipo / Máquina</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3 text-left border-b border-slate-100">Sede</th>
                  <th className="p-3 text-left border-b border-slate-100 w-48">Falla Reportada</th>
                  <th className="p-3 text-left border-b border-slate-100">Tipo Mant.</th>
                  <th className="p-3 text-left border-b border-slate-100 w-64">Descripción de Actividad</th>
                  <th className="p-3 text-left border-b border-slate-100">Repuestos</th>
                  <th onClick={() => handleSort('cantidad')} className="p-3 text-center border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 select-none w-20">
                    <div className="flex items-center justify-center gap-1">
                      <span>Cant</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3 text-center border-b border-slate-100 w-32 select-none">Certif. Operatividad</th>
                  <th className="p-3 text-center border-b border-slate-100 w-36 select-none">Fecha Culminado</th>
                  <th onClick={() => handleSort('estado')} className="p-3 text-center border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 select-none w-32">
                    <div className="flex items-center justify-center gap-1">
                      <span>Estado</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3 text-center border-b border-slate-100 w-28 select-none">Frecuencia</th>
                  <th className="p-3 text-center border-b border-slate-100 w-32 select-none">Prox. Mant.</th>
                  <th className="p-3 text-center border-b border-slate-100 w-28 pl-4 pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTareas.length > 0 ? (
                  paginatedTareas.map((t) => {
                    const taskDate = getTaskDate(t);
                    const isNewGroup = taskDate !== lastGroupDate;
                    lastGroupDate = taskDate;

                    const itemIndex = computedItemNumbers[t.id] || t.itemNumber || 1;
                    const delayed = isTaskDelayed(t);
                    const isOverdue = t.estado !== 'CULMINADO' && t.estado !== 'HECHO' && t.fecha && getDaysDiff(todayStr, t.fecha) < 0;

                    return (
                      <>
                        {/* Interactive Group Date Sub-header Dividers */}
                        {isNewGroup && (
                          <tr key={`group-${taskDate}`} className="bg-slate-100/40 select-none">
                            <td colSpan={13} className="p-2.5 pl-6 border-b border-slate-200">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="text-xs font-bold text-slate-700">{formatFriendlyDate(taskDate)}</span>
                                <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {sortedTareas.filter(x => getTaskDate(x) === taskDate).length} Tareas
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}

                        <tr 
                          key={t.id} 
                          className={`hover:bg-slate-50/65 border-b border-slate-100 transition-colors duration-150 group/row ${
                            isOverdue 
                              ? 'bg-rose-500/[0.03] border-l-4 border-l-rose-500' 
                              : delayed 
                              ? 'bg-rose-50/20 border-l-4 border-l-rose-500' 
                              : ''
                          }`}
                        >
                          {/* Item correlative inside day */}
                          <td className="p-3 text-center font-bold text-slate-700 border-b border-slate-100 select-none">
                            <div className="flex items-center justify-center gap-1">
                              {isOverdue && <span className="text-rose-500 text-xs animate-bounce" title="¡Mantenimiento Vencido!">⚠️</span>}
                              <span>{itemIndex}</span>
                            </div>
                          </td>
                          <td className="p-3 border-b border-slate-100 font-semibold text-slate-900 uppercase text-xs">
                            {t.responsable}
                          </td>
                          <td className="p-3 border-b border-slate-100 font-extrabold text-slate-800 uppercase text-xs">
                            {t.equipo || '-'}
                          </td>
                          <td className="p-3 border-b border-slate-100">
                            <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase">
                              {t.sede || '-'}
                            </span>
                          </td>
                          <td className="p-3 border-b border-slate-100 text-xs text-rose-750 font-medium truncate-2-lines line-clamp-2 max-w-[200px]" title={t.falla || ''}>
                            {t.falla || '-'}
                          </td>
                          <td className="p-3 border-b border-slate-100 text-xs font-semibold text-slate-600 uppercase">
                            {t.tipo || '-'}
                          </td>
                          <td className="p-3 border-b border-slate-100 text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                            {t.descripcion}
                          </td>
                          <td className="p-3 border-b border-slate-100 text-xs text-slate-600 italic">
                            {t.repuestos || '-'}
                          </td>
                          <td className="p-3 text-center border-b border-slate-100 font-semibold text-slate-700">
                            {t.cantidad || '-'}
                          </td>

                          {/* Certificado de Operatividad Column */}
                          <td className="p-3 text-center border-b border-slate-100 select-none">
                            <div className="flex items-center justify-center">
                              {uploadingTaskId === t.id ? (
                                <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                              ) : t.certificadoPath ? (
                                <a
                                  href={`/api/tareas/archivo?id=${t.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-50 border border-sky-200 hover:bg-sky-100 hover:border-sky-300 text-sky-700 text-[10px] font-bold rounded-full shadow-xs transition-colors cursor-pointer"
                                >
                                  <span>👁️ Ver archivo</span>
                                </a>
                              ) : (
                                <div>
                                  <input
                                    type="file"
                                    id={`file-input-${t.id}`}
                                    accept=".pdf,image/jpeg,image/png"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleUploadCertificado(t.id, file);
                                    }}
                                  />
                                  <label
                                    htmlFor={`file-input-${t.id}`}
                                    className="inline-flex items-center justify-center p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-600 transition-all duration-150 active:scale-90 cursor-pointer"
                                    title="Subir Certificado (PDF/JPG/PNG)"
                                  >
                                    <span className="text-sm font-semibold">📎</span>
                                  </label>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Fecha Culminado (Inline Datepicker) Column */}
                          <td className="p-3 text-center border-b border-slate-100">
                            <div className="flex items-center justify-center">
                              {editingDateId === t.id ? (
                                <input
                                  type="date"
                                  autoFocus
                                  defaultValue={t.fechaCulminado || ''}
                                  onBlur={(e) => handleUpdateFechaCulminado(t.id, e.target.value)}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleUpdateFechaCulminado(t.id, e.target.value);
                                    }
                                  }}
                                  className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-brand-500 font-semibold"
                                />
                              ) : (
                                <span
                                  onClick={() => !isViewer && setEditingDateId(t.id)}
                                  className={`px-2 py-1 border border-transparent rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition-all duration-150 ${
                                    isViewer ? '' : 'hover:border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {t.fechaCulminado ? formatSmallDate(t.fechaCulminado) : '--/--/----'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Modern Badge State Column */}
                          <td className="p-3 text-center border-b border-slate-100 select-none">
                            <div className="flex flex-col items-center gap-1.5 justify-center">
                              {t.estado === 'PENDIENTE' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-full shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                  <span>PENDIENTE</span>
                                </span>
                              )}
                              {t.estado === 'EN_PROCESO' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-55 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-full shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  <span>EN PROCESO</span>
                                </span>
                              )}
                              {(t.estado === 'CULMINADO' || t.estado === 'HECHO') && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-full shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>CULMINADO</span>
                                </span>
                              )}

                              {/* Task aging indicator alert */}
                              {delayed && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-rose-600 bg-rose-100/40 px-1.5 py-0.5 rounded-md border border-rose-200 animate-pulse" title="Esta tarea ha estado pendiente por más de 7 días. Requiere atención prioritaria.">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                                  <span>ENVEJECIDO &gt;7d</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Frecuencia badge */}
                          <td className="p-3 text-center border-b border-slate-100 select-none">
                            {t.frecuenciaMeses ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full shadow-xs">
                                🔄 {t.frecuenciaMeses} {t.frecuenciaMeses === 1 ? 'Mes' : 'Meses'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-semibold rounded-full">
                                Única
                              </span>
                            )}
                          </td>

                          {/* Próximo Mantenimiento Badge */}
                          <td className="p-3 text-center border-b border-slate-100 select-none">
                            {renderProximoBadge(t)}
                          </td>

                          {/* Action Icon buttons with Tooltips */}
                          <td className="p-3 text-center border-b border-slate-100 pr-6 pl-4 select-none">
                            <div className="flex items-center justify-center gap-1.5">
                              {!isViewer && (
                                <div className="relative group/tooltip">
                                  <button
                                    onClick={() => { setEditingTask(t); setIsTaskModalOpen(true); }}
                                    className="p-1.5 rounded-xl border border-sky-100 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 transition-all duration-150 active:scale-90 cursor-pointer"
                                    title="Editar Tarea"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-md">
                                    Editar Tarea
                                  </div>
                                </div>
                              )}
                              {!isViewer && (
                                <div className="relative group/tooltip">
                                  <button
                                    onClick={() => setConfirmDeleteId(t.id)}
                                    className="p-1.5 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-all duration-150 active:scale-90 cursor-pointer"
                                    title="Eliminar Tarea"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-md">
                                    Eliminar Tarea
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      </>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="p-10 text-center text-slate-400 font-semibold bg-slate-50/20">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                        <p className="text-sm">No se encontraron tareas registradas con los filtros seleccionados.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TABLET / MOBILE RESPONSIVE CARDS VIEW */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {paginatedTareas.length > 0 ? (
              paginatedTareas.map((t) => {
                const itemIndex = computedItemNumbers[t.id] || t.itemNumber || 1;
                const delayed = isTaskDelayed(t);
                const isOverdue = t.estado !== 'CULMINADO' && t.estado !== 'HECHO' && t.fecha && getDaysDiff(todayStr, t.fecha) < 0;

                return (
                  <div 
                    key={`mobile-${t.id}`} 
                    className={`p-4 hover:bg-slate-50/50 transition-colors ${
                      isOverdue 
                        ? 'bg-rose-500/[0.02] border-l-4 border-l-rose-500' 
                        : delayed 
                        ? 'bg-rose-50/10 border-l-4 border-l-rose-500' 
                        : ''
                    }`}
                  >
                    {/* Header: Date and Item badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-extrabold text-slate-700">
                          #{itemIndex}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {formatSmallDate(getTaskDate(t))}
                        </span>
                      </div>
                      
                      {/* State badge */}
                      <div className="shrink-0">
                        {t.estado === 'PENDIENTE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            <span>PENDIENTE</span>
                          </span>
                        )}
                        {t.estado === 'EN_PROCESO' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-55 border border-amber-200 text-amber-800 text-[10px] font-bold rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>EN PROCESO</span>
                          </span>
                        )}
                        {(t.estado === 'CULMINADO' || t.estado === 'HECHO') && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>CULMINADO</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Responsable & Team */}
                    <p className="text-xs font-bold text-slate-900 uppercase">
                      {t.responsable} • <span className="text-brand-600 font-extrabold">{t.equipo || 'Sin Equipo'}</span>
                    </p>

                    {/* Work description */}
                    <p className="text-xs text-slate-700 mt-2 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {t.descripcion}
                    </p>

                    {/* Secondary details */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2.5 text-[11px]">
                      {t.falla && (
                        <div className="col-span-2 text-rose-700">
                          <span className="font-bold">Falla:</span> {t.falla}
                        </div>
                      )}
                      {t.tipo && (
                        <div>
                          <span className="text-slate-400">Tipo:</span> <span className="font-semibold text-slate-700">{t.tipo}</span>
                        </div>
                      )}
                      {t.sede && (
                        <div>
                          <span className="text-slate-400">Sede:</span> <span className="font-semibold text-slate-700 uppercase">{t.sede}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">Frecuencia:</span>{' '}
                        <span className="font-semibold text-slate-700">
                          {t.frecuenciaMeses ? `🔄 ${t.frecuenciaMeses} M` : 'Única'}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 mt-1">
                        <span className="text-slate-400">Próximo:</span>
                        {renderProximoBadge(t)}
                      </div>
                      {t.repuestos && (
                        <div className="col-span-2 text-slate-600 italic mt-1">
                          <span className="text-slate-400 font-normal">Repuestos:</span> {t.repuestos} (Cant: {t.cantidad || '0'})
                        </div>
                      )}
                    </div>

                    {/* Action buttons footer */}
                    <div className="flex items-center justify-between border-t border-slate-100/70 mt-3 pt-3">
                      <div>
                        {delayed && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                            <span>ENVEJECIDO &gt;7d</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {!isViewer && (
                          <button
                            onClick={() => { setEditingTask(t); setIsTaskModalOpen(true); }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 p-1 px-2.5 rounded-lg hover:bg-sky-50 active:scale-95 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                        )}
                        {!isViewer && (
                          <button
                            onClick={() => setConfirmDeleteId(t.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 p-1 px-2.5 rounded-lg hover:bg-rose-50 active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 font-semibold">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs">No se encontraron tareas registradas con los filtros seleccionados.</p>
              </div>
            )}
          </div>

          {/* --- MODERN PAGINATION CONTROLS BAR --- */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
            
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg p-1 px-2 focus:outline-none focus:border-brand-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-xs text-slate-500 font-medium">registros</span>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                
                {/* Button First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Primera página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Button Previous Page */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Indices List */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((idx) => {
                  // Only show current page, plus/minus 1 adjacent pages for compact visual rendering
                  const show = idx === 1 || idx === totalPages || Math.abs(idx - currentPage) <= 1;
                  if (!show) {
                    if (idx === 2 || idx === totalPages - 1) {
                      return <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-slate-400">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        idx === currentPage
                          ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/10'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-800'
                      }`}
                    >
                      {idx}
                    </button>
                  );
                })}

                {/* Button Next Page */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Button Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Última página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>

              </div>
            )}

          </div>

        </section>

      </main>

      {/* --- MODALS & DIALOGS --- */}

      {/* Task Modal (Create & Edit) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        title={editingTask ? 'Editar Tarea' : 'Crear Nueva Tarea'}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
      >
        <TaskForm
          responsables={responsables}
          existingEquipos={Array.from(
            new Set(
              tareas
                .map((t) => t.equipo)
                .filter((e): e is string => typeof e === 'string' && e.trim() !== '')
            )
          )}
          initialValues={
            editingTask
              ? {
                  responsable: editingTask.responsable,
                  descripcion: editingTask.descripcion,
                  estado: editingTask.estado,
                  itemNumber: editingTask.itemNumber ?? '',
                  fecha: editingTask.fecha ?? '',
                  equipo: editingTask.equipo ?? '',
                  sede: editingTask.sede ?? '',
                  falla: editingTask.falla ?? '',
                  tipo: editingTask.tipo ?? '',
                  repuestos: editingTask.repuestos ?? '',
                  cantidad: editingTask.cantidad ?? '',
                  frecuenciaMeses: editingTask.frecuenciaMeses,
                  esRecurrente: editingTask.esRecurrente ?? true
                }
              : selectedRespFilter
              ? {
                  responsable: selectedRespFilter,
                  descripcion: '',
                  estado: 'PENDIENTE',
                  itemNumber: '',
                  fecha: '',
                  equipo: '',
                  sede: '',
                  falla: '',
                  tipo: '',
                  repuestos: '',
                  cantidad: '',
                  frecuenciaMeses: null,
                  esRecurrente: true
                }
              : undefined
          }
          onSubmit={handleCreateOrUpdateTask}
          onCancel={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          isSubmitting={isSubmitting}
        />
      </TaskModal>

      {/* Rename Responsible Modal */}
      <TaskModal
        isOpen={isRenameModalOpen}
        title="Renombrar Responsable"
        onClose={() => {
          setIsRenameModalOpen(false);
          setRenamingResp(null);
        }}
      >
        <form onSubmit={handleRenameResponsible} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Nombre</label>
            <input
              type="text"
              value={newRenamedName}
              onChange={(e) => setNewRenamedName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 hover:border-white/20 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:outline-none focus:border-brand-500 uppercase font-medium"
              placeholder="Nombre del responsable"
              required
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRenameModalOpen(false);
                setRenamingResp(null);
              }}
              className="py-2 px-4 rounded-xl hover:bg-white/5 border border-white/10 text-xs font-semibold text-slate-400 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </TaskModal>

      {/* PREMIUM CUSTOM CONFIRMATION MODALS (SWEETALERT2-STYLE) */}

      {/* Task Delete Confirmation Overlay Modal */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <div 
            onClick={() => setConfirmDeleteId(null)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
          />
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6.5 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-rose-50 text-rose-500 rounded-full p-4 mb-4 shrink-0">
                <AlertTriangle className="w-7 h-7 animate-pulse" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">¿Confirmar Eliminación?</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mt-2">
                ¿Está seguro de que desea eliminar permanentemente esta tarea? Esta acción es definitiva y no podrá revertirse bajo ninguna circunstancia.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              >
                No, Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-rose-600/15"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsible Delete Confirmation Overlay Modal */}
      {confirmDeleteRespId !== null && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <div 
            onClick={() => setConfirmDeleteRespId(null)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
          />
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6.5 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-rose-50 text-rose-500 rounded-full p-4 mb-4 shrink-0">
                <AlertTriangle className="w-7 h-7 animate-pulse" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">¿Eliminar Responsable?</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mt-2">
                ¿Está seguro de que desea eliminar este responsable? Las tareas asignadas a esta persona se conservarán intactas, pero dejarán de figurar asociadas a este registro.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteRespId(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              >
                No, Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteResponsible}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-rose-600/15"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
