'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    setFormPassword(''); // blank implies no password change
    setFormName(user.name);
    setFormRole(user.role);
    setFormError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setModalLoading(true);

    if (!formUsername.trim() || !formName.trim() || !formRole) {
      setFormError('Por favor complete todos los campos obligatorios.');
      setModalLoading(false);
      return;
    }

    if (modalMode === 'create' && !formPassword.trim()) {
      setFormError('La contraseña es obligatoria para nuevos usuarios.');
      setModalLoading(false);
      return;
    }

    try {
      let res;
      if (modalMode === 'create') {
        res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername,
            password: formPassword,
            name: formName,
            role: formRole
          })
        });
      } else {
        res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUserId,
            username: formUsername,
            name: formName,
            role: formRole,
            ...(formPassword.trim() ? { password: formPassword } : {})
          })
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        // Reload list
        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        setUsers(usersData.users);

        setSuccess(modalMode === 'create' ? 'Usuario creado con éxito' : 'Usuario modificado con éxito');
        setShowModal(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setFormError(data.error || 'Error al guardar los datos');
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <svg className="animate-spin h-10 w-10 text-brand-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-500 font-medium">Cargando directorio de usuarios...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Banner */}
      <header className="bg-slate-900 text-white shadow-xl shadow-slate-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
              title="Volver al Panel"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-emerald-500 flex items-center justify-center shadow-md">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">ASEPSIS SYSTEMS</h1>
                <p className="text-[10px] text-slate-400 font-light">Control de Reportes de Mantenimiento</p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="bg-brand-500/20 text-brand-400 border border-brand-500/30 py-1.5 px-3 rounded-2xl text-xs font-semibold">
              Módulo de Administración
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Control de Usuarios</h2>
            <p className="text-sm text-slate-500">Agrega, modifica o elimina los usuarios que acceden al sistema.</p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 px-5 rounded-2xl shadow-lg shadow-brand-600/10 active:scale-[0.98] transition-all"
          >
            <UserPlus className="w-4.5 h-4.5" />
            <span>Crear Nuevo Usuario</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-4.5 px-6">Nombre</th>
                  <th className="py-4.5 px-6">Usuario</th>
                  <th className="py-4.5 px-6">Rol de Acceso</th>
                  <th className="py-4.5 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800">{u.name}</td>
                    <td className="py-4 px-6 font-mono text-slate-600">@{u.username}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-semibold ${
                        u.role === 'ADMIN' ? 'bg-brand-50 text-brand-700 border border-brand-100' :
                        u.role === 'CREATOR' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-slate-100 text-slate-700 border border-slate-200/40'
                      }`}>
                        <Shield className="w-3.5 h-3.5" />
                        {u.role === 'ADMIN' ? 'Administrador' :
                         u.role === 'CREATOR' ? 'Técnico / Editor' :
                         'Supervisor / Lector'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="Editar Usuario"
                      >
                        <Edit3 className="w-4.5 h-4.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        disabled={u.id === currentUser?.id}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        title={u.id === currentUser?.id ? 'No puedes eliminarte a ti mismo' : 'Eliminar Usuario'}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="py-4.5 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base">
                {modalMode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs animate-shake">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Nombre Completo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Juan Pérez"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    disabled={modalLoading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-slate-800 text-sm focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Nombre de Usuario</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-semibold select-none">
                    @
                  </span>
                  <input
                    type="text"
                    placeholder="juanp"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    disabled={modalLoading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-7 pr-3 text-slate-800 text-sm focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Contraseña {modalMode === 'edit' && <span className="text-[10px] text-slate-400 font-normal">(Dejar en blanco para no cambiar)</span>}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    placeholder={modalMode === 'create' ? '••••••••' : 'Nueva contraseña (opcional)'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    disabled={modalLoading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-slate-800 text-sm focus:outline-none focus:border-brand-500"
                    required={modalMode === 'create'}
                  />
                </div>
              </div>

              {/* Role Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Rol de Acceso</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Shield className="w-4 h-4" />
                  </span>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    disabled={modalLoading || (editingUserId === currentUser?.id && formRole !== 'ADMIN')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-slate-800 text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="CREATOR">Técnico / Editor (puede crear y modificar reportes)</option>
                    <option value="VIEWER">Supervisor / Lector (solo puede visualizar y exportar)</option>
                    <option value="ADMIN">Administrador (control total y gestión de usuarios)</option>
                  </select>
                </div>
                {editingUserId === currentUser?.id && (
                  <p className="text-[9px] text-slate-400">
                    No puedes quitarte el rol de Administrador a ti mismo para evitar perder el acceso.
                  </p>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={modalLoading}
                  className="py-2 px-4 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 active:scale-98 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="py-2 px-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm shadow-md shadow-brand-600/10 active:scale-98 transition-all flex items-center gap-1.5"
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
