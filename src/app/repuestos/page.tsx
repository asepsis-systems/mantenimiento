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
  X,
  Upload,
  Image as ImageIcon,
  Download,
  ZoomIn
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface SparePart {
  id: string;
  name: string;
  code: string;
  stock: number;
  minStock: number;
  price: number | null;
  location: string | null;
  isMatachana: boolean;
  createdAt: string;
  updatedAt: string;

  // Campos nuevos de Inventario
  metodo?: string | null;
  metodo2?: string | null;
  repuesto?: string | null;
  codigoMarca?: string | null;
  marca1?: string | null;
  comentario?: string | null;
  fotoNombre?: string | null;
  fotoPath?: string | null;
  almacenado?: string | null;
  seccion?: string | null;

  // Campos nuevos de Matachana
  correlativo?: string | null;
  descripcion?: string | null;
  codigoMatachana?: string | null;
  kit1?: string | null;
  kit2?: string | null;
  usados?: number | null;
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
  
  // Navigation states
  const [activeTab, setActiveTab] = useState<'INVENTARIOS' | 'MATACHANA'>('INVENTARIOS');
  const [tabTransition, setTabTransition] = useState(false);

  // Dialog/Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formStock, setFormStock] = useState('0');
  const [formMinStock, setFormMinStock] = useState('0');
  const [formPrice, setFormPrice] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formIsMatachana, setFormIsMatachana] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New fields
  const [formMetodo, setFormMetodo] = useState('Eto');
  const [formMetodo2, setFormMetodo2] = useState('Eto');
  const [formRepuesto, setFormRepuesto] = useState('');
  const [formCodigoMarca, setFormCodigoMarca] = useState('');
  const [formMarca1, setFormMarca1] = useState('3M');
  const [formComentario, setFormComentario] = useState('');
  const [formFotoNombre, setFormFotoNombre] = useState('');
  const [formFotoPath, setFormFotoPath] = useState('');
  const [formAlmacenado, setFormAlmacenado] = useState('Armario');
  const [formSeccion, setFormSeccion] = useState('Piso 1');
  const [formCorrelativo, setFormCorrelativo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formCodigoMatachana, setFormCodigoMatachana] = useState('');
  const [formKit1, setFormKit1] = useState('Ninguno');
  const [formKit2, setFormKit2] = useState('Ninguno');
  const [formUsados, setFormUsados] = useState('0');

  // Drag & drop file upload states
  const [dragOver, setDragOver] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Lightbox and image failure states
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [activeLightboxImg, setActiveLightboxImg] = useState<{ path: string; name: string; code: string; seccion?: string } | null>(null);

  // Helper to resolve physical paths to public URLs
  const getFotoUrl = (fotoPath?: string | null) => {
    if (!fotoPath) return '';
    if (fotoPath.startsWith('http') || fotoPath.startsWith('/')) return fotoPath;
    return `/api/repuestos/foto?path=${encodeURIComponent(fotoPath)}`;
  };

  // Excel Import State
  const [importLoading, setImportLoading] = useState(false);

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

  const handleTabChange = (tab: 'INVENTARIOS' | 'MATACHANA') => {
    setTabTransition(true);
    setActiveTab(tab);
    setTimeout(() => {
      setTabTransition(false);
    }, 200);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setFormCode('');
    setFormStock('0');
    setFormMinStock('0');
    setFormPrice('');
    setFormLocation('');
    setFormIsMatachana(activeTab === 'MATACHANA');
    
    // Reset new fields
    setFormMetodo(activeTab === 'MATACHANA' ? 'Vapor' : 'Eto');
    setFormMetodo2('Vapor');
    setFormRepuesto('');
    setFormCodigoMarca('');
    setFormMarca1('3M');
    setFormComentario('');
    setFormFotoNombre('');
    setFormFotoPath('');
    setFormAlmacenado('Armario');
    setFormSeccion('Piso 1');
    setFormCorrelativo('');
    setFormDescripcion('');
    setFormCodigoMatachana('');
    setFormKit1('Ninguno');
    setFormKit2('Ninguno');
    setFormUsados('0');

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
    setFormIsMatachana(Boolean(part.isMatachana));

    // Load new fields
    setFormMetodo(part.metodo || (part.isMatachana ? 'Vapor' : 'Eto'));
    setFormMetodo2(part.metodo2 || 'Vapor');
    setFormRepuesto(part.repuesto || '');
    setFormCodigoMarca(part.codigoMarca || '');
    setFormMarca1(part.marca1 || '3M');
    setFormComentario(part.comentario || '');
    setFormFotoNombre(part.fotoNombre || '');
    setFormFotoPath(part.fotoPath || '');
    setFormAlmacenado(part.almacenado || 'Armario');
    setFormSeccion(part.seccion || 'Piso 1');
    setFormCorrelativo(part.correlativo || '');
    setFormDescripcion(part.descripcion || '');
    setFormCodigoMatachana(part.codigoMatachana || '');
    setFormKit1(part.kit1 || 'Ninguno');
    setFormKit2(part.kit2 || 'Ninguno');
    setFormUsados(String(part.usados ?? 0));

    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isMatachanaSave = formIsMatachana;
    const finalCode = isMatachanaSave ? formCodigoMatachana.trim().toUpperCase() : formCode.trim().toUpperCase();
    const finalName = isMatachanaSave ? formDescripcion.trim() : formName.trim();

    if (!finalCode) {
      setError('El código es obligatorio.');
      return;
    }
    if (!finalName) {
      setError(isMatachanaSave ? 'La descripción es obligatoria.' : 'El nombre es obligatorio.');
      return;
    }

    setActionLoading(true);
    setError('');

    const payload = {
      name: finalName,
      code: finalCode,
      stock: Number(formStock) || 0,
      minStock: Number(formMinStock) || 0,
      price: formPrice.trim() ? Number(formPrice) : null,
      location: formLocation.trim() || null,
      isMatachana: formIsMatachana,
      metodo: formMetodo,
      metodo2: formMetodo2,
      repuesto: formRepuesto.trim(),
      codigoMarca: formCodigoMarca.trim(),
      marca1: formMarca1,
      comentario: formComentario.trim(),
      fotoNombre: formFotoNombre,
      fotoPath: formFotoPath,
      almacenado: formAlmacenado,
      seccion: formSeccion,
      correlativo: formCorrelativo.trim(),
      descripcion: formDescripcion.trim(),
      codigoMatachana: formCodigoMatachana.trim().toUpperCase(),
      kit1: formKit1,
      kit2: formKit2,
      usados: Number(formUsados) || 0
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

  const handlePhotoUpload = async (file: File) => {
    setUploadingFile(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/repuestos/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFormFotoNombre(data.fotoNombre);
        setFormFotoPath(data.fotoPath);
      } else {
        setError(data.error || 'Error al subir la imagen.');
      }
    } catch (err) {
      setError('Error al conectar con el servidor de subida.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        
        if (data.length === 0) {
          setError('El archivo Excel está vacío.');
          setImportLoading(false);
          return;
        }

        const mappedItems = data.map((row: any) => {
          const findValue = (variations: string[]) => {
            const key = Object.keys(row).find(k => 
              variations.some(v => k.toLowerCase().trim() === v.toLowerCase().trim())
            );
            return key ? row[key] : undefined;
          };

          const code = findValue(['codigo matachana', 'código matachana', 'codigo', 'código', 'code', 'id', 'item_code']);
          const name = findValue(['repuesto matachana', 'nombre matachana', 'nombre', 'repuesto', 'descripción', 'descripcion', 'name', 'item_name']);
          const stock = findValue(['stock', 'cantidad', 'cant', 'existencia', 'stock_actual', 'quantity', 'qty']);
          const minStock = findValue(['stock minimo', 'stock mínimo', 'min stock', 'minimo', 'mínimo', 'min_stock']);
          const price = findValue(['precio', 'precio unitario', 'unit price', 'price', 'costo', 'cost']);
          const location = findValue(['ubicación', 'ubicacion', 'location', 'estante', 'almacen', 'almacén']);

          return {
            code: code !== undefined ? String(code) : undefined,
            name: name !== undefined ? String(name) : undefined,
            stock: stock !== undefined ? Number(stock) : 0,
            minStock: minStock !== undefined ? Number(minStock) : 0,
            price: price !== undefined && price !== '' ? Number(price) : null,
            location: location !== undefined ? String(location) : '',
            isMatachana: activeTab === 'MATACHANA'
          };
        }).filter(item => item.code && item.name);

        if (mappedItems.length === 0) {
          setError('No se encontraron filas con "Código" y "Nombre" válidos en el archivo Excel.');
          setImportLoading(false);
          return;
        }

        const res = await fetch('/api/repuestos/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: mappedItems })
        });

        const resData = await res.json();
        if (res.ok && resData.success) {
          alert(`Importación completada con éxito.\nNuevos repuestos creados: ${resData.created}\nRepuestos actualizados: ${resData.updated}\nErrores: ${resData.errors.length}`);
          await fetchSpareParts();
        } else {
          setError(resData.error || 'Error al importar los datos desde el servidor.');
        }
      } catch (err: any) {
        setError('Error al leer o procesar el archivo Excel: ' + err.message);
      } finally {
        setImportLoading(false);
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      setError('Error al leer el archivo.');
      setImportLoading(false);
    };

    reader.readAsBinaryString(file);
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

  // Filter spare parts by active tab
  const currentTabParts = spareParts.filter(p => 
    activeTab === 'MATACHANA' ? p.isMatachana : !p.isMatachana
  );

  // Calculations for dashboard summary widgets
  const totalItems = currentTabParts.length;
  const totalStock = currentTabParts.reduce((acc, p) => acc + p.stock, 0);
  const totalUsados = currentTabParts.reduce((acc, p) => acc + (p.usados ?? 0), 0);
  const uniqueLocations = new Set(currentTabParts.map(p => p.location || p.almacenado).filter(Boolean)).size;

  // Filter parts based on query
  const filteredParts = currentTabParts.filter(p => 
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
        <div className="max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-1 shadow-md shrink-0 flex items-center justify-center w-12 h-10">
              <img 
                src="/logo2.jpg" 
                alt="Asepsis Logo" 
                className="h-8 w-auto object-contain rounded-lg"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Mantenimiento</h1>
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
      <main className="flex-1 max-w-[1850px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Inventario de Repuestos</h2>
            <p className="text-sm text-slate-500">Administra los insumos y piezas de repuesto para las máquinas de planta.</p>
          </div>

          {user?.role !== 'VIEWER' && (
            <div className="flex items-center gap-3">
              {/* Import Excel Button */}
              <label className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold py-3 px-5 rounded-2xl cursor-pointer shadow-xs active:scale-[0.98] transition-all text-sm">
                {importLoading ? (
                  <svg className="animate-spin h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Upload className="w-4 h-4 text-emerald-600" />
                )}
                <span>{importLoading ? 'Procesando...' : 'Importar Excel'}</span>
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  onChange={handleExcelImport} 
                  className="hidden" 
                  disabled={importLoading}
                />
              </label>

              <button
                onClick={openCreateModal}
                className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-5 rounded-2xl shadow-lg shadow-brand-600/15 hover:shadow-brand-500/20 active:scale-[0.98] transition-all text-sm"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Registrar Repuesto</span>
              </button>
            </div>
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
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Stock Total en Planta</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalStock} unidades</p>
            </div>
          </div>

          {activeTab === 'MATACHANA' ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex items-center gap-4 shadow-xs animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400">Total Usados</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalUsados} unidades</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex items-center gap-4 shadow-xs animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400">Ubicaciones Registradas</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{uniqueLocations} áreas</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs (INVENTARIOS vs REPUESTOS MATACHANA) */}
        <div className="border-b border-slate-200/85 mb-6 flex items-center justify-between">
          <div className="flex gap-2 -mb-px">
            <button
              onClick={() => handleTabChange('INVENTARIOS')}
              className={`pb-3.5 pt-1 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'INVENTARIOS'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
              }`}
            >
              <Package className={`w-4 h-4 ${activeTab === 'INVENTARIOS' ? 'text-brand-600' : 'text-slate-400'}`} />
              <span>INVENTARIOS</span>
            </button>
            <button
              onClick={() => handleTabChange('MATACHANA')}
              className={`pb-3.5 pt-1 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'MATACHANA'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
              }`}
            >
              <Wrench className={`w-4 h-4 ${activeTab === 'MATACHANA' ? 'text-brand-600' : 'text-slate-400'}`} />
              <span>REPUESTOS MATACHANA</span>
            </button>
          </div>
          
          <div className="pb-3 text-xs text-slate-400 font-semibold hidden sm:block">
            Mostrando {totalItems} repuestos en esta sección
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
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  {activeTab === 'INVENTARIOS' ? (
                    <>
                      <th className="p-4">Método</th>
                      <th className="p-4">Código</th>
                      <th className="p-4">Nombre</th>
                      <th className="p-4">Repuesto</th>
                      <th className="p-4">Código</th>
                      <th className="p-4">Marca 1</th>
                      <th className="p-4">Comentario</th>
                      <th className="p-4 text-center">Stock</th>
                      <th className="p-4 text-center">Foto</th>
                      <th className="p-4">Almacenado</th>
                      <th className="p-4">Sección</th>
                    </>
                  ) : (
                    <>
                      <th className="p-4">Método</th>
                      <th className="p-4">Método 2</th>
                      <th className="p-4">Correlativo</th>
                      <th className="p-4">Descripción</th>
                      <th className="p-4">Código Mtchna</th>
                      <th className="p-4">Forma parte del kit</th>
                      <th className="p-4">Forma parte del kit 2</th>
                      <th className="p-4 text-center">Stock</th>
                      <th className="p-4 text-center">Usados</th>
                      <th className="p-4">Ubicación</th>
                    </>
                  )}
                  {user?.role !== 'VIEWER' && <th className="p-4 text-center w-24">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tabTransition ? (
                  <tr>
                    <td 
                      colSpan={
                        activeTab === 'INVENTARIOS' 
                          ? (user?.role !== 'VIEWER' ? 12 : 11) 
                          : (user?.role !== 'VIEWER' ? 11 : 10)
                      } 
                      className="p-16 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <svg className="animate-spin h-7 w-7 text-brand-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-slate-400 text-xs font-semibold animate-pulse">Cargando listado...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredParts.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={
                        activeTab === 'INVENTARIOS' 
                          ? (user?.role !== 'VIEWER' ? 12 : 11) 
                          : (user?.role !== 'VIEWER' ? 11 : 10)
                      } 
                      className="p-12 text-center text-slate-400 font-medium"
                    >
                      No se encontraron repuestos registrados.
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((part) => {
                    const hasNoStock = part.stock === 0;
                    return (
                      <tr key={part.id} className="hover:bg-slate-50/50 transition-colors">
                        {activeTab === 'INVENTARIOS' ? (
                          <>
                            <td className="p-4 font-semibold text-slate-700">{part.metodo || '-'}</td>
                            <td className="p-4 font-mono font-bold text-xs text-slate-500">{part.code}</td>
                            <td className="p-4 font-semibold text-slate-800">
                              <div className="flex items-center gap-2">
                                <span>{part.name}</span>
                                {hasNoStock && (
                                  <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
                                    Agotado
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-slate-600 font-medium">{part.repuesto || '-'}</td>
                            <td className="p-4 font-mono text-xs text-slate-500">{part.codigoMarca || '-'}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100">
                                {part.marca1 || '-'}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 text-xs max-w-[150px] truncate font-medium" title={part.comentario || ''}>
                              {part.comentario || '-'}
                            </td>
                            <td className={`p-4 text-center font-bold ${hasNoStock ? 'text-rose-600' : 'text-slate-700'}`}>
                              {part.stock}
                            </td>
                            <td className="p-4 text-center">
                              {part.fotoPath && !brokenImages[part.id] ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveLightboxImg({
                                    path: getFotoUrl(part.fotoPath),
                                    name: part.name,
                                    code: part.code,
                                    seccion: part.seccion || undefined
                                  })}
                                  className="relative group inline-block overflow-hidden rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-zoom-in"
                                  title="Ver foto del repuesto"
                                >
                                  <img 
                                    src={getFotoUrl(part.fotoPath)} 
                                    alt={part.fotoNombre || 'Foto'} 
                                    onError={() => setBrokenImages(prev => ({ ...prev, [part.id]: true }))}
                                    className="w-12 h-12 object-cover transition-transform duration-300 group-hover:scale-115 group-hover:rotate-1"
                                  />
                                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                    <ZoomIn className="w-4 h-4 text-white" />
                                  </div>
                                </button>
                              ) : (
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-400" title="Sin foto">
                                  <ImageIcon className="w-5 h-5 opacity-60" />
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              {part.almacenado ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 border border-slate-200/45 font-medium">
                                  {part.almacenado}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="p-4">
                              {part.seccion ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 border border-slate-200/45 font-medium">
                                  {part.seccion}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-4 font-semibold text-slate-700">{part.metodo || '-'}</td>
                            <td className="p-4 font-semibold text-slate-700">{part.metodo2 || '-'}</td>
                            <td className="p-4 font-mono font-bold text-xs text-slate-500">{part.correlativo || '-'}</td>
                            <td className="p-4 font-semibold text-slate-800">
                              <div className="flex items-center gap-2">
                                <span>{part.descripcion || part.name}</span>
                                {hasNoStock && (
                                  <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
                                    Agotado
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-mono font-bold text-xs text-brand-600">{part.codigoMatachana || part.code}</td>
                            <td className="p-4 text-slate-600 text-xs max-w-[150px] truncate font-medium" title={part.kit1 || ''}>
                              {part.kit1 && part.kit1 !== 'Ninguno' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100">
                                  {part.kit1.split(' - ')[0]}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-600 text-xs max-w-[150px] truncate font-medium" title={part.kit2 || ''}>
                              {part.kit2 && part.kit2 !== 'Ninguno' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100">
                                  {part.kit2.split(' - ')[0]}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className={`p-4 text-center font-bold ${hasNoStock ? 'text-rose-600' : 'text-slate-700'}`}>
                              {part.stock}
                            </td>
                            <td className="p-4 text-center font-bold text-slate-500">{part.usados ?? 0}</td>
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
                          </>
                        )}
                        {user?.role !== 'VIEWER' && (
                          <td className="p-4 flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(part)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(part.id, part.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 w-full max-w-3xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  {editingId ? 'Editar Repuesto' : 'Registrar Nuevo Repuesto'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Completa la ficha técnica para el inventario de planta.</p>
              </div>
              <button 
                type="button"
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

            {/* Quick Switch for Matachana Flag */}
            <div className="mb-5 flex items-center gap-2.5 pt-2 pb-2 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <input
                type="checkbox"
                id="formIsMatachana"
                checked={formIsMatachana}
                onChange={(e) => {
                  setFormIsMatachana(e.target.checked);
                  // Dynamic switch default values
                  if (e.target.checked) {
                    setFormMetodo('Vapor');
                  } else {
                    setFormMetodo('Eto');
                  }
                }}
                className="h-4.5 w-4.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500/20 cursor-pointer"
              />
              <div>
                <label htmlFor="formIsMatachana" className="text-xs font-bold text-slate-700 uppercase tracking-wide cursor-pointer select-none block">
                  Pertenece a Repuestos Matachana
                </label>
                <p className="text-[10px] text-slate-400">Activa esta opción para cambiar el formulario a la estructura médica de Matachana.</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {!formIsMatachana ? (
                /* ========================================================================= */
                /* INVENTARIO GENERAL FORM FIELDS                                            */
                /* ========================================================================= */
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Fila 1: Método, Código, Código Marca */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Método
                      </label>
                      <select
                        value={formMetodo}
                        onChange={(e) => setFormMetodo(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 cursor-pointer font-medium shadow-xs"
                      >
                        {["Eto", "Vapor", "Otro"].map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Código
                      </label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="ej. COD-123"
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 font-mono shadow-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Código Marca
                      </label>
                      <input
                        type="text"
                        value={formCodigoMarca}
                        onChange={(e) => setFormCodigoMarca(e.target.value)}
                        placeholder="ej. BRK-456"
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 font-mono shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Fila 2: Nombre, Repuesto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="ej. Válvula Solenoide 1/4"
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 font-medium shadow-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Repuesto
                      </label>
                      <input
                        type="text"
                        value={formRepuesto}
                        onChange={(e) => setFormRepuesto(e.target.value)}
                        placeholder="ej. Diafragma de repuesto"
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Fila 3: Marca 1, Stock */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Marca 1 (Proveedor)
                      </label>
                      <select
                        value={formMarca1}
                        onChange={(e) => setFormMarca1(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 cursor-pointer font-medium shadow-xs"
                      >
                        {[
                          "3M", "BURKERT", "KLOD", "RFS", "SPIRAX SARCO", "BARKSDALE", "CF8M", "CRANE", "GESTRA", 
                          "MATACHANA", "MCDONELL & MILLER", "AIRTAC", "PETER PAUL", "FLAIR LINE", "CLIPPARD", 
                          "AIR-VAC", "HONEYWELL", "OPTO22", "NAIS", "PHOENIX CONTACT", "GENERANT CO IN", "IMIT", 
                          "PALL", "SUN", "EAC", "RENATA", "Pneumatic", "SMC", "ORANGE", "SIEMENS", "Mouser Electronics", 
                          "TMAZTZ", "JACK & LU Electro Gaming", "SOLEXE"
                        ].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Stock Actual
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 font-semibold shadow-xs"
                        required
                      />
                    </div>
                  </div>

                  {/* Fila 4: Almacenado En, Sección */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Almacenado En
                      </label>
                      <select
                        value={formAlmacenado}
                        onChange={(e) => setFormAlmacenado(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 cursor-pointer font-medium shadow-xs"
                      >
                        {["Armario", "Mueble alto", "Cajón"].map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Sección (Planta)
                      </label>
                      <select
                        value={formSeccion}
                        onChange={(e) => setFormSeccion(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 cursor-pointer font-medium shadow-xs"
                      >
                        {["Piso 1", "Piso 2", "Piso 3", "Piso 4", "Piso 5"].map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fila 5: Foto (Drag & Drop zone visual) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Foto del Repuesto
                    </label>
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('fotoFileInput')?.click()}
                      className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
                        dragOver 
                          ? 'border-brand-500 bg-brand-50/40 shadow-inner' 
                          : formFotoPath 
                            ? 'border-emerald-400 bg-emerald-50/10 hover:bg-emerald-50/20' 
                            : 'border-slate-200 bg-slate-50/30 hover:bg-slate-100/40 hover:border-slate-300'
                      }`}
                    >
                      <input 
                        type="file" 
                        id="fotoFileInput"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {uploadingFile ? (
                        <div className="flex flex-col items-center gap-2.5 text-slate-400">
                          <svg className="animate-spin h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="text-xs font-semibold animate-pulse">Subiendo foto...</span>
                        </div>
                      ) : formFotoPath ? (
                        <div className="flex flex-col items-center text-center gap-3 text-emerald-600">
                          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md">
                            <img 
                              src={getFotoUrl(formFotoPath)} 
                              alt="Previsualización" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="text-xs font-bold block text-slate-700">{formFotoNombre || 'Imagen cargada'}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Haz clic o arrastra para reemplazar la imagen</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center gap-2 text-slate-400">
                          <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm hover:scale-105 transition-all">
                            <Upload className="w-5 h-5 text-brand-500" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-600 block">Arrastra una imagen aquí o haz clic para subir</span>
                            <span className="text-[10px] text-slate-400 font-medium">Formatos permitidos: JPG, PNG, WEBP (Máx. 5MB)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fila 6: Comentario */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Comentarios / Observaciones
                    </label>
                    <textarea
                      value={formComentario}
                      onChange={(e) => setFormComentario(e.target.value)}
                      placeholder="Agrega notas adicionales sobre este repuesto (especificaciones técnicas, marcas alternativas, usos específicos, etc.)..."
                      className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 h-28 resize-none shadow-xs"
                    />
                  </div>
                </div>
              ) : (
                /* ========================================================================= */
                /* REPUESTOS MATACHANA FORM FIELDS                                           */
                /* ========================================================================= */
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Fila 1: Método, Método 2, Correlativo */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Método
                      </label>
                      <select
                        value={formMetodo}
                        onChange={(e) => setFormMetodo(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 cursor-pointer font-medium shadow-xs"
                      >
                        {["Vapor", "Eto", "Plasma", "Formaldehído"].map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Método 2
                      </label>
                      <select
                        value={formMetodo2}
                        onChange={(e) => setFormMetodo2(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 cursor-pointer font-medium shadow-xs"
                      >
                        {["Vapor", "Eto", "Plasma", "Formaldehído"].map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Correlativo
                      </label>
                      <input
                        type="text"
                        value={formCorrelativo}
                        onChange={(e) => setFormCorrelativo(e.target.value)}
                        placeholder="ej. M-4512"
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 font-mono shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Fila 2: Código Matachana, Descripción */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Código Matachana
                      </label>
                      <input
                        type="text"
                        value={formCodigoMatachana}
                        onChange={(e) => setFormCodigoMatachana(e.target.value)}
                        placeholder="ej. 67620.6"
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 font-mono font-bold text-brand-600 shadow-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={formDescripcion}
                        onChange={(e) => setFormDescripcion(e.target.value)}
                        placeholder="ej. Junta tórica de silicona vitón"
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 font-medium shadow-xs"
                        required
                      />
                    </div>
                  </div>

                  {/* Fila 3: Forma Parte del Kit, Forma Parte del Kit 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Forma Parte del Kit
                      </label>
                      <select
                        value={formKit1}
                        onChange={(e) => setFormKit1(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 cursor-pointer font-medium shadow-xs"
                      >
                        {[
                          "Ninguno",
                          "67620.6 - KIT MANTENIMIENTO ANUAL 130HPO 2 PUERTAS VERSION 3",
                          "67135.5 - KIT DE MANTENIMIENTO DE VAPORIZADOR PARA 50 HPO Y 130 HPO",
                          "67141.5 - KIT MANTENIMIENTO BOMBA DE VACÍO 130 HPO CON GAS BALLAST"
                        ].map((kit) => (
                          <option key={kit} value={kit}>{kit}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Forma Parte del Kit 2
                      </label>
                      <select
                        value={formKit2}
                        onChange={(e) => setFormKit2(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 cursor-pointer font-medium shadow-xs"
                      >
                        {[
                          "Ninguno",
                          "67620.6 - KIT MANTENIMIENTO ANUAL 130HPO 2 PUERTAS VERSION 3",
                          "67135.5 - KIT DE MANTENIMIENTO DE VAPORIZADOR PARA 50 HPO Y 130 HPO",
                          "67141.5 - KIT MANTENIMIENTO BOMBA DE VACÍO 130 HPO CON GAS BALLAST"
                        ].map((kit) => (
                          <option key={kit} value={kit}>{kit}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fila 4: Stock Actual, Usados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Stock Actual
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 font-semibold shadow-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Usados
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formUsados}
                        onChange={(e) => setFormUsados(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 shadow-xs"
                        required
                      />
                    </div>
                  </div>

                  {/* Fila 5: Ubicación */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Ubicación de Almacén
                    </label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="ej. Estante M4 - Caja A - Bandeja 2 (Almacén Matachana)"
                      className="w-full bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-2xl py-2.5 px-3.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all duration-150 shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* Botones del Pie de Página */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-all hover:text-slate-700 active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md shadow-brand-600/10 hover:shadow-brand-500/15 active:scale-95 disabled:opacity-50"
                >
                  {actionLoading ? 'Guardando...' : 'Guardar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR PHOTO PREVIEW */}
      {activeLightboxImg && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveLightboxImg(null)}
        >
          {/* Close button top right */}
          <button
            type="button"
            onClick={() => setActiveLightboxImg(null)}
            className="absolute top-6 right-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all hover:scale-105 active:scale-95 shadow-xl z-50"
            title="Cerrar vista previa"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Lightbox Content Card */}
          <div 
            className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-white p-3 rounded-3xl shadow-2xl border border-white/10 overflow-hidden group">
              <img 
                src={activeLightboxImg.path} 
                alt={activeLightboxImg.name}
                className="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-md"
              />
              
              {/* Overlay download button */}
              <a
                href={activeLightboxImg.path}
                download={activeLightboxImg.name}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-6 right-6 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 backdrop-blur-xs text-white text-xs font-semibold flex items-center gap-2 border border-white/10 shadow-lg transition-all active:scale-95 cursor-pointer"
                title="Descargar foto original"
              >
                <Download className="w-4 h-4" />
                <span>Descargar</span>
              </a>
            </div>

            {/* Photo Metadata Footer */}
            <div className="mt-5 text-center max-w-2xl px-4">
              <h4 className="text-white text-lg font-bold tracking-tight">{activeLightboxImg.name}</h4>
              <p className="text-slate-400 text-sm mt-1.5 font-medium flex items-center justify-center gap-2">
                <span className="font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-xs">{activeLightboxImg.code}</span>
                {activeLightboxImg.seccion && (
                  <span className="bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {activeLightboxImg.seccion}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
