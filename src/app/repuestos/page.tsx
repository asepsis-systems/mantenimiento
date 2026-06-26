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
  Package,
  AlertTriangle,
  Coins,
  MapPin,
  X
} from 'lucide-react';

interface SparePart {
  id: string;
  name: string;
  code: string;
  stock: number;
  minStock: number;
  price: number | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

export default function SparePartsPage() {
  const router = useRouter();
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog/Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formStock, setFormStock] = useState('0');
  const [formMinStock, setFormMinStock] = useState('0');
  const [formPrice, setFormPrice] = useState('');
  const [formLocation, setFormLocation] = useState('');
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

  // Fetch user and spare parts
  const fetchSpareParts = async () => {
    try {
      const repRes = await fetch('/api/repuestos');
      const repData = await repRes.json();
      if (repData.success) {
        setSpareParts(repData.spareParts);
      } else {
        setError(repData.error || 'Error al cargar repuestos');
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
        await fetchSpareParts();
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
      console.error(err);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setFormCode('');
    setFormStock('0');
    setFormMinStock('0');
    setFormPrice('');
    setFormLocation('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (part: SparePart) => {
    setEditingId(part.id);
    setFormName(part.name);
    setFormCode(part.code);
    setFormStock(String(part.stock));
    setFormMinStock(String(part.minStock));
    setFormPrice(part.price !== null ? String(part.price) : '');
    setFormLocation(part.location || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      setError('Nombre y código son obligatorios.');
      return;
    }

    setActionLoading(true);
    setError('');

    const payload = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      stock: Number(formStock) || 0,
      minStock: Number(formMinStock) || 0,
      price: formPrice.trim() ? Number(formPrice) : null,
      location: formLocation.trim() || null
    };

    try {
      const url = editingId ? `/api/repuestos/${editingId}` : '/api/repuestos';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        await fetchSpareParts();
      } else {
        setError(data.error || 'Error al guardar repuesto.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Está seguro de eliminar el repuesto "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/repuestos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchSpareParts();
      } else {
        alert(data.error || 'Error al eliminar repuesto');
      }
    } catch (err) {
      alert('Error de conexión al eliminar repuesto');
    }
  };

  // Calculations for dashboard summary widgets
  const totalItems = spareParts.length;
  const alertItems = spareParts.filter(p => p.stock <= p.minStock).length;
  const totalValue = spareParts.reduce((acc, p) => acc + (p.stock * (p.price || 0)), 0);

  // Filter parts based on query
  const filteredParts = spareParts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <svg className="animate-spin h-10 w-10 text-brand-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-500 font-medium animate-pulse">Cargando módulo de repuestos...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Banner */}
      <header className="bg-slate-900 text-white shadow-xl shadow-slate-950/10">
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
              className="py-1.5 px-3.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
            >
              Reporte Semanal
            </button>
            <button
              onClick={() => router.push('/repuestos')}
              className="py-1.5 px-3.5 rounded-xl text-xs font-semibold text-white bg-white/10 transition-all"
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Inventario de Repuestos</h2>
            <p className="text-sm text-slate-500">Administra los insumos y piezas de repuesto para las máquinas de planta.</p>
          </div>

          {user?.role !== 'VIEWER' && (
            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 px-5 rounded-2xl shadow-lg shadow-brand-600/15 hover:shadow-brand-500/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Registrar Repuesto</span>
            </button>
          )}
        </div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex items-center gap-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Total Repuestos</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalItems} ítems</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex items-center gap-4 shadow-xs">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${alertItems > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Alertas de Stock Bajo</p>
              <p className={`text-2xl font-bold mt-0.5 ${alertItems > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{alertItems} críticos</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex items-center gap-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Valorización Estimada</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">S/. {totalValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4.5 h-4.5" />
          </div>
          <input
            type="text"
            placeholder="Buscar repuesto por nombre, código o ubicación..."
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
                  <th className="p-4">Código</th>
                  <th className="p-4">Nombre / Repuesto</th>
                  <th className="p-4 text-center">Stock</th>
                  <th className="p-4 text-center">Stock Mínimo</th>
                  <th className="p-4">Ubicación</th>
                  <th className="p-4 text-right">Precio Unitario</th>
                  {user?.role !== 'VIEWER' && <th className="p-4 text-center w-24">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      No se encontraron repuestos registrados.
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((part) => {
                    const isLowStock = part.stock <= part.minStock;
                    return (
                      <tr key={part.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-xs text-slate-500">{part.code}</td>
                        <td className="p-4 font-semibold text-slate-800">
                          <div>
                            {part.name}
                            {isLowStock && (
                              <span className="ml-2 inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
                                Stock Bajo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`p-4 text-center font-bold ${isLowStock ? 'text-rose-600' : 'text-slate-700'}`}>
                          {part.stock}
                        </td>
                        <td className="p-4 text-center text-slate-500">{part.minStock}</td>
                        <td className="p-4 text-slate-500 text-xs font-medium">
                          {part.location ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{part.location}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-mono font-semibold text-slate-700">
                          {part.price !== null ? `S/. ${part.price.toFixed(2)}` : <span className="text-slate-300">-</span>}
                        </td>
                        {user?.role !== 'VIEWER' && (
                          <td className="p-4 flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(part)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(part.id, part.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
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
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">
                {editingId ? 'Editar Insumo de Repuesto' : 'Registrar Nuevo Repuesto'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Código</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="REP-001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Precio Unitario (S/.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Repuesto</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ej. Filtro de carbón activado"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Mínimo Alerta</label>
                  <input
                    type="number"
                    min="0"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación / Estante</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="ej. Almacén Principal - Estante B"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-700 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Guardando...' : 'Guardar Repuesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
