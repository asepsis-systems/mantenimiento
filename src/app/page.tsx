'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  LogOut, 
  User as UserIcon, 
  Wrench,
  AlertCircle,
  CheckCircle,
  Search,
  Users,
  FileText,
  ToggleLeft
} from 'lucide-react';

import { TaskCard } from '@/components/TaskCard';
import { TaskStatus } from '@/components/TaskStatus';
import { TaskModal } from '@/components/TaskModal';
import { TaskForm } from '@/components/TaskForm';
import { TaskResponsible } from '@/components/TaskResponsible';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters & Inputs
  const [selectedRespFilter, setSelectedRespFilter] = useState<string | null>(null);
  const [searchRespQuery, setSearchRespQuery] = useState('');
  const [newRespName, setNewRespName] = useState('');

  // Modal control states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Tarea | null>(null);
  
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
  const handleCreateOrUpdateTask = async (values: { responsable: string; descripcion: string; estado: string }) => {
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

  const handleToggleStatus = async (id: string, targetEstado: string) => {
    // Find task and original state for reversion
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
        // Revert on error
        setTareas(prev => prev.map(t => t.id === id ? { ...t, estado: originalEstado } : t));
        showFeedback('error', data.error || 'Error al cambiar estado.');
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

  // --- FILTERS & SEARCH CALCULATIONS ---
  const filteredResponsibles = responsables.filter(r => 
    r.nombre.toLowerCase().includes(searchRespQuery.toLowerCase())
  );

  const filteredTareas = tareas.filter(t => {
    if (selectedRespFilter) {
      return t.responsable.toLowerCase() === selectedRespFilter.toLowerCase();
    }
    return true;
  });

  const isViewer = user?.role === 'VIEWER';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <svg className="animate-spin h-10 w-10 text-brand-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-500 font-medium animate-pulse text-sm">Cargando panel de tareas...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Banner */}
      <header className="bg-slate-900 text-white shadow-xl shadow-slate-950/10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-1 shadow-md shrink-0 flex items-center justify-center w-12 h-10">
              <img 
                src="/logo2.jpg" 
                alt="Asepsis Logo" 
                className="h-8 w-auto object-contain rounded-lg"
              />
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1350px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Actions bar / Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Tareas de Mantenimiento</h2>
            <p className="text-sm text-slate-500">Administra las actividades y responsabilidades semanales.</p>
          </div>
        </div>

        {/* Global Success / Error banners */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Kanban Board Container */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Grid Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-20 pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            
            {/* COLUMN 1: RESPONSABLE */}
            <div className="bg-slate-900/65 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col max-h-[720px] min-h-[500px]">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-400" />
                  <h3 className="font-bold text-white text-sm uppercase tracking-wide">Responsable</h3>
                </div>
                <span className="text-[10px] text-slate-400 bg-white/5 py-0.5 px-2 rounded-full border border-white/5 font-semibold">
                  {responsables.length}
                </span>
              </div>

              {/* Search input */}
              <div className="relative mt-3 shrink-0">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar responsable..."
                  value={searchRespQuery}
                  onChange={(e) => setSearchRespQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 hover:border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>

              {/* Add Responsible Form (Technician/Admin only) */}
              {!isViewer && (
                <form onSubmit={handleAddResponsible} className="flex gap-2 mt-3 shrink-0">
                  <input
                    type="text"
                    placeholder="Nuevo responsable..."
                    value={newRespName}
                    onChange={(e) => setNewRespName(e.target.value)}
                    className="flex-1 bg-slate-950 border border-white/5 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 uppercase font-medium"
                  />
                  <button
                    type="submit"
                    className="bg-brand-600 hover:bg-brand-500 text-white rounded-xl p-2 transition-colors flex items-center justify-center shrink-0 active:scale-95"
                    title="Agregar Responsable"
                  >
                    <Plus className="w-4.5 h-4.5" />
                  </button>
                </form>
              )}

              {/* Responsibles List */}
              <div className="space-y-2.5 overflow-y-auto flex-1 mt-4 pr-1 py-1">
                {/* Clear filter/Todos Option */}
                <div
                  onClick={() => setSelectedRespFilter(null)}
                  className={`border rounded-xl p-3 flex items-center gap-3 transition-all duration-200 cursor-pointer ${
                    selectedRespFilter === null
                      ? 'bg-brand-600/20 border-brand-500/50 ring-2 ring-brand-500/10'
                      : 'bg-slate-800/60 border-white/5 hover:bg-slate-850/80 hover:border-white/10'
                  }`}
                >
                  <div className="w-7.5 h-7.5 rounded-full bg-slate-700/65 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                    *
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wide ${selectedRespFilter === null ? 'text-brand-300' : 'text-slate-200'}`}>
                    MOSTRAR TODOS
                  </span>
                </div>

                {filteredResponsibles.length === 0 ? (
                  <div className="h-28 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-xs text-slate-650 bg-white/2 italic">
                    Sin responsables encontrados
                  </div>
                ) : (
                  filteredResponsibles.map((r) => (
                    <TaskResponsible
                      key={r.id}
                      responsable={r}
                      isSelected={selectedRespFilter === r.nombre}
                      onSelect={() => setSelectedRespFilter(r.nombre)}
                      onRename={(id, curName) => {
                        setRenamingResp(r);
                        setNewRenamedName(curName);
                        setIsRenameModalOpen(true);
                      }}
                      onDelete={(id) => setConfirmDeleteRespId(id)}
                      isViewer={isViewer}
                    />
                  ))
                )}
              </div>
            </div>

            {/* COLUMN 2: DESCRIPCIÓN */}
            <div className="bg-slate-900/65 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col max-h-[720px] min-h-[500px]">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-400" />
                  <h3 className="font-bold text-white text-sm uppercase tracking-wide">Descripción</h3>
                </div>
                <span className="text-[10px] text-slate-400 bg-white/5 py-0.5 px-2 rounded-full border border-white/5 font-semibold">
                  {filteredTareas.length}
                </span>
              </div>

              {/* Add Task Button (Admin/Creator only) */}
              {!isViewer && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 hover:border-brand-500/40 text-brand-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-[0.98] shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Nueva Tarea</span>
                </button>
              )}

              {/* Task Cards List */}
              <div className="space-y-3.5 overflow-y-auto flex-1 mt-4 pr-1 py-1">
                {filteredTareas.length === 0 ? (
                  <div className="h-28 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-xs text-slate-650 bg-white/2 italic">
                    {selectedRespFilter 
                      ? 'No hay tareas asignadas a este responsable' 
                      : 'No hay tareas registradas'}
                  </div>
                ) : (
                  filteredTareas.map((tarea) => (
                    <TaskCard
                      key={tarea.id}
                      tarea={tarea}
                      onEdit={(t) => {
                        setEditingTask(t);
                        setIsTaskModalOpen(true);
                      }}
                      onDelete={(id) => setConfirmDeleteId(id)}
                      isViewer={isViewer}
                    />
                  ))
                )}
              </div>
            </div>

            {/* COLUMN 3: ESTADO */}
            <div className="bg-slate-900/65 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col max-h-[720px] min-h-[500px]">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <ToggleLeft className="w-4 h-4 text-brand-400" />
                  <h3 className="font-bold text-white text-sm uppercase tracking-wide">Estado</h3>
                </div>
                <span className="text-[10px] text-slate-400 bg-white/5 py-0.5 px-2 rounded-full border border-white/5 font-semibold">
                  {filteredTareas.length}
                </span>
              </div>

              {/* Task Status Toggles List */}
              <div className="space-y-3.5 overflow-y-auto flex-1 mt-4 pr-1 py-1">
                {filteredTareas.length === 0 ? (
                  <div className="h-28 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-xs text-slate-650 bg-white/2 italic">
                    Sin tareas para actualizar
                  </div>
                ) : (
                  filteredTareas.map((tarea) => (
                    <TaskStatus
                      key={`status-${tarea.id}`}
                      tarea={tarea}
                      onToggleStatus={handleToggleStatus}
                      isViewer={isViewer}
                    />
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

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
          initialValues={
            editingTask
              ? {
                  responsable: editingTask.responsable,
                  descripcion: editingTask.descripcion,
                  estado: editingTask.estado
                }
              : selectedRespFilter
              ? {
                  responsable: selectedRespFilter,
                  descripcion: '',
                  estado: 'PENDIENTE'
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

      {/* Task Delete Confirmation Modal */}
      <TaskModal
        isOpen={confirmDeleteId !== null}
        title="Confirmar Eliminación"
        onClose={() => setConfirmDeleteId(null)}
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-xs leading-relaxed">
            ¿Está seguro de que desea eliminar esta tarea? Esta acción es definitiva y no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setConfirmDeleteId(null)}
              className="py-2 px-4 rounded-xl hover:bg-white/5 border border-white/10 text-xs font-semibold text-slate-400 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteTask}
              className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
            >
              Eliminar
            </button>
          </div>
        </div>
      </TaskModal>

      {/* Responsible Delete Confirmation Modal */}
      <TaskModal
        isOpen={confirmDeleteRespId !== null}
        title="Confirmar Eliminación de Responsable"
        onClose={() => setConfirmDeleteRespId(null)}
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-xs leading-relaxed">
            ¿Está seguro de que desea eliminar este responsable? Las tareas asignadas a esta persona no serán borradas, pero no estarán asociadas a un responsable registrado.
          </p>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setConfirmDeleteRespId(null)}
              className="py-2 px-4 rounded-xl hover:bg-white/5 border border-white/10 text-xs font-semibold text-slate-400 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteResponsible}
              className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
            >
              Eliminar
            </button>
          </div>
        </div>
      </TaskModal>

    </div>
  );
}
