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
  Search,
  FileCheck,
  AlertTriangle,
  Clock,
  Calendar,
  X,
  Folder,
  FolderPlus,
  Upload,
  FileText,
  Eye,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

interface License {
  id: string;
  name: string;
  entity: string;
  code: string | null;
  issueDate: string;
  expiryDate: string;
  status: string; // "VIGENTE" | "VENCIDO" | "EN_TRAMITE"
  createdAt: string;
  updatedAt: string;
  archivoNombre: string | null;
  archivoPath: string | null;
  carpetaId: string | null;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

export default function LicensesPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Folders & Navigation states
  const [carpetas, setCarpetas] = useState<any[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // Dialog/Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEntity, setFormEntity] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formIssueDate, setFormIssueDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formStatus, setFormStatus] = useState('VIGENTE');
  const [formCarpetaId, setFormCarpetaId] = useState('');
  
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [modalFile, setModalFile] = useState<File | null>(null);
  
  const [actionLoading, setActionLoading] = useState(false);

  // Security: Logout on back navigation
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {
        console.error(err);
      } finally {
        window.location.href = '/login';
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Fetch folders
  const fetchCarpetas = async () => {
    try {
      const res = await fetch('/api/licencias/carpetas');
      const data = await res.json();
      if (data.success) {
        setCarpetas(data.carpetas);
      }
    } catch (err) {
      console.error('Error al cargar carpetas:', err);
    }
  };

  // Fetch licenses
  const fetchLicenses = async (folderId: string | null) => {
    try {
      const url = `/api/licencias?carpetaId=${folderId || 'null'}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLicenses(data.licenses);
      } else {
        setError(data.error || 'Error al cargar licencias');
      }
    } catch (err) {
      setError('Error al comunicar con el servidor');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);
        await fetchCarpetas();
        await fetchLicenses(currentFolderId);
      } catch (err) {
        setError('Error de comunicación con el servidor');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // Refetch licenses when active folder changes
  useEffect(() => {
    if (user) {
      fetchLicenses(currentFolderId);
    }
  }, [currentFolderId, user]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setFormEntity('');
    setFormCode('');
    setFormIssueDate('');
    setFormExpiryDate('');
    setFormStatus('VIGENTE');
    setFormCarpetaId(currentFolderId || '');
    setModalFile(null);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (lic: License) => {
    setEditingId(lic.id);
    setFormName(lic.name);
    setFormEntity(lic.entity);
    setFormCode(lic.code || '');
    setFormIssueDate(lic.issueDate);
    setFormExpiryDate(lic.expiryDate);
    setFormStatus(lic.status);
    setFormCarpetaId(lic.carpetaId || '');
    setModalFile(null);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEntity.trim() || !formIssueDate.trim() || !formExpiryDate.trim()) {
      setError('Nombre, Entidad, Emisión y Vencimiento son obligatorios.');
      return;
    }

    setActionLoading(true);
    setError('');

    let finalId = editingId;

    try {
      // Step 1: Upload file if selected in the modal
      if (modalFile) {
        const formData = new FormData();
        formData.append('file', modalFile);
        if (editingId) {
          formData.append('id', editingId);
        } else if (formCarpetaId) {
          formData.append('carpetaId', formCarpetaId);
        }

        const uploadRes = await fetch('/api/licencias/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Error al subir el archivo adjunto.');
        }
        
        if (!editingId && uploadData.license) {
          finalId = uploadData.license.id;
        }
      }

      // Step 2: Save the license details
      const payload = {
        name: formName.trim(),
        entity: formEntity.trim(),
        code: formCode.trim() || null,
        issueDate: formIssueDate.trim(),
        expiryDate: formExpiryDate.trim(),
        status: formStatus,
        carpetaId: formCarpetaId || null
      };

      const url = finalId ? `/api/licencias/${finalId}` : '/api/licencias';
      const method = finalId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        setModalFile(null);
        await fetchLicenses(currentFolderId);
      } else {
        setError(data.error || 'Error al guardar licencia.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Está seguro de eliminar la licencia/permiso "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/licencias/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchLicenses(currentFolderId);
      } else {
        alert(data.error || 'Error al eliminar licencia');
      }
    } catch (err) {
      alert('Error de conexión al eliminar licencia');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/licencias/carpetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newFolderName.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewFolderName('');
        setIsFolderModalOpen(false);
        await fetchCarpetas();
      } else {
        alert(data.error || 'Error al crear carpeta');
      }
    } catch (err) {
      alert('Error de red al crear carpeta');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`¿Está seguro de eliminar la carpeta "${folderName}"? Las licencias dentro de ella se moverán a la raíz.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/licencias/carpetas/${folderId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (currentFolderId === folderId) {
          setCurrentFolderId(null);
        }
        await fetchCarpetas();
        await fetchLicenses(currentFolderId);
      } else {
        alert(data.error || 'Error al eliminar carpeta');
      }
    } catch (err) {
      alert('Error de red al eliminar carpeta');
    }
  };

  const handleQuickUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setActionLoading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    if (currentFolderId) {
      formData.append('carpetaId', currentFolderId);
    }

    try {
      const res = await fetch('/api/licencias/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        await fetchLicenses(currentFolderId);
        if (data.license) {
          openEditModal(data.license);
        }
      } else {
        alert(data.error || 'Error al subir archivo');
      }
    } catch (err) {
      alert('Error de red al subir archivo');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculations for dashboard widgets
  const totalLic = licenses.length;
  const expiredLic = licenses.filter(l => l.status === 'VENCIDO').length;
  const pendingLic = licenses.filter(l => l.status === 'EN_TRAMITE').length;

  // Filter licenses based on query
  const filteredLicenses = licenses.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.code && l.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <svg className="animate-spin h-10 w-10 text-brand-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-500 font-medium animate-pulse">Cargando módulo de licencias...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Banner */}
      <header className="bg-slate-900 text-white shadow-xl shadow-slate-950/10">
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
              className="py-1.5 px-3.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
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
              className="py-1.5 px-3.5 rounded-xl text-xs font-semibold text-white bg-white/10 transition-all"
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Licencias y Permisos</h2>
            <p className="text-sm text-slate-500">Control de vigencia, fechas de vencimiento y renovación de autorizaciones legales.</p>
          </div>

          {user?.role !== 'VIEWER' && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsFolderModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl shadow-xs active:scale-[0.98] transition-all text-xs cursor-pointer"
              >
                <FolderPlus className="w-4.5 h-4.5 text-slate-500" />
                <span>Nueva Carpeta</span>
              </button>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl shadow-xs active:scale-[0.98] transition-all text-xs cursor-pointer"
              >
                <Upload className="w-4.5 h-4.5 text-slate-500" />
                <span>Subir Archivo</span>
              </button>

              <button
                onClick={openCreateModal}
                className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-brand-600/10 active:scale-[0.98] transition-all text-xs cursor-pointer"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Registrar Licencia</span>
              </button>
            </div>
          )}
        </div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex items-center gap-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Total Licencias</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalLic} registros</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex items-center gap-4 shadow-xs">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${expiredLic > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Licencias Vencidas</p>
              <p className={`text-2xl font-bold mt-0.5 ${expiredLic > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{expiredLic} críticas</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex items-center gap-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">En Trámite / Renovación</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{pendingLic} procesos</p>
            </div>
          </div>
        </div>

        {/* Breadcrumbs Navigation */}
        <div className="mb-6 flex items-center gap-2 text-sm font-semibold">
          {currentFolderId !== null ? (
            <>
              <button
                onClick={() => setCurrentFolderId(null)}
                className="text-slate-500 hover:text-brand-600 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Raíz</span>
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-amber-500 fill-amber-100/50" />
                <span>Carpeta: {carpetas.find(c => c.id === currentFolderId)?.nombre || 'Cargando...'}</span>
              </span>
            </>
          ) : (
            <span className="text-slate-400 flex items-center gap-1">
              <span>Ubicación actual:</span>
              <span className="text-slate-800 font-bold">Raíz</span>
            </span>
          )}
        </div>

        {/* Folders Explorer (Grid) - only show at root directory */}
        {currentFolderId === null && carpetas.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Carpetas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {carpetas.map((folder) => {
                return (
                  <div
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="group relative flex flex-col p-4 rounded-2xl border bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm text-slate-700 transition-all cursor-pointer select-none"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Folder className="w-8 h-8 text-amber-500 fill-amber-100/40 group-hover:text-amber-600 transition-colors" />
                      {user?.role !== 'VIEWER' && (
                        <button
                          onClick={(e) => handleDeleteFolder(folder.id, folder.nombre, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Eliminar Carpeta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="text-xs font-semibold truncate leading-tight">{folder.nombre}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6 relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4.5 h-4.5" />
          </div>
          <input
            type="text"
            placeholder="Buscar licencia por nombre, entidad o código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 text-sm transition-all"
          />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="p-4">N° Documento</th>
                  <th className="p-4">Nombre / Autorización</th>
                  <th className="p-4">Entidad Emisora</th>
                  <th className="p-4 text-center">F. Emisión</th>
                  <th className="p-4 text-center">F. Vencimiento</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center w-32">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      No se encontraron licencias en esta carpeta.
                    </td>
                  </tr>
                ) : (
                  filteredLicenses.map((lic) => {
                    const isExpired = lic.status === 'VENCIDO';
                    const isInProcess = lic.status === 'EN_TRAMITE';
                    return (
                      <tr key={lic.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-xs text-slate-500">
                          {lic.code ? lic.code : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-semibold text-slate-800">{lic.name}</div>
                            {lic.archivoNombre && (
                              <a
                                href={`/api/licencias/archivo?id=${lic.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 mt-1 text-[11px] text-brand-600 hover:text-brand-700 font-medium hover:underline bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100"
                              >
                                <FileText className="w-3.5 h-3.5 text-brand-500" />
                                <span>{lic.archivoNombre}</span>
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">{lic.entity}</td>
                        <td className="p-4 text-center text-slate-500 text-xs font-mono">{lic.issueDate}</td>
                        <td className={`p-4 text-center text-xs font-mono font-bold ${isExpired ? 'text-rose-600' : 'text-slate-600'}`}>
                          {lic.expiryDate}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-bold border ${
                            isExpired ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            isInProcess ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {lic.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            {lic.archivoPath && (
                              <a
                                href={`/api/licencias/archivo?id=${lic.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                title="Ver / Descargar Archivo"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                            )}
                            {user?.role !== 'VIEWER' && (
                              <>
                                <button
                                  onClick={() => openEditModal(lic)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(lic.id, lic.name)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* EDIT/CREATE DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">
                {editingId ? 'Editar Registro de Autorización' : 'Registrar Nueva Licencia / Permiso'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Permiso / Licencia</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ej. Certificado de Inspección de Seguridad"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Entidad Emisora</label>
                  <input
                    type="text"
                    value={formEntity}
                    onChange={(e) => setFormEntity(e.target.value)}
                    placeholder="ej. Diresa / Municipalidad"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">N° de Documento</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="LIC-2026-098"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">F. de Emisión</label>
                  <input
                    type="text"
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">F. de Vencimiento</label>
                  <input
                    type="text"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Estado de Vigencia</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  >
                    <option value="VIGENTE">VIGENTE</option>
                    <option value="VENCIDO">VENCIDO</option>
                    <option value="EN_TRAMITE">EN TRÁMITE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Carpeta</label>
                  <select
                    value={formCarpetaId}
                    onChange={(e) => setFormCarpetaId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  >
                    <option value="">Ninguna (Raíz)</option>
                    {carpetas.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1 border-t border-slate-100 pt-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Archivo Adjunto (PDF, JPG, PNG)
                </label>
                {editingId && licenses.find(l => l.id === editingId)?.archivoNombre && (
                  <div className="text-[11px] text-slate-600 mb-2 flex items-center gap-1.5 bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold truncate">
                      Actual: {licenses.find(l => l.id === editingId)?.archivoNombre}
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setModalFile(e.target.files[0]);
                    } else {
                      setModalFile(null);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Guardando...' : 'Guardar Autorización'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW FOLDER DIALOG */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Crear Nueva Carpeta</h3>
              <button 
                onClick={() => setIsFolderModalOpen(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de la Carpeta</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="ej. Autorizaciones Diresa"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Creando...' : 'Crear Carpeta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK UPLOAD DIALOG */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Subir Documento de Licencia</h3>
              <button 
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFile(null);
                }} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleQuickUpload} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Seleccionar Archivo (PDF, JPG, PNG)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setUploadFile(e.target.files[0]);
                    } else {
                      setUploadFile(null);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setUploadFile(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !uploadFile}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Subiendo...' : 'Subir Archivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
