'use client';

import { useState, useEffect, useRef } from 'react';
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
  X,
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
  horaInicio?: number | null;
  frecuenciaHrs?: number | null;
  proximoMantenimientoHrs?: number | null;
}

interface Responsable {
  id: string;
  nombre: string;
}

const DAYS_OF_WEEK = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

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
  const [selectedEquipoFilter, setSelectedEquipoFilter] = useState<string | null>(null);
  const [selectedSedeFilter, setSelectedSedeFilter] = useState<'Lima' | 'Trujillo' | null>(null);
  const [selectedResponsableFilter, setSelectedResponsableFilter] = useState<string | null>(null);
  const [selectedTipoFilter, setSelectedTipoFilter] = useState<string | null>(null);
  const [selectedDocFilter, setSelectedDocFilter] = useState<'ALL' | 'CON_DOC' | 'SIN_DOC'>('ALL');
  const [selectedFrecuenciaFilter, setSelectedFrecuenciaFilter] = useState<string | null>(null);

  const equipoOptions = Array.from(
    new Set(
      tareas
        .flatMap((t) => {
          const eq = t.equipo;
          if (!eq) return [];
          if (eq.includes(' | ')) {
            return eq.split(' | ').map(s => s.trim());
          }
          return [eq.trim()];
        })
        .filter((e): e is string => typeof e === 'string' && e.trim() !== '')
    )
  ).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base', numeric: true }));

  const responsableOptions = Array.from(
    new Set(
      tareas
        .map((t) => t.responsable)
        .filter((r): r is string => typeof r === 'string' && r.trim() !== '')
    )
  ).sort((a, b) => a.localeCompare(b));

  const tipoOptions = Array.from(
    new Set([
      'PREVENTIVO', 'CORRECTIVO', 'PREDICTIVO',
      ...tareas.map((t) => (t.tipo || '').toUpperCase()).filter(Boolean)
    ])
  ).sort((a, b) => a.localeCompare(b));

  const frecuenciaOptions = Array.from(
    new Set([
      '1', '2', '3', '4', '6', '12',
      ...tareas
        .map((t) => t.frecuenciaMeses)
        .filter((f): f is number => f !== null && f !== undefined)
        .map(f => String(f))
    ])
  ).sort((a, b) => Number(a) - Number(b));

  const [searchRespQuery, setSearchRespQuery] = useState('');
  const [newRespName, setNewRespName] = useState('');

  // Advanced Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDIENTE' | 'EN_PROCESO' | 'CULMINADO'>('ALL');
  const [quickRange, setQuickRange] = useState<string>('ALL');

  // Sorting
  const [sortField, setSortField] = useState<'fecha' | 'responsable' | 'equipo' | 'estado' | 'cantidad'>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isPremiumDarkMode, setIsPremiumDarkMode] = useState(false);

  // Modal control states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Tarea | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<string>('');
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth());
  const editContainerRef = useRef<HTMLDivElement | null>(null);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [isMultiUploadOpen, setIsMultiUploadOpen] = useState(false);
  const [multiUploadTaskId, setMultiUploadTaskId] = useState<string | null>(null);
  const [multiUploadSlots, setMultiUploadSlots] = useState<{ name: string, file: File | null }[]>([
    { name: 'Certificado 1', file: null },
    { name: 'Certificado 2', file: null },
    { name: 'Certificado 3', file: null },
    { name: 'Certificado 4', file: null },
  ]);
  const [multiUploadHistoryFiles, setMultiUploadHistoryFiles] = useState<any[]>([]);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteRespId, setConfirmDeleteRespId] = useState<string | null>(null);

  // Click outside handling for inline date picker
  useEffect(() => {
    if (!editingDateId) return;
    const handleDocumentClick = (e: MouseEvent) => {
      // Ignore clicks on body/html because Chrome native datepicker overlay clicks are reported as body/html
      if (e.target === document.body || e.target === document.documentElement) {
        return;
      }
      if (editContainerRef.current && !editContainerRef.current.contains(e.target as Node)) {
        setEditingDateId(null);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [editingDateId]);

  // Files modal (historial)
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [modalFiles, setModalFiles] = useState<any[]>([]);
  const [activeHistoryTaskId, setActiveHistoryTaskId] = useState<string | null>(null);
  const [modalLoadingFiles, setModalLoadingFiles] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [previewExt, setPreviewExt] = useState<string | null>(null);

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

  const fetchResponsables = async () => {
    try {
      const res = await fetch('/api/responsables');
      const data = await res.json();
      if (res.ok && data.success) {
        setResponsables(data.responsables);
      }
    } catch (err) {
      console.error('Error fetching responsables:', err);
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

  // Open files modal and fetch history
  const openFilesModal = async (tareaId: string) => {
    setActiveHistoryTaskId(tareaId);
    setModalLoadingFiles(true);
    try {
      const res = await fetch(`/api/tareas/archivo?id=${encodeURIComponent(tareaId)}&list=true`);
      const data = await res.json();
      if (res.ok && data.success) {
        setModalFiles(data.files || []);
        setFilesModalOpen(true);
      } else {
        showFeedback('error', data.error || 'No se pudo obtener historial de archivos');
      }
    } catch (err) {
      showFeedback('error', 'Error de red al solicitar historial');
    } finally {
      setModalLoadingFiles(false);
    }
  };

  const openMultiUploadModal = async (tareaId: string) => {
    setMultiUploadTaskId(tareaId);
    setMultiUploadSlots([
      { name: 'Certificado 1', file: null },
      { name: 'Certificado 2', file: null },
      { name: 'Certificado 3', file: null },
      { name: 'Certificado 4', file: null },
    ]);
    setMultiUploadHistoryFiles([]);
    setIsMultiUploadOpen(true);
    try {
      const res = await fetch(`/api/tareas/archivo?id=${encodeURIComponent(tareaId)}&list=true`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMultiUploadHistoryFiles(data.files || []);
      }
    } catch (err) {
      console.error('Error al precargar archivos para multi-upload:', err);
    }
  };

  const handleDeleteHistoryFile = async (fileId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este archivo del historial?')) return;
    try {
      const res = await fetch(`/api/tareas/archivo?id=${encodeURIComponent(fileId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', 'Archivo eliminado con éxito.');
        // Re-load history files
        if (activeHistoryTaskId) {
          openFilesModal(activeHistoryTaskId);
        }
        // Re-load main dashboard tasks to update active certificate status
        fetchData();
      } else {
        showFeedback('error', data.error || 'No se pudo eliminar el archivo');
      }
    } catch (err) {
      showFeedback('error', 'Error de red al intentar eliminar el archivo');
    }
  };

  const openPreview = (fileName: string | undefined, originalName?: string) => {
    if (!fileName) return;
    const url = `/api/tareas/archivo?file=${encodeURIComponent(fileName)}`;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    setPreviewUrl(url);
    setPreviewName(originalName || fileName);
    setPreviewExt(ext);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewUrl(null);
    setPreviewName(null);
    setPreviewExt(null);
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
          await fetchResponsables();
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
          await fetchResponsables();
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

  const handleMultiUpload = async () => {
    if (!multiUploadTaskId) return;
    const filesToUpload = multiUploadSlots.filter(s => s.file !== null);
    if (filesToUpload.length === 0) {
      showFeedback('error', 'Por favor seleccione al menos un archivo.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Validar límite máximo de 4 archivos
      const checkRes = await fetch(`/api/tareas/archivo?id=${encodeURIComponent(multiUploadTaskId)}&list=true`);
      const checkData = await checkRes.json();
      const existingCount = checkData.success ? (checkData.files || []).length : 0;

      if (existingCount + filesToUpload.length > 4) {
        throw new Error(`Esta tarea ya tiene ${existingCount} archivos en su historial. No puedes subir ${filesToUpload.length} más ya que superaría el límite máximo de 4 archivos por tarea. Elimina algunos en la papelera para continuar.`);
      }

      for (const slot of filesToUpload) {
        if (!slot.file) continue;
        const formData = new FormData();
        formData.append('file', slot.file);
        formData.append('id', multiUploadTaskId);
        formData.append('customName', slot.name);

        const res = await fetch('/api/tareas/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error subiendo uno de los archivos');
        }
      }

      // Refresh data
      const res = await fetch(`/api/tareas/${multiUploadTaskId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTareas(prev => prev.map(t => t.id === multiUploadTaskId ? data.tarea : t));
      }

      showFeedback('success', 'Todos los archivos han sido cargados.');
      setIsMultiUploadOpen(false);
    } catch (err: any) {
      showFeedback('error', err.message || 'Error en la subida múltiple');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFechaCulminado = async (taskId: string, val: string) => {
    setEditingDateId(null);
    setIsTableLoading(true);

    try {
      const res = await fetch(`/api/tareas/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fechaCulminado: val,
          ...(val ? { estado: 'CULMINADO' } : {})
        })
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
  }, [fromDate, toDate, searchTerm, selectedEquipoFilter, pageSize]);

  // Extract task date in YYYY-MM-DD format
  const getTaskDate = (t: Tarea) => {
    if (t.fechaCulminado && (t.estado === 'CULMINADO' || t.estado === 'HECHO')) {
      return t.fechaCulminado;
    }
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
    // Si es una compresora, mostrar las horas
    if (t.equipo && (t.equipo.toUpperCase().includes('COMPRESOR') || t.equipo.toUpperCase().includes('COMPRESORA'))) {
      if (t.proximoMantenimientoHrs !== null && t.proximoMantenimientoHrs !== undefined) {
        return (
          <span className={`font-semibold text-xs select-none transition-colors duration-300 ${
            isPremiumDarkMode ? 'text-indigo-400' : 'text-indigo-700'
          }`}>
            {t.proximoMantenimientoHrs} Hrs
          </span>
        );
      }
      return (
        <span className={`font-light text-xs transition-colors duration-300 ${
          isPremiumDarkMode ? 'text-slate-500' : 'text-slate-400'
        }`}>-</span>
      );
    }

    // Si la frecuencia es única, el próximo mantenimiento siempre es sin recurrencia
    if (!t.frecuenciaMeses || t.esRecurrente === false) {
      return (
        <span className={`font-medium text-xs select-none transition-colors duration-300 ${
          isPremiumDarkMode ? 'text-slate-500' : 'text-slate-400'
        }`}>
          Sin recurrencia
        </span>
      );
    }

    // 1. Si la tarea tiene una fecha de culminación explícita
    if (t.fechaCulminado) {
      const targetDate = addMonths(t.fechaCulminado, t.frecuenciaMeses);
      const diff = getDaysDiff(todayStr, targetDate);
      const tooltipText = `Próximo mantenimiento: ${formatSmallDate(targetDate)}`;

      if (diff < 0) {
        const absDiff = Math.abs(diff);
        return (
          <div className="relative group/badge inline-block select-none cursor-help" title={tooltipText}>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-full border transition-colors ${
              isPremiumDarkMode
                ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isPremiumDarkMode ? 'bg-rose-500' : 'bg-rose-600'}`}></span>
              <span>Vence hace {absDiff} d</span>
            </span>
          </div>
        );
      } else {
        return (
          <span className={`font-medium text-xs select-none transition-colors duration-300 ${
            isPremiumDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`} title={tooltipText}>
            {formatSmallDate(targetDate)}
          </span>
        );
      }
    }

    // 2. Si es una tarea ya culminada pero sin fechaCulminado (fallback heredado)
    const isCompleted = t.estado === 'CULMINADO' || t.estado === 'HECHO';
    if (isCompleted) {
      const targetDate = t.proximaEjecucion;
      if (!targetDate) {
        return <span className={`font-light text-xs transition-colors duration-300 ${
          isPremiumDarkMode ? 'text-slate-500' : 'text-slate-400'
        }`}>-</span>;
      }
      const diff = getDaysDiff(todayStr, targetDate);
      const tooltipText = `Próximo mantenimiento: ${formatSmallDate(targetDate)}`;

      if (diff < 0) {
        const absDiff = Math.abs(diff);
        return (
          <div className="relative group/badge inline-block select-none cursor-help" title={tooltipText}>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-full border transition-colors ${
              isPremiumDarkMode
                ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isPremiumDarkMode ? 'bg-rose-500' : 'bg-rose-600'}`}></span>
              <span>Vence hace {absDiff} d</span>
            </span>
          </div>
        );
      } else {
        return (
          <span className={`font-medium text-xs select-none transition-colors duration-300 ${
            isPremiumDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`} title={tooltipText}>
            {formatSmallDate(targetDate)}
          </span>
        );
      }
    }

    // 3. Tareas pendientes o en proceso sin fecha de culminación (usa fecha de planificación t.fecha)
    const targetDate = t.fecha;
    if (!targetDate) {
      return <span className={`font-light text-xs transition-colors duration-300 ${
        isPremiumDarkMode ? 'text-slate-500' : 'text-slate-400'
      }`}>-</span>;
    }

    const diff = getDaysDiff(todayStr, targetDate);
    const tooltipText = `Próximo mantenimiento: ${formatSmallDate(targetDate)}`;

    if (diff < 0) {
      const absDiff = Math.abs(diff);
      return (
        <div className="relative group/badge inline-block select-none cursor-help" title={tooltipText}>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-full border transition-colors ${
            isPremiumDarkMode
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPremiumDarkMode ? 'bg-rose-500' : 'bg-rose-600'}`}></span>
            <span>Vence hace {absDiff} d</span>
          </span>
        </div>
      );
    } else {
      return (
        <span className={`font-medium text-xs select-none transition-colors duration-300 ${
          isPremiumDarkMode ? 'text-slate-300' : 'text-slate-600'
        }`} title={tooltipText}>
          {formatSmallDate(targetDate)}
        </span>
      );
    }
  };

  // Filter computation
  const filteredTareas = tareas.filter(t => {
    // Equipo/Máquina filter
    if (selectedEquipoFilter) {
      const eqLower = (t.equipo || '').toLowerCase();
      const filterLower = selectedEquipoFilter.toLowerCase();
      const isMatch = eqLower === filterLower || 
        eqLower.split(' | ').map(s => s.trim()).includes(filterLower);
      
      if (!isMatch) return false;
    }

    // Sede filter
    if (selectedSedeFilter && (t.sede || '').toLowerCase() !== selectedSedeFilter.toLowerCase()) {
      return false;
    }

    // Responsable filter
    if (selectedResponsableFilter && (t.responsable || '').toLowerCase() !== selectedResponsableFilter.toLowerCase()) {
      return false;
    }

    // Tipo filter
    if (selectedTipoFilter && (t.tipo || '').toLowerCase() !== selectedTipoFilter.toLowerCase()) {
      return false;
    }

    // Document filter
    if (selectedDocFilter === 'CON_DOC' && !t.certificadoPath) return false;
    if (selectedDocFilter === 'SIN_DOC' && t.certificadoPath) return false;

    // Frecuencia filter
    if (selectedFrecuenciaFilter) {
      if (selectedFrecuenciaFilter === 'UNICA' && t.frecuenciaMeses !== null) return false;
      if (selectedFrecuenciaFilter === 'RECURRENTE' && t.frecuenciaMeses === null) return false;
      if (!['UNICA', 'RECURRENTE'].includes(selectedFrecuenciaFilter) && String(t.frecuenciaMeses) !== selectedFrecuenciaFilter) return false;
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
  const conDocsProximosCount = filteredTareas.filter(t => t.fecha && getDaysDiff(todayStr, t.fecha) >= 0 && getDaysDiff(todayStr, t.fecha) <= 30 && t.certificadoPath).length;
  const sinDocsProximosCount = filteredTareas.filter(t => t.fecha && getDaysDiff(todayStr, t.fecha) >= 0 && getDaysDiff(todayStr, t.fecha) <= 30 && !t.certificadoPath).length;
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

    // Secondary sort: itemNumber DESCENDING or creation date DESCENDING
    if (sortField !== 'fecha') {
      const dateA = getTaskDate(a);
      const dateB = getTaskDate(b);
      if (dateA !== dateB) return dateA > dateB ? -1 : 1;
    }
    const itemA = a.itemNumber || 0;
    const itemB = b.itemNumber || 0;
    if (itemA !== itemB) {
      return itemB - itemA; // Descending itemNumber
    }
    return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime(); // Descending creation date
  });

  // Stable monthly correlatives computation starting from 1 up to N (render-time sequential)
  // Maps task.id to its index within its month group (YYYY-MM)
  const getStableItemNumbers = () => {
    const groups: Record<string, string[]> = {};
    
    // Group all task IDs by month
    sortedTareas.forEach(t => {
      const d = getTaskDate(t);
      if (d) {
        const monthStr = d.substring(0, 7);
        if (!groups[monthStr]) groups[monthStr] = [];
        groups[monthStr].push(t.id);
      }
    });

    const itemMap: Record<string, number> = {};
    Object.keys(groups).forEach(monthStr => {
      // Sort tasks within this month descending (newest first) to keep order stable
      const monthTasks = groups[monthStr].map(id => tareas.find(x => x.id === id)!);
      monthTasks.sort((a, b) => {
        const dateA = getTaskDate(a);
        const dateB = getTaskDate(b);
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA); // Newest date first
        }
        const itemA = a.itemNumber || 0;
        const itemB = b.itemNumber || 0;
        if (itemA !== itemB) {
          return itemB - itemA; // Highest original itemNumber first
        }
        return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime(); // Newest creation date first
      });

      monthTasks.forEach((t, idx) => {
        itemMap[t.id] = monthTasks.length - idx; // Ascending chronological monthly count (1, 2, 3, ..., N)
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

  const handleQuickRangeChange = (range: string) => {
    setQuickRange(range);
    if (range === 'ALL') {
      setFromDate('');
      setToDate('');
      handleSearchTrigger();
      return;
    }

    const today = new Date();
    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (range === 'ESTA_SEMANA') {
      const currentDay = today.getDay(); // 0: Sunday, 1: Monday...
      const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + daysToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      setFromDate(formatDate(monday));
      setToDate(formatDate(sunday));
    } else if (range === 'SEMANA_PASADA') {
      const currentDay = today.getDay();
      const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + daysToMonday - 7);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      setFromDate(formatDate(monday));
      setToDate(formatDate(sunday));
    } else if (range === 'ESTE_MES') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      setFromDate(formatDate(firstDay));
      setToDate(formatDate(lastDay));
    } else if (range === 'MES_PASADO') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);

      setFromDate(formatDate(firstDay));
      setToDate(formatDate(lastDay));
    }
    handleSearchTrigger();
  };

  // Clear all advanced date filters and search terms
  const handleClearFilters = () => {
    setIsTableLoading(true);
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setSelectedEquipoFilter(null);
    setSelectedSedeFilter(null);
    setSelectedResponsableFilter(null);
    setSelectedTipoFilter(null);
    setSelectedDocFilter('ALL');
    setSelectedFrecuenciaFilter(null);
    setStatusFilter('ALL');
    setQuickRange('ALL');
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
          <td colspan="9" style="padding:8px; border:1px solid #cbd5e1; font-size:10px; color:#1e293b;">
            📅 ${formatFriendlyDate(currDate)} (${sortedTareas.filter(x => getTaskDate(x) === currDate).length} tareas)
          </td>
        </tr>
      ` : '';

      const stateBadge = t.estado === 'PENDIENTE' ? '<span style="background-color:#ffe4e6;color:#9f1239;padding:2px 6px;border-radius:10px;font-weight:bold;font-size:10px;">Pendiente</span>' :
                         t.estado === 'EN_PROCESO' ? '<span style="background-color:#fef3c7;color:#92400e;padding:2px 6px;border-radius:10px;font-weight:bold;font-size:10px;">En Proceso</span>' :
                         '<span style="background-color:#d1fae5;color:#065f46;padding:2px 6px;border-radius:10px;font-weight:bold;font-size:10px;">Culminado</span>';

      const targetDate = (t.estado === 'CULMINADO' || t.estado === 'HECHO') ? t.proximaEjecucion : t.fecha;
      const proximoText = targetDate ? formatSmallDate(targetDate) : '-';
      const frecuenciaText = t.frecuenciaMeses ? `${t.frecuenciaMeses} ${t.frecuenciaMeses === 1 ? 'Mes' : 'Meses'}` : 'Única';

      return `
        ${headerRow}
        <tr>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:9px;text-align:center;font-weight:bold;">${itemNum}</td>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:9px;font-weight:600;">${escapeHtml(t.responsable)}</td>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:9px;"><strong>${escapeHtml(t.equipo || '')}</strong></td>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:9px;color:#b91c1c;">${escapeHtml(t.falla || '-')}</td>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:9px;"><strong>${escapeHtml(t.tipo || '')}</strong><br/>${escapeHtml(t.descripcion)}</td>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:9px;text-align:center;">${t.fechaCulminado ? formatSmallDate(t.fechaCulminado) : '-'}</td>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:9px;text-align:center;">${stateBadge}</td>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:9px;text-align:center;">${escapeHtml(frecuenciaText)}</td>
          <td style="padding:6px;border:1px solid #e2e8f0;font-size:9px;text-align:center;font-weight:500;">${escapeHtml(proximoText)}</td>
        </tr>
      `;
    }).join('\n');

    const activeRangeText = fromDate || toDate 
      ? `Período: ${fromDate ? formatSmallDate(fromDate) : 'Inicio'} hasta ${toDate ? formatSmallDate(toDate) : 'Fin'}`
      : '';

    const activeSearchText = searchTerm.trim() ? `Búsqueda: "${escapeHtml(searchTerm)}"` : '';
    const activeEquipoText = selectedEquipoFilter ? `Filtrado por equipo/máquina: ${escapeHtml(selectedEquipoFilter)}` : '';

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Control de Reportes de Mantenimiento - Export PDF</title>
          <style>
            @media print {
              @page { size: 29cm 21cm; margin: 2mm; }
              body { margin: 0; }
              /* KPI boxes: destacar un poco más para legibilidad en el header */
              .kpi-row { gap: 4px; }
              .kpi-box { min-width: 72px; padding: 4px 6px; }
              .kpi-title { font-size: 7px; }
              .kpi-num { font-size: 12px; font-weight: 700; }

              /* Tabla: reducir ligeramente la fuente y el padding para ganar espacio */
              th { padding: 2px 4px; font-size: 8px; }
              td { padding: 2px 4px; font-size: 6.5px; }
              th, td { line-height: 1.02; }

              .report-title { font-size: 13px; }
              .report-subtitle, .report-meta, .print-note { font-size: 6px; }
              .print-note { margin-top: 12px; padding-top: 5px; }
            }
            body{font-family:'Segoe UI',Inter,sans-serif;color:#0f172a;padding:6px 8px;background-color:#fff;font-size:9px;}
            table{border-collapse:collapse;width:100%;max-width:100%;margin-top:8px;table-layout:fixed;}
            th{background-color:#0f172a;color:#ffffff;padding:6px 7px;border:1px solid #475569;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.25px;}
            td{vertical-align:top;line-height:1.1;padding:4px 6px;font-size:8px;word-break:break-word;}
            .kpi-row{display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;}
            .kpi-box{border:1px solid #e2e8f0;border-radius:10px;padding:6px 8px;text-align:center;flex:1;min-width:90px;}
            .kpi-title{font-size:8px;text-transform:uppercase;color:#64748b;font-weight:bold;margin-bottom:2px;letter-spacing:0.14em;}
            .kpi-num{font-size:14px;font-weight:bold;}
            .report-header{display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1.5px solid #0f172a;padding-bottom:8px;margin-bottom:12px;}
            .report-title{margin:0;font-size:16px;letter-spacing:-0.4px;color:#0f172a;}
            .report-subtitle{font-size:10px;color:#64748b;font-weight:500;line-height:1.2;}
            .report-meta{font-size:9px;color:#64748b;text-align:right;line-height:1.2;}
            .print-note{margin-top:24px;display:flex;justify-content:space-between;font-size:8px;color:#64748b;border-top:1px dashed #cbd5e1;padding-top:8px;}
          </style>
        </head>
        <body>
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:15px;margin-bottom:20px;">
            <div style="display:flex;align-items:center;gap:15px;">
              <img src="${origin}/logo2.jpg" alt="Logo" style="height:48px;object-fit:contain;border-radius:8px;" />
              <div>
                <h1 style="margin:0;font-size:22px;letter-spacing:-0.5px;color:#0f172a;">Control de Reportes de Mantenimiento</h1>
                <div style="font-size:12px;color:#64748b;font-weight:500;">Módulo CMMS Empresarial • T&CH ASEPSIS S.A.C.</div>
              </div>
            </div>
            <div style="margin-left:auto;text-align:right;font-size:11px;color:#64748b;min-width:200px;">
              <strong>Generado por:</strong> ${escapeHtml(user?.name || 'Administrador')}<br/>
              <strong>Fecha:</strong> ${new Date().toLocaleString('es-PE')}
            </div>
          </div>

          ${activeRangeText || activeSearchText || activeEquipoText ? `
          <div style="font-size:12px;background-color:#f8fafc;padding:10px 15px;border-radius:8px;border-left:4px solid #263fff;margin-bottom:20px;">
            ${activeRangeText}${activeRangeText && activeSearchText ? ' | ' : ''}${activeSearchText}${(activeRangeText || activeSearchText) && activeEquipoText ? ' | ' : ''}${activeEquipoText}
          </div>
          ` : ''}
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
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:4%;text-align:center;">Item</th>
                <th style="width:14%;">Responsable</th>
                <th style="width:16%;">Equipo / Máquina</th>
                <th style="width:14%;">Falla</th>
                <th style="width:26%;">Tipo y Descripción</th>
                <th style="width:9%;text-align:center;">Fecha Culm.</th>
                <th style="width:8%;text-align:center;">Estado</th>
                <th style="width:7%;text-align:center;">Frecuencia</th>
                <th style="width:8%;text-align:center;">Próximo Mant.</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="9" style="text-align:center;padding:20px;color:#94a3b8;">No se encontraron registros para los filtros seleccionados.</td></tr>'}
            </tbody>
          </table>
          
          <div style="margin-top:40px;display:flex;justify-content:space-between;font-size:11px;color:#64748b;border-top:1px dashed #cbd5e1;padding-top:15px;">
            <span>T&CH ASEPSIS S.A.C. - Sistema de Mantenimiento Preventivo Programado (CMMS)</span>
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

  const handleExportTasksExcel = () => {
    const escapeHtml = (s?: string) => {
      if (!s) return '';
      return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // Build visual grouping of rows by date for the Excel report
    let lastDate = '';
    let dataRowIndex = 0;
    const rowsHtml = sortedTareas.map(t => {
      const currDate = getTaskDate(t);
      const isHeaderNeeded = currDate !== lastDate;
      lastDate = currDate;

      const itemNum = computedItemNumbers[t.id] || t.itemNumber || 1;
      
      const headerRow = isHeaderNeeded ? `
        <tr style="background-color:#F1F3F5; font-weight:bold;">
          <td colspan="12" style="padding:10px 12px; border:1px solid #cbd5e1; font-size:11pt; color:#0D1B2A; text-align:left; font-family:'Calibri', Arial, sans-serif;">
            📅 ${formatFriendlyDate(currDate)} (${sortedTareas.filter(x => getTaskDate(x) === currDate).length} tareas)
          </td>
        </tr>
      ` : '';

      const stateBadge = t.estado === 'PENDIENTE' ? '<span style="background-color:#F8D7DA;color:#721C24;border:1px solid #f5c6cb;padding:4px 10px;border-radius:12px;font-weight:bold;font-size:10px;font-family:\'Calibri\', sans-serif;text-transform:uppercase;">Pendiente</span>' :
                         t.estado === 'EN_PROCESO' ? '<span style="background-color:#FFF3CD;color:#856404;border:1px solid #ffeeba;padding:4px 10px;border-radius:12px;font-weight:bold;font-size:10px;font-family:\'Calibri\', sans-serif;text-transform:uppercase;">En Proceso</span>' :
                         '<span style="background-color:#D4EDDA;color:#155724;border:1px solid #c3e6cb;padding:4px 10px;border-radius:12px;font-weight:bold;font-size:10px;font-family:\'Calibri\', sans-serif;text-transform:uppercase;">Culminado</span>';

      // Calculate Próximo Mantenimiento date (respecting unique frequency)
      let proximoText = 'Sin recurrencia';
      let frecuenciaText = t.frecuenciaMeses ? `${t.frecuenciaMeses} ${t.frecuenciaMeses === 1 ? 'Mes' : 'Meses'}` : 'Única';
      const isCompTask = !!(t.equipo && (t.equipo.toUpperCase().includes('COMPRESOR') || t.equipo.toUpperCase().includes('COMPRESORA')));
      const proximoFormatStyle = isCompTask ? '' : "mso-number-format:'dd\\/mm\\/yyyy';";

      if (isCompTask) {
        frecuenciaText = t.frecuenciaHrs ? `${t.frecuenciaHrs} Hrs` : 'Única';
        proximoText = t.proximoMantenimientoHrs ? `${t.proximoMantenimientoHrs} Hrs` : '-';
      } else {
        if (t.frecuenciaMeses && t.esRecurrente !== false) {
          const targetDate = t.fechaCulminado ? addMonths(t.fechaCulminado, t.frecuenciaMeses) : (t.estado === 'CULMINADO' || t.estado === 'HECHO' ? t.proximaEjecucion : t.fecha);
          proximoText = targetDate ? formatSmallDate(targetDate) : '-';
        }
      }

      const rowBgColor = dataRowIndex % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
      dataRowIndex++;

      return `
        ${headerRow}
        <tr style="background-color:${rowBgColor};">
          <td style="padding:10px;border:1px solid #cbd5e1;font-size:10pt;text-align:center;font-family:'Calibri', sans-serif;vertical-align:middle;">${itemNum}</td>
          <td style="padding:10px;border:1px solid #cbd5e1;font-size:10pt;text-align:left;font-family:'Calibri', sans-serif;vertical-align:middle;">${escapeHtml(t.responsable)}</td>
          <td style="padding:10px;border:1px solid #cbd5e1;font-size:10pt;font-weight:bold;text-align:left;font-family:'Calibri', sans-serif;vertical-align:middle;">${escapeHtml(t.equipo || '')}</td>
          <td style="padding:10px;border:1px solid #cbd5e1;font-size:10pt;text-align:center;font-family:'Calibri', sans-serif;vertical-align:middle;text-transform:uppercase;">${escapeHtml(t.sede || '-')}</td>
          <td style="padding:10px;border:1px solid #cbd5e1;font-size:10pt;text-align:left;font-family:'Calibri', sans-serif;vertical-align:middle;white-space:normal;word-wrap:break-word;">${escapeHtml(t.falla || '-')}</td>
          <td style="padding:10px;border:1px solid #cbd5e1;font-size:10pt;text-align:center;font-family:'Calibri', sans-serif;vertical-align:middle;text-transform:uppercase;font-weight:bold;">${escapeHtml(t.tipo || '')}</td>
          <td style="padding:10px;border:1px solid #cbd5e1;font-size:10pt;text-align:left;font-family:'Calibri', sans-serif;vertical-align:middle;white-space:normal;word-wrap:break-word;">${escapeHtml(t.descripcion)}</td>
          <td style="padding:10px;border:1px solid #cbd5e1;font-size:10pt;text-align:center;font-family:'Calibri', sans-serif;vertical-align:middle;">${(t as any).archivos?.length || t.certificadoPath ? `📎 Sí (${(t as any).archivos?.length || 1})` : '-'}</td>
          <td style="padding:10px;border:1px solid #cbd5e1;font-size:10pt;text-align:center;font-family:'Calibri', sans-serif;vertical-align:middle;mso-number-format:'dd\\/mm\\/yyyy';">${t.fechaCulminado ? formatSmallDate(t.fechaCulminado) : '--/--/----'}</td>
          <td style="padding:10px;border:1px solid #cbd5e1;font-size:10pt;text-align:center;font-family:'Calibri', sans-serif;vertical-align:middle;">${stateBadge}</td>
          <td style="padding:10px;border:1px solid #cbd5e1;font-size:10pt;text-align:center;font-family:'Calibri', sans-serif;vertical-align:middle;">${escapeHtml(frecuenciaText)}</td>
          <td style="padding:10px;border:1px solid #cbd5e1;font-size:10pt;text-align:center;font-weight:bold;font-family:'Calibri', sans-serif;vertical-align:middle;${proximoFormatStyle}">${escapeHtml(proximoText)}</td>
        </tr>
      `;
    }).join('\n');

    const activeRangeText = fromDate || toDate 
      ? `Período: ${fromDate ? formatSmallDate(fromDate) : 'Inicio'} hasta ${toDate ? formatSmallDate(toDate) : 'Fin'}`
      : '';

    const activeSearchText = searchTerm.trim() ? `Búsqueda: "${escapeHtml(searchTerm)}"` : '';
    const activeEquipoText = selectedEquipoFilter ? `Filtrado por equipo: ${escapeHtml(selectedEquipoFilter)}` : '';

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Mantenimiento</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Calibri', Arial, sans-serif; color: #0D1B2A; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #cbd5e1; padding: 10px; font-family: 'Calibri', Arial, sans-serif; }
          th { background-color: #0D1B2A; color: #ffffff; text-align: center; font-weight: bold; font-size: 11pt; text-transform: uppercase; }
          .title { font-size: 16pt; font-weight: bold; color: #0D1B2A; font-family: 'Calibri', Arial, sans-serif; }
          .subtitle { font-size: 11pt; color: #475569; font-family: 'Calibri', Arial, sans-serif; }
          .meta { font-size: 10pt; color: #475569; text-align: right; font-family: 'Calibri', Arial, sans-serif; }
          .kpi-title { font-size: 10pt; text-transform: uppercase; font-weight: bold; text-align: center; font-family: 'Calibri', Arial, sans-serif; }
          .kpi-value { font-size: 16pt; font-weight: bold; text-align: center; font-family: 'Calibri', Arial, sans-serif; }
        </style>
      </head>
      <body>
        <!-- Header Section -->
        <table>
          <tr>
            <td colspan="8" class="title" style="border:none; padding-bottom:5px;">Control de Reportes de Mantenimiento</td>
            <td colspan="4" class="meta" style="border:none; padding-bottom:5px;">
              <strong>Generado por:</strong> ${escapeHtml(user?.name || 'Administrador')}<br/>
              <strong>Fecha:</strong> ${new Date().toLocaleString('es-PE')}
            </td>
          </tr>
          <tr>
            <td colspan="8" class="subtitle" style="border:none; padding-bottom:15px; font-style:italic;">Módulo CMMS Empresarial • T&CH ASEPSIS S.A.C.</td>
            <td colspan="4" style="border:none;"></td>
          </tr>
          ${activeRangeText || activeSearchText || activeEquipoText ? `
          <tr>
            <td colspan="12" style="border:none; font-size:11px; background-color:#f8fafc; padding:10px; color:#0D1B2A; font-weight:600;">
              ${activeRangeText}${activeRangeText && activeSearchText ? ' | ' : ''}${activeSearchText}${(activeRangeText || activeSearchText) && activeEquipoText ? ' | ' : ''}${activeEquipoText}
            </td>
          </tr>
          ` : ''}
          <tr><td colspan="12" style="border:none; height:10px;"></td></tr>
          
          <!-- KPI Section -->
          <tr>
            <td colspan="3" class="kpi-title" style="background-color:#dbeafe; color:#1e40af; border:1px solid #cbd5e1; font-weight:bold;">TOTAL TAREAS</td>
            <td colspan="3" class="kpi-title" style="background-color:#fee2e2; color:#991b1b; border:1px solid #cbd5e1; font-weight:bold;">PENDIENTES</td>
            <td colspan="3" class="kpi-title" style="background-color:#fef3c7; color:#92400e; border:1px solid #cbd5e1; font-weight:bold;">EN PROCESO</td>
            <td colspan="3" class="kpi-title" style="background-color:#d1fae5; color:#065f46; border:1px solid #cbd5e1; font-weight:bold;">CULMINADAS</td>
          </tr>
          <tr>
            <td colspan="3" class="kpi-value" style="background-color:#f0f9ff; color:#1d4ed8; border:1px solid #cbd5e1; font-weight:bold;">${totalCount}</td>
            <td colspan="3" class="kpi-value" style="background-color:#fef2f2; color:#dc2626; border:1px solid #cbd5e1; font-weight:bold;">${pendientesCount}</td>
            <td colspan="3" class="kpi-value" style="background-color:#fffbeb; color:#d97706; border:1px solid #cbd5e1; font-weight:bold;">${enProcesoCount}</td>
            <td colspan="3" class="kpi-value" style="background-color:#f0fdf4; color:#16a34a; border:1px solid #cbd5e1; font-weight:bold;">${culminadasCount}</td>
          </tr>
          <tr><td colspan="12" style="border:none; height:15px;"></td></tr>
          
          <!-- Table Header -->
          <thead>
            <tr>
              <th style="width:60px; background-color:#0D1B2A; color:#ffffff; font-weight:bold; border:1px solid #cbd5e1; text-align:center; padding:10px;">ITEM</th>
              <th style="width:160px; background-color:#0D1B2A; color:#ffffff; font-weight:bold; border:1px solid #cbd5e1; text-align:left; padding:10px;">RESPONSABLE</th>
              <th style="width:180px; background-color:#0D1B2A; color:#ffffff; font-weight:bold; border:1px solid #cbd5e1; text-align:left; padding:10px;">EQUIPO / MÁQUINA</th>
              <th style="width:100px; background-color:#0D1B2A; color:#ffffff; font-weight:bold; border:1px solid #cbd5e1; text-align:center; padding:10px;">SEDE</th>
              <th style="width:280px; background-color:#0D1B2A; color:#ffffff; font-weight:bold; border:1px solid #cbd5e1; text-align:left; padding:10px;">FALLA REPORTADA</th>
              <th style="width:130px; background-color:#0D1B2A; color:#ffffff; font-weight:bold; border:1px solid #cbd5e1; text-align:center; padding:10px;">TIPO MANT.</th>
              <th style="width:320px; background-color:#0D1B2A; color:#ffffff; font-weight:bold; border:1px solid #cbd5e1; text-align:left; padding:10px;">DESCRIPCIÓN DE ACTIVIDAD</th>
              <th style="width:150px; background-color:#0D1B2A; color:#ffffff; font-weight:bold; border:1px solid #cbd5e1; text-align:center; padding:10px;">CERTIF. OPERATIVIDAD</th>
              <th style="width:140px; background-color:#0D1B2A; color:#ffffff; font-weight:bold; border:1px solid #cbd5e1; text-align:center; padding:10px;">FECHA CULMINADO</th>
              <th style="width:120px; background-color:#0D1B2A; color:#ffffff; font-weight:bold; border:1px solid #cbd5e1; text-align:center; padding:10px;">ESTADO</th>
              <th style="width:120px; background-color:#0D1B2A; color:#ffffff; font-weight:bold; border:1px solid #cbd5e1; text-align:center; padding:10px;">FRECUENCIA</th>
              <th style="width:140px; background-color:#0D1B2A; color:#ffffff; font-weight:bold; border:1px solid #cbd5e1; text-align:center; padding:10px;">PROX. MANT.</th>
            </tr>
          </thead>
          
          <!-- Table Body -->
          <tbody>
            ${rowsHtml || '<tr><td colspan="12" style="text-align:center;padding:20px;color:#cbd5e1;font-family:\'Calibri\', Arial, sans-serif;">No se encontraron registros para los filtros seleccionados.</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Control_de_Reportes_de_Mantenimiento.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
                alt="T&CH Asepsis Logo" 
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
              type="button"
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 border border-brand-400/20 text-xs font-bold text-white transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-brand-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear nueva tarea</span>
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
          {/* Card: CON DOCUMENTOS */}
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              const future30 = new Date();
              future30.setDate(today.getDate() + 30);
              const formatDate = (date: Date) => {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
              };
              setFromDate(formatDate(today));
              setToDate(formatDate(future30));
              setSelectedDocFilter('CON_DOC');
              setQuickRange('ALL');
              setCurrentPage(1);
            }}
            className={`flex items-center justify-between p-4.5 rounded-2xl border text-left transition-all duration-300 outline-none select-none cursor-pointer w-full group/card ${
              selectedDocFilter === 'CON_DOC'
                ? 'bg-emerald-50/25 border-emerald-500 shadow-md shadow-emerald-500/5 ring-2 ring-emerald-500/10 scale-[1.02]'
                : 'bg-white border-slate-100 shadow-xs hover:border-emerald-200 hover:scale-[1.02] hover:shadow-sm'
            }`}
          >
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Con Documentos</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight block mt-1">{conDocsProximosCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Próximos 30 días</span>
            </div>
            <div className={`rounded-2xl p-3 shrink-0 transition-all duration-300 ${
              selectedDocFilter === 'CON_DOC' ? 'bg-emerald-100 text-emerald-600 scale-110' : 'bg-emerald-50 text-emerald-500 group-hover/card:bg-emerald-100 group-hover/card:text-emerald-600 group-hover/card:scale-110'
            }`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </button>

          {/* Card: SIN DOCUMENTOS */}
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              const future30 = new Date();
              future30.setDate(today.getDate() + 30);
              const formatDate = (date: Date) => {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
              };
              setFromDate(formatDate(today));
              setToDate(formatDate(future30));
              setSelectedDocFilter('SIN_DOC');
              setQuickRange('ALL');
              setCurrentPage(1);
            }}
            className={`flex items-center justify-between p-4.5 rounded-2xl border text-left transition-all duration-300 outline-none select-none cursor-pointer w-full group/card ${
              selectedDocFilter === 'SIN_DOC'
                ? 'bg-rose-50/25 border-rose-500 shadow-md shadow-rose-500/5 ring-2 ring-rose-500/10 scale-[1.02]'
                : 'bg-white border-slate-100 shadow-xs hover:border-rose-200 hover:scale-[1.02] hover:shadow-sm'
            }`}
          >
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sin Documentos</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight block mt-1">{sinDocsProximosCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Próximos 30 días</span>
            </div>
            <div className={`rounded-2xl p-3 shrink-0 transition-all duration-300 ${
              selectedDocFilter === 'SIN_DOC' ? 'bg-rose-100 text-rose-600 scale-110' : 'bg-rose-50 text-rose-500 group-hover/card:bg-rose-100 group-hover/card:text-rose-600 group-hover/card:scale-110'
            }`}>
              <AlertCircle className="w-6 h-6" />
            </div>
          </button>

          {/* Card: ESTA SEMANA */}
          <button
            type="button"
            onClick={() => {
              handleQuickRangeChange('ESTA_SEMANA');
              setCurrentPage(1);
            }}
            className={`flex items-center justify-between p-4.5 rounded-2xl border text-left transition-all duration-300 outline-none select-none cursor-pointer w-full group/card ${
              quickRange === 'ESTA_SEMANA'
                ? 'bg-violet-50/25 border-violet-500 shadow-md shadow-violet-500/5 ring-2 ring-violet-500/10 scale-[1.02]'
                : 'bg-white border-slate-100 shadow-xs hover:border-violet-200 hover:scale-[1.02] hover:shadow-sm'
            }`}
          >
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Esta Semana</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-violet-600 tracking-tight block mt-1">{estaSemanaCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Siguientes 7 días</span>
            </div>
            <div className={`rounded-2xl p-3 shrink-0 transition-all duration-300 ${
              quickRange === 'ESTA_SEMANA' ? 'bg-violet-100 text-violet-600 scale-110' : 'bg-violet-50 text-violet-500 group-hover/card:bg-violet-100 group-hover/card:text-violet-600 group-hover/card:scale-110'
            }`}>
              <Clock className="w-6 h-6" />
            </div>
          </button>

          {/* Card: ESTE MES */}
          <button
            type="button"
            onClick={() => {
              handleQuickRangeChange('ESTE_MES');
              setCurrentPage(1);
            }}
            className={`flex items-center justify-between p-4.5 rounded-2xl border text-left transition-all duration-300 outline-none select-none cursor-pointer w-full group/card ${
              quickRange === 'ESTE_MES'
                ? 'bg-cyan-50/25 border-cyan-500 shadow-md shadow-cyan-500/5 ring-2 ring-cyan-500/10 scale-[1.02]'
                : 'bg-white border-slate-100 shadow-xs hover:border-cyan-200 hover:scale-[1.02] hover:shadow-sm'
            }`}
          >
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Este Mes</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-600 tracking-tight block mt-1">{esteMesCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Mes calendario actual</span>
            </div>
            <div className={`rounded-2xl p-3 shrink-0 transition-all duration-300 ${
              quickRange === 'ESTE_MES' ? 'bg-cyan-100 text-cyan-600 scale-110' : 'bg-cyan-50 text-cyan-500 group-hover/card:bg-cyan-100 group-hover/card:text-cyan-600 group-hover/card:scale-110'
            }`}>
              <RotateCcw className="w-6 h-6" />
            </div>
          </button>
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


        </section>

        {/* --- MAIN MODERN DATA GRID CONTAINER --- */}
        <section className={`rounded-2xl border transition-all duration-300 relative shadow-sm ${
          isPremiumDarkMode 
            ? 'bg-[#0b0f19] border-[#1e293b]' 
            : 'bg-white border-slate-200'
        }`}>
          
          <div className={`px-6 py-4.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-t-2xl transition-colors duration-300 ${
            isPremiumDarkMode 
              ? 'border-[#1e293b] bg-[#0d1324]/60' 
              : 'border-slate-100 bg-slate-50/50'
          }`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h3 className={`font-extrabold text-base transition-colors duration-300 ${
                  isPremiumDarkMode ? 'text-slate-100' : 'text-slate-900'
                }`}>Listado de Tareas de Planta</h3>
                
                {isTableLoading && <Loader2 className="animate-spin h-4 w-4 text-brand-500 shrink-0" />}
              </div>

              <button
                type="button"
                onClick={handleExportTasksPDF}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-[11px] font-bold transition-all cursor-pointer border ${
                  isPremiumDarkMode 
                    ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' 
                    : 'bg-white text-slate-700 border-slate-200 shadow-sm hover:bg-slate-50'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Exportar PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportTasksExcel}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-[11px] font-bold transition-all cursor-pointer border ${
                  isPremiumDarkMode 
                    ? 'bg-[#064e3b]/80 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60 shadow-md' 
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm hover:bg-emerald-100'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <span>Exportar Excel</span>
              </button>
            </div>
            <div className={`text-xs font-semibold transition-colors duration-300 ${
              isPremiumDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Mostrando <span className={isPremiumDarkMode ? 'text-slate-200' : 'text-slate-800'}>{totalCount > 0 ? startIndex + 1 : 0}</span> al <span className={isPremiumDarkMode ? 'text-slate-200' : 'text-slate-800'}>{endIndex}</span> de <span className={`${isPremiumDarkMode ? 'text-sky-400' : 'text-brand-600'} font-bold`}>{totalCount}</span> registros
            </div>
          </div>

          {/* INTEGRATED QUICK FILTER BAR */}
          <div className={`px-4 py-3 border-b grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 transition-colors duration-300 ${
            isPremiumDarkMode 
              ? 'bg-[#0f172a]/40 border-[#1e293b]' 
              : 'bg-white border-slate-100'
          }`}>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); handleSearchTrigger(); }}
              className={`text-[10px] font-bold rounded-xl px-2 py-2 border outline-none transition-all ${
                isPremiumDarkMode 
                  ? 'bg-slate-900/50 border-slate-800 text-slate-300 focus:border-sky-500/50' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 focus:border-brand-500/50'
              }`}
            >
              <option value="ALL">ESTADO: TODOS</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN_PROCESO">EN PROCESO</option>
              <option value="CULMINADO">CULMINADO</option>
            </select>

            <select
              value={selectedSedeFilter ?? ''}
              onChange={(e) => { setSelectedSedeFilter(e.target.value === '' ? null : e.target.value as any); handleSearchTrigger(); }}
              className={`text-[10px] font-bold rounded-xl px-2 py-2 border outline-none transition-all ${
                isPremiumDarkMode 
                  ? 'bg-slate-900/50 border-slate-800 text-slate-300 focus:border-sky-500/50' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 focus:border-brand-500/50'
              }`}
            >
              <option value="">SEDE: TODAS</option>
              <option value="Lima">LIMA</option>
              <option value="Trujillo">TRUJILLO</option>
            </select>

            <select
              value={selectedTipoFilter ?? ''}
              onChange={(e) => { setSelectedTipoFilter(e.target.value === '' ? null : e.target.value); handleSearchTrigger(); }}
              className={`text-[10px] font-bold rounded-xl px-2 py-2 border outline-none transition-all ${
                isPremiumDarkMode 
                  ? 'bg-slate-900/50 border-slate-800 text-slate-300 focus:border-sky-500/50' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 focus:border-brand-500/50'
              }`}
            >
              <option value="">TIPO: TODOS</option>
              {tipoOptions.map(t => (
                <option key={t} value={t}>{t.toUpperCase()}</option>
              ))}
            </select>

            <select
              value={selectedDocFilter}
              onChange={(e) => { setSelectedDocFilter(e.target.value as any); handleSearchTrigger(); }}
              className={`text-[10px] font-bold rounded-xl px-2 py-2 border outline-none transition-all ${
                isPremiumDarkMode 
                  ? 'bg-slate-900/50 border-slate-800 text-slate-300 focus:border-sky-500/50' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 focus:border-brand-500/50'
              }`}
            >
              <option value="ALL">DOC: TODOS</option>
              <option value="CON_DOC">CON DOCUMENTO</option>
              <option value="SIN_DOC">SIN DOCUMENTO</option>
            </select>

            <select
              value={selectedFrecuenciaFilter ?? ''}
              onChange={(e) => { setSelectedFrecuenciaFilter(e.target.value === '' ? null : e.target.value); handleSearchTrigger(); }}
              className={`text-[10px] font-bold rounded-xl px-2 py-2 border outline-none transition-all ${
                isPremiumDarkMode 
                  ? 'bg-slate-900/50 border-slate-800 text-slate-300 focus:border-sky-500/50' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 focus:border-brand-500/50'
              }`}
            >
              <option value="">FRECUENCIA: TODAS</option>
              <option value="UNICA">ÚNICA</option>
              <option value="RECURRENTE">RECURRENTE</option>
              {frecuenciaOptions.map(f => (
                <option key={f} value={f}>{f} MESES</option>
              ))}
            </select>

            <select
              value={quickRange}
              onChange={(e) => handleQuickRangeChange(e.target.value)}
              className={`text-[10px] font-bold rounded-xl px-2 py-2 border outline-none transition-all ${
                isPremiumDarkMode 
                  ? 'bg-slate-900/50 border-slate-800 text-slate-300 focus:border-sky-500/50' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 focus:border-brand-500/50'
              }`}
            >
              <option value="ALL">PERÍODO: TODOS</option>
              <option value="ESTA_SEMANA">ESTA SEMANA (LUN - DOM)</option>
              <option value="SEMANA_PASADA">SEMANA PASADA</option>
              <option value="ESTE_MES">ESTE MES</option>
              <option value="MES_PASADO">MES PASADO</option>
            </select>
          </div>

          {/* TOP PAGINATION BAR */}
          {totalPages > 1 && (
            <div className={`px-6 py-2.5 border-b flex items-center justify-between transition-colors duration-300 ${
              isPremiumDarkMode 
                ? 'bg-[#0f172a]/20 border-[#1e293b]' 
                : 'bg-slate-50/20 border-slate-100'
            }`}>
              <div className={`text-xs font-semibold transition-colors duration-300 ${
                isPremiumDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Página <span className={isPremiumDarkMode ? 'text-slate-200' : 'text-slate-800'}>{currentPage}</span> de <span className={isPremiumDarkMode ? 'text-slate-200' : 'text-slate-800'}>{totalPages}</span>
              </div>
              <div className="flex items-center gap-1">
                {/* Button First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`p-1 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer ${
                    isPremiumDarkMode
                      ? 'border-[#1e293b] bg-[#0b0f19] hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  title="Primera página"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>

                {/* Button Previous Page */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-1 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer ${
                    isPremiumDarkMode
                      ? 'border-[#1e293b] bg-[#0b0f19] hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  title="Página anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page Indices List */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((idx) => {
                  const show = idx === 1 || idx === totalPages || Math.abs(idx - currentPage) <= 1;
                  if (!show) {
                    if (idx === 2 || idx === totalPages - 1) {
                      return <span key={`ellipsis-top-${idx}`} className={`px-1 text-xs ${isPremiumDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={`top-page-${idx}`}
                      onClick={() => setCurrentPage(idx)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        idx === currentPage
                          ? isPremiumDarkMode
                            ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                            : 'bg-brand-600 text-white border-brand-500 shadow-sm'
                          : isPremiumDarkMode
                          ? 'bg-[#0b0f19] hover:bg-slate-800/50 text-slate-300 border-[#1e293b]'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
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
                  className={`p-1 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer ${
                    isPremiumDarkMode
                      ? 'border-[#1e293b] bg-[#0b0f19] hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  title="Página siguiente"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Button Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`p-1 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer ${
                    isPremiumDarkMode
                      ? 'border-[#1e293b] bg-[#0b0f19] hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  title="Última página"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* DESKTOP TABLE VIEW */}
          <div className={`hidden lg:block overflow-x-auto overflow-y-auto min-h-[380px] max-h-[70vh] pb-4 scrollbar-horizontal-large ${
            isPremiumDarkMode ? 'bg-[#0f172a]/20 dark-scroll' : 'bg-slate-50/40'
          }`}>
            <table className="w-full min-w-[1400px] text-sm table-auto border-collapse">
              <thead className="sticky top-0 z-20 bg-[#0f172a]">
                <tr className="text-[10px] tracking-[0.24em] uppercase font-bold border-b bg-[#0f172a] text-white border-slate-800 shadow-sm">
                  <th className="px-4 py-4 text-center border-b w-14 align-middle border-slate-800 border-r border-white/5">Item</th>
                  <th 
                    onClick={() => handleSort('responsable')} 
                    className="px-5 py-4 text-left border-b cursor-pointer select-none transition-colors border-slate-800 hover:bg-white/5 border-r border-white/5"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>Responsable</span>
                      <ArrowUpDown className="w-3 h-3 text-sky-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('equipo')} 
                    className="px-5 py-4 text-left border-b cursor-pointer select-none transition-colors border-slate-800 hover:bg-white/5 border-r border-white/5"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>Equipo / Máquina</span>
                      <ArrowUpDown className="w-3 h-3 text-sky-400" />
                    </div>
                  </th>
                  <th className="px-5 py-4 text-left border-b border-slate-800 border-r border-white/5">Sede</th>
                  <th className="px-5 py-4 text-left border-b w-48 border-slate-800 border-r border-white/5">Falla Reportada</th>
                  <th className="px-5 py-4 text-left border-b border-slate-800 border-r border-white/5">Tipo Mant.</th>
                  <th className="px-5 py-4 text-left border-b w-64 border-slate-800 border-r border-white/5">Descripción de Actividad</th>
                  <th className="px-4 py-4 text-center border-b w-32 select-none border-slate-800 border-r border-white/5">Certif. Operatividad</th>
                  <th className="px-4 py-4 text-center border-b w-36 select-none border-slate-800 border-r border-white/5">Fecha Culminado</th>
                  <th 
                    onClick={() => handleSort('estado')} 
                    className="px-4 py-4 text-center border-b cursor-pointer select-none w-32 transition-colors border-slate-800 hover:bg-white/5 border-r border-white/5"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Estado</span>
                      <ArrowUpDown className="w-3 h-3 text-sky-400" />
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center border-b w-28 select-none border-slate-800 border-r border-white/5">Frecuencia</th>
                  <th className="px-4 py-4 text-center border-b w-32 select-none border-slate-800 border-r border-white/5">Prox. Mant.</th>
                  <th className="px-5 py-4 text-left border-b border-slate-800 border-r border-white/5">Repuestos</th>
                  <th 
                    onClick={() => handleSort('cantidad')} 
                    className="px-4 py-4 text-center border-b cursor-pointer select-none w-20 transition-colors border-slate-800 hover:bg-white/5 border-r border-white/5"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Cant</span>
                      <ArrowUpDown className="w-3 h-3 text-sky-400" />
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center border-b w-28 pl-5 pr-6 border-slate-800">Acciones</th>
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
                          <tr key={`group-${taskDate}`} className="select-none">
                            <td colSpan={15} className={`px-5 py-4 border-b transition-all duration-300 ${
                              isPremiumDarkMode 
                                ? 'bg-[#0f172a]/75 border-[#1e293b]' 
                                : 'bg-slate-100/80 border-slate-200'
                            }`}>
                              <div className="flex items-center gap-2.5">
                                <Calendar className={`w-3.5 h-3.5 shrink-0 ${
                                  isPremiumDarkMode ? 'text-sky-400' : 'text-slate-500'
                                }`} />
                                <span className={`text-[11px] font-bold tracking-[0.16em] uppercase transition-colors duration-300 ${
                                  isPremiumDarkMode ? 'text-slate-200' : 'text-slate-700'
                                }`}>{formatFriendlyDate(taskDate)}</span>
                                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all duration-300 ${
                                  isPremiumDarkMode 
                                    ? 'bg-sky-500/10 border border-sky-500/25 text-sky-400' 
                                    : 'bg-white border border-slate-200 text-slate-600'
                                }`}>
                                  {sortedTareas.filter(x => getTaskDate(x) === taskDate).length} Tareas
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}

                        <tr 
                          key={t.id} 
                          className={`border-b transition-all duration-200 group/row ${
                            isPremiumDarkMode 
                              ? `border-[#1e293b] hover:bg-[#162035] ${
                                  isOverdue 
                                    ? 'bg-rose-500/[0.025] border-l-2 border-l-rose-500' 
                                    : delayed 
                                    ? 'bg-rose-500/[0.01] border-l-2 border-l-rose-500/70' 
                                    : 'bg-[#0f172a]'
                                }`
                              : `border-slate-200/80 hover:bg-slate-50/80 ${
                                  isOverdue 
                                    ? 'bg-rose-50/40 border-l-2 border-l-rose-500' 
                                    : delayed 
                                    ? 'bg-slate-50/70 border-l-2 border-l-rose-500/70' 
                                    : 'bg-white'
                                }`
                          }`}
                        >
                          {/* Item correlative inside day */}
                          <td className={`px-3.5 py-3.5 text-center font-semibold text-[11px] border-b align-middle select-none transition-colors ${
                            isPremiumDarkMode ? 'text-slate-400 border-[#1e293b]' : 'text-slate-600 border-slate-200'
                          }`}>
                            <div className="flex items-center justify-center gap-1">
                              {isOverdue && <span className="text-rose-500 text-xs animate-pulse" title="¡Mantenimiento Vencido!">⚠️</span>}
                              <span>{itemIndex}</span>
                            </div>
                          </td>
                          <td className={`px-3.5 py-3.5 border-b text-[12px] font-semibold tracking-[0.01em] transition-colors ${
                            isPremiumDarkMode ? 'text-slate-200 border-[#1e293b]' : 'text-slate-800 border-slate-200'
                          }`}>
                            {t.responsable}
                          </td>
                          <td className={`px-3.5 py-3.5 border-b text-[12px] font-semibold tracking-[0.01em] transition-colors ${
                            isPremiumDarkMode ? 'text-sky-400 border-[#1e293b]' : 'text-slate-900 border-slate-200'
                          }`}>
                            {t.equipo || '-'}
                          </td>
                          <td className={`px-3.5 py-3.5 border-b transition-colors ${
                            isPremiumDarkMode ? 'border-[#1e293b]' : 'border-slate-200'
                          }`}>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                              isPremiumDarkMode 
                                ? 'bg-slate-800/80 border border-slate-700 text-slate-300' 
                                : 'bg-slate-100 border border-slate-200 text-slate-600'
                            }`}>
                              {t.sede || '-'}
                            </span>
                          </td>
                          <td className={`px-3.5 py-3.5 border-b text-[12px] font-medium leading-5 max-w-[220px] transition-colors ${
                            isPremiumDarkMode ? 'text-slate-300 border-[#1e293b]' : 'text-slate-700 border-slate-200'
                          }`} title={t.falla || ''}>
                            {t.falla || '-'}
                          </td>
                           <td className={`px-3.5 py-3.5 border-b text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            isPremiumDarkMode ? 'border-[#1e293b]' : 'border-slate-200'
                          }`}>
                            {t.tipo ? (
                              <span className={`px-2.5 py-1 rounded-lg border ${
                                t.tipo.toUpperCase() === 'CORRECTIVO' 
                                  ? (isPremiumDarkMode ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600')
                                  : t.tipo.toUpperCase() === 'PREVENTIVO'
                                  ? (isPremiumDarkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600')
                                  : t.tipo.toUpperCase() === 'PREDICTIVO'
                                  ? (isPremiumDarkMode ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600')
                                  : (isPremiumDarkMode ? 'bg-slate-500/10 border-slate-500/30 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600')
                              }`}>
                                {t.tipo}
                              </span>
                            ) : '-'}
                          </td>
                          <td className={`px-3.5 py-3.5 border-b text-[12px] font-medium whitespace-pre-wrap leading-6 transition-colors ${
                            isPremiumDarkMode ? 'text-slate-300 border-[#1e293b]' : 'text-slate-700 border-slate-200'
                          }`}>
                            {t.descripcion}
                          </td>

                          {/* Certificado de Operatividad Column */}
                          <td className={`px-3.5 py-3.5 text-center border-b select-none transition-colors ${
                            isPremiumDarkMode ? 'border-[#1e293b]' : 'border-slate-200'
                          }`}>
                            <div className="flex items-center justify-center gap-2">
                              {uploadingTaskId === t.id ? (
                                <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openMultiUploadModal(t.id)}
                                    className={`inline-flex items-center justify-center p-1.5 rounded-xl transition-all duration-150 active:scale-90 cursor-pointer ${
                                      isPremiumDarkMode
                                        ? 'border border-slate-700 bg-slate-850/80 hover:bg-slate-750 hover:border-slate-650 text-slate-300'
                                        : 'border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-600'
                                    }`}
                                    title="Subir Archivos (Múltiple)"
                                  >
                                    <span className="text-sm font-semibold">📎</span>
                                  </button>

                                  {(t.certificadoPath || (t as any).archivos?.length > 0) && (
                                    <button
                                      type="button"
                                      onClick={() => openFilesModal(t.id)}
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold rounded-full transition-colors cursor-pointer ${
                                        isPremiumDarkMode
                                          ? 'bg-sky-500/10 border border-sky-400/30 text-sky-400 hover:bg-sky-500/20'
                                          : 'bg-sky-50 border border-sky-200 hover:bg-sky-100 hover:border-sky-300 text-sky-700'
                                      }`}
                                    >
                                      <span>📂 Ver ({ (t as any).archivos?.length || (t.certificadoPath ? 1 : 0) })</span>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>

                          {/* Fecha Culminado (Inline Datepicker) Column */}
                          <td className={`px-3.5 py-3.5 text-center border-b transition-colors relative ${
                            isPremiumDarkMode ? 'border-[#1e293b]' : 'border-slate-200'
                          }`}>
                            <div className="flex items-center justify-center">
                              <span
                                onClick={() => {
                                  if (!isViewer) {
                                    setEditingDateId(t.id);
                                    const currentVal = t.fechaCulminado || '';
                                    setTempDate(currentVal);
                                    if (currentVal) {
                                      const parts = currentVal.split('-');
                                      if (parts.length === 3) {
                                        setCalYear(parseInt(parts[0]));
                                        setCalMonth(parseInt(parts[1]) - 1);
                                      } else {
                                        setCalYear(new Date().getFullYear());
                                        setCalMonth(new Date().getMonth());
                                      }
                                    } else {
                                      setCalYear(new Date().getFullYear());
                                      setCalMonth(new Date().getMonth());
                                    }
                                  }
                                }}
                                className={`px-2.5 py-1 border border-transparent rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150 ${
                                  isViewer 
                                    ? '' 
                                    : isPremiumDarkMode
                                    ? 'text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                                    : 'text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {t.fechaCulminado ? formatSmallDate(t.fechaCulminado) : '--/--/----'}
                              </span>

                              {editingDateId === t.id && (
                                <div ref={editContainerRef} className={`absolute z-50 mt-1 p-3 rounded-xl shadow-xl border w-[250px] animate-in fade-in zoom-in-95 duration-100 left-1/2 -translate-x-1/2 top-full ${
                                  isPremiumDarkMode 
                                    ? 'bg-slate-800 border-slate-700 text-slate-100 shadow-slate-950/50' 
                                    : 'bg-white border-slate-200 text-slate-700 shadow-slate-200/50'
                                }`}>
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (calMonth === 0) {
                                          setCalMonth(11);
                                          setCalYear(prev => prev - 1);
                                        } else {
                                          setCalMonth(prev => prev - 1);
                                        }
                                      }}
                                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center shrink-0"
                                    >
                                      <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                                    </button>
                                    
                                    <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">
                                      {MONTHS[calMonth]} {calYear}
                                    </span>
                                    
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (calMonth === 11) {
                                          setCalMonth(0);
                                          setCalYear(prev => prev + 1);
                                        } else {
                                          setCalMonth(prev => prev + 1);
                                        }
                                      }}
                                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center shrink-0"
                                    >
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-7 gap-1 mt-2">
                                    {DAYS_OF_WEEK.map(d => (
                                      <div key={d} className="text-center font-bold text-slate-400 text-[10px] py-1">{d}</div>
                                    ))}
                                    {(() => {
                                      const startDay = new Date(calYear, calMonth, 1).getDay();
                                      const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
                                      
                                      const cells: (number | null)[] = [];
                                      for (let i = 0; i < startDay; i++) {
                                        cells.push(null);
                                      }
                                      for (let i = 1; i <= totalDays; i++) {
                                        cells.push(i);
                                      }
                                      
                                      return cells.map((day, idx) => {
                                        if (day === null) {
                                          return <div key={`empty-${idx}`} />;
                                        }
                                        
                                        const formattedDay = String(day).padStart(2, '0');
                                        const formattedMonth = String(calMonth + 1).padStart(2, '0');
                                        const dateStr = `${calYear}-${formattedMonth}-${formattedDay}`;
                                        const isSelected = tempDate === dateStr;
                                        
                                        return (
                                          <button
                                            key={`day-${day}`}
                                            type="button"
                                            onClick={() => {
                                              handleUpdateFechaCulminado(t.id, dateStr);
                                              setEditingDateId(null);
                                            }}
                                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                                              isSelected
                                                ? 'bg-sky-500 text-white font-semibold shadow-xs'
                                                : isPremiumDarkMode
                                                ? 'text-slate-200 hover:bg-slate-700'
                                                : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                          >
                                            {day}
                                          </button>
                                        );
                                      });
                                    })()}
                                  </div>

                                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-2 mt-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateFechaCulminado(t.id, '');
                                        setEditingDateId(null);
                                      }}
                                      className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                                    >
                                      Borrar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const todayStr = new Date().toISOString().substring(0, 10);
                                        handleUpdateFechaCulminado(t.id, todayStr);
                                        setEditingDateId(null);
                                      }}
                                      className="text-[10px] font-semibold text-sky-500 hover:text-sky-600 cursor-pointer"
                                    >
                                      Hoy
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={`px-3.5 py-3.5 text-center border-b select-none transition-colors ${
                            isPremiumDarkMode ? 'border-[#1e293b]' : 'border-slate-200'
                          }`}>
                            <div className="flex flex-col items-center gap-1.5 justify-center">
                              {t.estado === 'PENDIENTE' && (
                                <span className={`inline-flex px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-colors ${
                                  isPremiumDarkMode
                                    ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                                }`}>
                                  <span>PENDIENTE</span>
                                </span>
                              )}
                              {t.estado === 'EN_PROCESO' && (
                                <span className={`inline-flex px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-colors ${
                                  isPremiumDarkMode
                                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                                    : 'bg-amber-50 border-amber-200 text-amber-800'
                                }`}>
                                  <span>EN PROCESO</span>
                                </span>
                              )}
                              {(t.estado === 'CULMINADO' || t.estado === 'HECHO') && (
                                <span className={`inline-flex px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-colors ${
                                  isPremiumDarkMode
                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                }`}>
                                  <span>CULMINADO</span>
                                </span>
                              )}

                              {/* Task aging indicator alert */}
                              {delayed && (
                                <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border transition-colors ${
                                  isPremiumDarkMode
                                    ? 'text-rose-400 bg-rose-500/5 border-rose-500/20'
                                    : 'text-rose-600 bg-rose-100/40 border-rose-200'
                                }`} title="Esta tarea ha estado pendiente por más de 7 días. Requiere atención prioritaria.">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                                  <span>ENVEJECIDO &gt;7d</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Frecuencia badge */}
                          <td className={`px-3.5 py-3.5 text-center border-b select-none transition-colors ${
                            isPremiumDarkMode ? 'border-[#1e293b]' : 'border-slate-200'
                          }`}>
                            {t.equipo && (t.equipo.toUpperCase().includes('COMPRESOR') || t.equipo.toUpperCase().includes('COMPRESORA')) ? (
                              t.frecuenciaHrs ? (
                                <span className={`inline-flex px-2.5 py-1 text-[10px] font-semibold rounded-full border transition-colors ${
                                  isPremiumDarkMode
                                    ? 'bg-[#1e1b4b] border-indigo-500/30 text-indigo-400'
                                    : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                }`}>
                                  {t.frecuenciaHrs} Hrs
                                </span>
                              ) : (
                                <span className={`inline-flex px-2.5 py-1 text-[10px] font-medium rounded-full border transition-colors ${
                                  isPremiumDarkMode
                                    ? 'bg-slate-800 border-slate-700 text-slate-400'
                                    : 'bg-slate-100 border-slate-200 text-slate-500'
                                }`}>
                                  Única
                                </span>
                              )
                            ) : t.frecuenciaMeses ? (
                              <span className={`inline-flex px-2.5 py-1 text-[10px] font-semibold rounded-full border transition-colors ${
                                isPremiumDarkMode
                                  ? 'bg-[#1e1b4b] border-indigo-500/30 text-indigo-400'
                                  : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                              }`}>
                                {t.frecuenciaMeses} {t.frecuenciaMeses === 1 ? 'Mes' : 'Meses'}
                              </span>
                            ) : (
                              <span className={`inline-flex px-2.5 py-1 text-[10px] font-medium rounded-full border transition-colors ${
                                isPremiumDarkMode
                                  ? 'bg-slate-800 border-slate-700 text-slate-400'
                                  : 'bg-slate-100 border-slate-200 text-slate-500'
                              }`}>
                                Única
                              </span>
                            )}
                          </td>

                          {/* Próximo Mantenimiento Badge */}
                          <td className={`px-3.5 py-3.5 text-center border-b select-none transition-colors ${
                            isPremiumDarkMode ? 'border-[#1e293b]' : 'border-slate-200'
                          }`}>
                            {renderProximoBadge(t)}
                          </td>

                          <td className={`px-3.5 py-3.5 border-b text-[12px] font-medium transition-colors ${
                            isPremiumDarkMode ? 'text-slate-400 border-[#1e293b]' : 'text-slate-600 border-slate-200'
                          }`}>
                            {t.repuestos || '-'}
                          </td>
                          <td className={`px-3.5 py-3.5 text-center border-b font-semibold text-[12px] transition-colors ${
                            isPremiumDarkMode ? 'text-slate-200 border-[#1e293b]' : 'text-slate-800 border-slate-200'
                          }`}>
                            {t.cantidad || '-'}
                          </td>

                          {/* Action Icon buttons with Tooltips */}
                          <td className={`p-3 text-center border-b pr-6 pl-4 select-none transition-colors ${
                            isPremiumDarkMode ? 'border-[#1e293b]' : 'border-slate-100'
                          }`}>
                            <div className="flex items-center justify-center gap-1.5">
                              {!isViewer && (
                                <>
                                  {/* Edit Task Action Button */}
                                  <div className="relative group/tooltip">
                                    <button
                                      onClick={() => { setEditingTask(t); setIsTaskModalOpen(true); }}
                                      className={`p-1.5 rounded-xl border transition-all duration-150 active:scale-90 cursor-pointer ${
                                        isPremiumDarkMode
                                          ? 'border-sky-500/20 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20'
                                          : 'border-sky-100 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700'
                                      }`}
                                      title="Editar Tarea"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-md">
                                      Editar Tarea
                                    </div>
                                  </div>

                                  {/* Delete Task Action Button */}
                                  <div className="relative group/tooltip">
                                    <button
                                      onClick={() => setConfirmDeleteId(t.id)}
                                      className={`p-1.5 rounded-xl border transition-all duration-150 active:scale-90 cursor-pointer ${
                                        isPremiumDarkMode
                                          ? 'border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                          : 'border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700'
                                      }`}
                                      title="Eliminar Tarea"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-md">
                                      Eliminar Tarea
                                    </div>
                                  </div>
                                </>
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
          <div className={`block lg:hidden divide-y transition-colors duration-300 ${
            isPremiumDarkMode ? 'divide-slate-800 bg-[#0b0f19]' : 'divide-slate-100 bg-white'
          }`}>
            {paginatedTareas.length > 0 ? (
              paginatedTareas.map((t) => {
                const itemIndex = computedItemNumbers[t.id] || t.itemNumber || 1;
                const delayed = isTaskDelayed(t);
                const isOverdue = t.estado !== 'CULMINADO' && t.estado !== 'HECHO' && t.fecha && getDaysDiff(todayStr, t.fecha) < 0;

                return (
                  <div 
                    key={`mobile-${t.id}`} 
                    className={`p-4 transition-colors duration-150 ${
                      isPremiumDarkMode 
                        ? `hover:bg-[#162035] ${
                            isOverdue 
                              ? 'bg-rose-500/[0.02] border-l-4 border-l-rose-500' 
                              : delayed 
                              ? 'bg-rose-500/[0.01] border-l-4 border-l-rose-500' 
                              : 'bg-[#0f172a]'
                          }`
                        : `hover:bg-slate-50/50 ${
                            isOverdue 
                              ? 'bg-rose-500/[0.03] border-l-4 border-l-rose-500' 
                              : delayed 
                              ? 'bg-rose-50/10 border-l-4 border-l-rose-500' 
                              : 'bg-white'
                          }`
                    }`}
                  >
                    {/* Header: Date and Item badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-1 border rounded-lg text-[10px] font-extrabold transition-colors duration-300 ${
                          isPremiumDarkMode
                            ? 'bg-slate-800 border-slate-700 text-slate-300'
                            : 'bg-slate-100 border border-slate-200 text-slate-700'
                        }`}>
                          #{itemIndex}
                        </span>
                        <span className={`text-[11px] font-bold transition-colors ${
                          isPremiumDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {formatSmallDate(getTaskDate(t))}
                        </span>
                      </div>
                      
                      {/* State badge */}
                      <div className="shrink-0">
                        {t.estado === 'PENDIENTE' && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full transition-colors ${
                            isPremiumDarkMode
                              ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400'
                              : 'bg-rose-50 border border-rose-200 text-rose-700'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            <span>PENDIENTE</span>
                          </span>
                        )}
                        {t.estado === 'EN_PROCESO' && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full transition-colors ${
                            isPremiumDarkMode
                              ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                              : 'bg-amber-50 border border-amber-200 text-amber-850'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>EN PROCESO</span>
                          </span>
                        )}
                        {(t.estado === 'CULMINADO' || t.estado === 'HECHO') && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full transition-colors ${
                            isPremiumDarkMode
                              ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>CULMINADO</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Responsable & Team */}
                    <p className={`text-xs font-bold uppercase transition-colors ${
                      isPremiumDarkMode ? 'text-slate-200' : 'text-slate-900'
                    }`}>
                      {t.responsable} • <span className={`font-extrabold transition-colors ${
                        isPremiumDarkMode ? 'text-sky-400' : 'text-brand-600'
                      }`}>{t.equipo || 'Sin Equipo'}</span>
                    </p>

                    {/* Work description */}
                    <p className={`text-xs mt-2 font-medium leading-relaxed p-2.5 rounded-xl border transition-all ${
                      isPremiumDarkMode 
                        ? 'bg-slate-950/40 border-slate-800 text-slate-300' 
                        : 'bg-slate-50 border border-slate-100 text-slate-700'
                    }`}>
                      {t.descripcion}
                    </p>

                    {/* Secondary details */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2.5 text-[11px]">
                      {t.falla && (
                        <div className={`col-span-2 font-semibold ${
                          isPremiumDarkMode ? 'text-rose-400/90' : 'text-rose-750'
                        }`}>
                          <span className="font-bold">Falla:</span> {t.falla}
                        </div>
                      )}
                      {t.tipo && (
                        <div>
                          <span className="text-slate-400">Tipo:</span>{' '}
                          <span className={`font-semibold ${isPremiumDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {t.tipo}
                          </span>
                        </div>
                      )}
                      {t.sede && (
                        <div>
                          <span className="text-slate-400">Sede:</span>{' '}
                          <span className={`font-semibold uppercase ${isPremiumDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {t.sede}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">Frecuencia:</span>{' '}
                        <span className={`font-semibold ${isPremiumDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          {t.frecuenciaMeses ? `🔄 ${t.frecuenciaMeses} M` : 'Única'}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 mt-1">
                        <span className="text-slate-400">Próximo:</span>
                        {renderProximoBadge(t)}
                      </div>
                      {t.repuestos && (
                        <div className={`col-span-2 italic mt-1 ${isPremiumDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          <span className="text-slate-400 font-normal">Repuestos:</span> {t.repuestos} (Cant: {t.cantidad || '0'})
                        </div>
                      )}
                    </div>

                    {/* Action buttons footer */}
                    <div className={`flex items-center justify-between border-t mt-3 pt-3 transition-colors ${
                      isPremiumDarkMode ? 'border-slate-800' : 'border-slate-100/70'
                    }`}>
                      <div>
                        {delayed && (
                          <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-md border animate-pulse transition-colors ${
                            isPremiumDarkMode
                              ? 'text-rose-400 bg-rose-500/5 border-rose-500/20'
                              : 'text-rose-600 bg-rose-50 border border-rose-200'
                          }`}>
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                            <span>ENVEJECIDO &gt;7d</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {!isViewer && (
                          <button
                            onClick={() => { setEditingTask(t); setIsTaskModalOpen(true); }}
                            className={`inline-flex items-center gap-1 text-[11px] font-bold p-1 px-2.5 rounded-lg active:scale-95 cursor-pointer transition-all ${
                              isPremiumDarkMode
                                ? 'text-sky-400 hover:bg-sky-500/10'
                                : 'text-sky-600 hover:bg-sky-50'
                            }`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                        )}
                        {!isViewer && (
                          <button
                            onClick={() => setConfirmDeleteId(t.id)}
                            className={`inline-flex items-center gap-1 text-[11px] font-bold p-1 px-2.5 rounded-lg active:scale-95 cursor-pointer transition-all ${
                              isPremiumDarkMode
                                ? 'text-rose-400 hover:bg-rose-500/10'
                                : 'text-rose-600 hover:bg-rose-50'
                            }`}
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
              <div className="p-8 text-center">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className={`text-xs font-semibold ${isPremiumDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  No se encontraron tareas registradas con los filtros seleccionados.
                </p>
              </div>
            )}
          </div>

          {/* --- MODERN PAGINATION CONTROLS BAR --- */}
          <div className={`px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 select-none rounded-b-2xl transition-colors duration-300 ${
            isPremiumDarkMode 
              ? 'bg-[#0f172a] border-[#1e293b]' 
              : 'bg-slate-50/50 border-slate-100'
          }`}>
            
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium transition-colors ${
                isPremiumDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={`text-xs font-bold rounded-lg p-1 px-2 focus:outline-none focus:border-brand-500 transition-colors ${
                  isPremiumDarkMode
                    ? 'bg-[#0b0f19] border-[#1e293b] text-slate-200'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className={`text-xs font-medium transition-colors ${
                isPremiumDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>registros</span>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                
                {/* Button First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`p-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer ${
                    isPremiumDarkMode
                      ? 'border-[#1e293b] bg-[#0b0f19] hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  title="Primera página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Button Previous Page */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer ${
                    isPremiumDarkMode
                      ? 'border-[#1e293b] bg-[#0b0f19] hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
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
                      return <span key={`ellipsis-${idx}`} className={`px-1.5 text-xs ${isPremiumDarkMode ? 'text-slate-650' : 'text-slate-400'}`}>...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        idx === currentPage
                          ? isPremiumDarkMode
                            ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                            : 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/10'
                          : isPremiumDarkMode
                          ? 'bg-[#0b0f19] hover:bg-slate-800/50 text-slate-300 border-[#1e293b] hover:text-slate-100'
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
                  className={`p-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer ${
                    isPremiumDarkMode
                      ? 'border-[#1e293b] bg-[#0b0f19] hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Button Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`p-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer ${
                    isPremiumDarkMode
                      ? 'border-[#1e293b] bg-[#0b0f19] hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
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
                .flatMap((t) => {
                  const eq = t.equipo;
                  if (!eq) return [];
                  if (eq.includes(' | ')) {
                    return eq.split(' | ').map(s => s.trim());
                  }
                  return [eq.trim()];
                })
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
                  esRecurrente: editingTask.esRecurrente ?? true,
                  horaInicio: editingTask.horaInicio,
                  frecuenciaHrs: editingTask.frecuenciaHrs,
                  proximoMantenimientoHrs: editingTask.proximoMantenimientoHrs
                }
              : selectedEquipoFilter
              ? {
                  responsable: '',
                  descripcion: '',
                  estado: 'PENDIENTE',
                  itemNumber: '',
                  fecha: '',
                  equipo: selectedEquipoFilter,
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

      {/* Multi-File Upload Modal */}
      <TaskModal
        isOpen={isMultiUploadOpen}
        title="Subir Documentos (Máx. 4)"
        onClose={() => setIsMultiUploadOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-[11px] text-slate-500">Puedes asignar un nombre personalizado a cada archivo antes de subirlo.</p>
          
          <div className="space-y-3">
            {multiUploadSlots.map((slot, idx) => {
              const matchedExistingFile = multiUploadHistoryFiles.find(f => 
                (f.originalName || '').toLowerCase().trim() === (slot.name || '').toLowerCase().trim()
              );
              return (
                <div key={idx} className={`p-3 rounded-2xl border ${isPremiumDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Nombre del Archivo</label>
                      <input
                        type="text"
                        value={slot.name}
                        onChange={(e) => {
                          const newSlots = [...multiUploadSlots];
                          newSlots[idx].name = e.target.value;
                          setMultiUploadSlots(newSlots);
                        }}
                        className={`w-full text-xs rounded-lg px-3 py-2 border outline-none ${
                          isPremiumDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                        placeholder="Ej. Certificado de Calibración"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id={`multi-file-${idx}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          const newSlots = [...multiUploadSlots];
                          newSlots[idx].file = file;
                          if (file && !newSlots[idx].name) newSlots[idx].name = file.name;
                          setMultiUploadSlots(newSlots);
                        }}
                      />
                      <label
                        htmlFor={`multi-file-${idx}`}
                        className={`flex-1 text-center py-2 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                          slot.file 
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
                            : 'bg-slate-200/50 border-slate-300 text-slate-600'
                        }`}
                      >
                        {slot.file ? '✅ Archivo Seleccionado' : '📁 Seleccionar Archivo'}
                      </label>
                      {slot.file && (
                        <button
                          onClick={() => {
                            const newSlots = [...multiUploadSlots];
                            newSlots[idx].file = null;
                            setMultiUploadSlots(newSlots);
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  {slot.file && (
                    <div className="mt-1 text-[9px] text-slate-400 truncate">
                      Archivo: {slot.file.name}
                    </div>
                  )}
                  {matchedExistingFile && (
                    <div className={`mt-2.5 flex items-center justify-between border-t border-dashed pt-2 text-[11px] ${
                      isPremiumDarkMode ? 'border-slate-800' : 'border-slate-200'
                    }`}>
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>✓ Guardado en el servidor</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const existingFileName = (matchedExistingFile.path || '').split('/').pop();
                          openPreview(existingFileName, matchedExistingFile.originalName);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                          isPremiumDarkMode ? 'bg-brand-500/20 hover:bg-brand-500/30 text-brand-400' : 'bg-brand-50 hover:bg-brand-100 text-brand-600'
                        }`}
                      >
                        👁️ Ver Archivo
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsMultiUploadOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleMultiUpload}
              disabled={isSubmitting || !multiUploadSlots.some(s => s.file)}
              className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold disabled:opacity-50 transition-all shadow-lg shadow-brand-600/20"
            >
              {isSubmitting ? 'Subiendo...' : 'Subir Archivos'}
            </button>
          </div>
        </div>
      </TaskModal>

      {/* Files History Modal */}
      <TaskModal
        isOpen={filesModalOpen}
        title="Historial de Archivos"
        onClose={() => {
          setFilesModalOpen(false);
          setModalFiles([]);
          closePreview();
        }}
      >
        <div className="space-y-3">
          {modalLoadingFiles ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            </div>
          ) : (
            <>
              {isPreviewOpen && previewUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{previewName}</div>
                    <div>
                      <button onClick={closePreview} className="px-3 py-1 rounded-lg bg-white border text-xs">Cerrar</button>
                      <a href={previewUrl} download={previewName || undefined} className="ml-2 px-3 py-1 rounded-lg bg-white border text-xs">Descargar</a>
                    </div>
                  </div>
                  <div className="border rounded-md overflow-hidden bg-white">
                    {previewExt === 'pdf' ? (
                      <iframe src={previewUrl} className="w-full h-[60vh]" />
                    ) : (
                      <img src={previewUrl || undefined} alt={previewName || 'Archivo'} className="w-full h-[60vh] object-contain bg-slate-900" />
                    )}
                  </div>
                </div>
              ) : modalFiles.length === 0 ? (
                <p className="text-sm text-slate-500">No hay archivos en el historial.</p>
              ) : (
                modalFiles.map((f: any) => {
                  const fileName = (f.path || '').split('/').pop();
                  return (
                    <div key={f.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-3">
                      <div>
                        <div className="font-semibold text-sm">{f.originalName}</div>
                        <div className="text-xs text-slate-500">{new Date(f.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openPreview(fileName, f.originalName)}
                          className="px-3 py-1 rounded-lg bg-sky-50 border border-sky-100 text-sky-700 text-xs font-semibold cursor-pointer hover:bg-sky-100 transition-colors"
                        >
                          Ver
                        </button>
                        <a
                          href={`/api/tareas/archivo?file=${encodeURIComponent(fileName)}`}
                          download={f.originalName}
                          className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                        >
                          Descargar
                        </a>
                        {user?.role !== 'VIEWER' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteHistoryFile(f.id)}
                            className="p-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Eliminar archivo del historial"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
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
