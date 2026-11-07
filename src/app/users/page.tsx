'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MtoTopNavbar from '@/components/MtoTopNavbar';
import MtoSidebar from '@/components/MtoSidebar';
import { 
  ArrowLeft, 
  UserPlus, 
  Trash2, 
  Edit3, 
  User as UserIcon, 
  Lock, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Wrench,
  Users,
  X
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

export default function UserManagement() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sidebar states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState('');
  
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('CREATOR'); // DEFAULT TO CREATOR

  const [formError, setFormError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mto_sidebar_collapsed');
      if (saved !== null) setSidebarCollapsed(saved === 'true');
    }
  }, []);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('mto_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Load active user and user list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // 1. Verify role
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        if (meData.user.role !== 'ADMIN') {
          alert('Acceso denegado. Solo administradores pueden ver esta página.');
          router.push('/');
          return;
        }
        setCurrentUser(meData.user);

        // 2. Load users
        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        if (usersRes.ok) {
          setUsers(usersData.users);
        } else {
          setError(usersData.error || 'Error al cargar usuarios');
        }
      } catch (err) {
        setError('Error de comunicación con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingUserId('');
    setFormUsername('');
    setFormPassword('');
    setFormName('');
    setFormRole('CREATOR');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setModalMode('edit');
    setEditingUserId(user.id);
    setFormUsername(user.username);
    setFormPassword('');
    setFormName(user.name);
    setFormRole(user.role);
    setFormError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setModalLoading(true);

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername,
            password: formPassword,
            name: formName,
            role: formRole,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setUsers([data.user, ...users]);
          setShowModal(false);
          setSuccess('Usuario creado con éxito');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setFormError(data.error || 'Error al crear usuario');
        }
      } else {
        const payload: any = {
          name: formName,
          role: formRole,
        };

        if (formPassword.trim()) {
          payload.password = formPassword;
        }

        const res = await fetch(`/api/users?id=${editingUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setUsers(users.map(u => u.id === editingUserId ? data.user : u));
          setShowModal(false);
          setSuccess('Usuario actualizado con éxito');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setFormError(data.error || 'Error al actualizar usuario');
        }
      }
    } catch (err) {
      setFormError('Error de red al conectar con la API');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (id === currentUser?.id) {
      alert('No puedes eliminar tu propia cuenta activa de administrador.');
      return;
    }

    if (!confirm(`¿Está seguro que desea eliminar la cuenta de "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(users.filter(u => u.id !== id));
        setSuccess('Usuario eliminado con éxito');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Error al eliminar usuario');
      }
    } catch (err) {
      setError('Error al conectar para eliminar usuario');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#080d1a] gap-4">
        <svg className="animate-spin h-10 w-10 text-cyan-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-400 font-medium">Cargando directorio de usuarios...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d1a] flex flex-col text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <MtoTopNavbar
        user={currentUser}
        onLogout={handleLogout}
        mobileMenuOpen={mobileSidebarOpen}
        onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Main Container with Sidebar */}
      <div className="flex-1 flex min-h-[calc(100vh-3.5rem)]">
        <MtoSidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onToggleCollapse={handleToggleSidebar}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          userRole={currentUser?.role}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 bg-[#080d1a] overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <Users className="w-7 h-7 text-cyan-400" />
                <span>Control de Usuarios</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Agrega, modifica o elimina los usuarios que acceden al sistema de Mantenimiento.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer text-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Nuevo Usuario</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-xs animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs animate-fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-[#0b0f19] rounded-2xl border border-[#1e293b] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="bg-[#0d1324]/80 text-slate-400 text-[11px] uppercase font-bold border-b border-[#1e293b]">
                  <tr>
                    <th className="py-4 px-6">Nombre</th>
                    <th className="py-4 px-6">Usuario</th>
                    <th className="py-4 px-6">Rol de Acceso</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#121c33]/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-white text-sm">{u.name}</td>
                      <td className="py-4 px-6 font-mono text-cyan-400 text-xs">@{u.username}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-xl text-xs font-bold border ${
                          u.role === 'ADMIN' ? 'bg-blue-500/10 text-cyan-300 border-blue-500/30' :
                          u.role === 'CREATOR' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          <Shield className="w-3.5 h-3.5" />
                          {u.role === 'ADMIN' ? 'Administrador' :
                           u.role === 'CREATOR' ? 'Técnico / Editor' :
                           'Supervisor / Lector'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                          title="Editar Usuario"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          disabled={u.id === currentUser?.id}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                          title={u.id === currentUser?.id ? 'No puedes eliminarte a ti mismo' : 'Eliminar Usuario'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-white/10 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="py-4.5 px-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-white text-base tracking-wide uppercase">
                {modalMode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2 text-rose-300 text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nombre Completo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Juan Pérez"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    disabled={modalLoading}
                    className="w-full bg-[#131d33] border border-slate-700/80 rounded-xl py-2 pl-10 pr-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nombre de Usuario</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-cyan-400 text-sm font-semibold select-none">
                    @
                  </span>
                  <input
                    type="text"
                    placeholder="juanp"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    disabled={modalLoading}
                    className="w-full bg-[#131d33] border border-slate-700/80 rounded-xl py-2 pl-9 pr-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  Contraseña {modalMode === 'edit' && <span className="text-[10px] text-slate-500 font-normal">(Dejar en blanco para no cambiar)</span>}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    placeholder={modalMode === 'create' ? '••••••••' : 'Nueva contraseña (opcional)'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    disabled={modalLoading}
                    className="w-full bg-[#131d33] border border-slate-700/80 rounded-xl py-2 pl-10 pr-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                    required={modalMode === 'create'}
                  />
                </div>
              </div>

              {/* Role Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Rol de Acceso</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Shield className="w-4 h-4" />
                  </span>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    disabled={modalLoading || (editingUserId === currentUser?.id && formRole !== 'ADMIN')}
                    className="w-full bg-[#131d33] border border-slate-700/80 rounded-xl py-2 pl-10 pr-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                  >
                    <option value="CREATOR">Técnico / Editor (puede crear y modificar reportes)</option>
                    <option value="VIEWER">Supervisor / Lector (solo puede visualizar y exportar)</option>
                    <option value="ADMIN">Administrador (control total y gestión de usuarios)</option>
                  </select>
                </div>
                {editingUserId === currentUser?.id && (
                  <p className="text-[10px] text-amber-400/80 mt-1">
                    No puedes quitarte el rol de Administrador a ti mismo para evitar perder el acceso.
                  </p>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={modalLoading}
                  className="py-2 px-4 border border-slate-700 rounded-xl text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {modalLoading && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>{modalMode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
