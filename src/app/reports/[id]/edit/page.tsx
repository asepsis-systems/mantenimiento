'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle,
  Eye,
  Table,
  LayoutGrid,
  Clock
} from 'lucide-react';

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
  cantidad: string;
  estado: string;
  itemSpan: number;
  machineSpan: number;
  fallaSpan: number;
  tipoSpan: number;
  descripcionSpan: number;
}

export default function ReportEditor({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  
  // Track expanded items in accordion
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const getInitials = (name: string) => {
    if (!name) return '??';
    const cleanName = name.trim().toUpperCase();
    const words = cleanName.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] || '') + (words[1][0] || '');
    }
    return cleanName.substring(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-amber-500 text-white',
      'bg-sky-505 text-white',
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


  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/${id}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setReport(data.report);
          
          // Expand the first item by default
          if (data.report.items.length > 0) {
            setExpandedItems({ [data.report.items[0].id]: true });
          }
        } else {
          setError(data.error || 'Error al cargar reporte');
        }
      } catch (err) {
        setError('Error de comunicación con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  // Compute flat rows for preview in real-time as state updates
  const flatRows = useMemo(() => {
    if (!report) return [];
    
    const rows: FlatRow[] = [];

    report.items.forEach((item) => {
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

      // Calculate column spans inside item (Falla, Tipo, Descripcion)
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

    return rows;
  }, [report]);

  // Filter tasks out of flatRows for Kanban board preview
  const validTasks = useMemo(() => {
    return flatRows.filter(row => !row.taskId.startsWith('empty-') && row.descripcion.trim() !== '');
  }, [flatRows]);

  const todoTasks = useMemo(() => {
    return validTasks.filter(row => row.estado.toLowerCase().trim() === 'pendiente');
  }, [validTasks]);

  const doingTasks = useMemo(() => {
    return validTasks.filter(row => ['proceso', 'haciendo', 'en proceso', 'en_proceso'].includes(row.estado.toLowerCase().trim()));
  }, [validTasks]);

  const doneTasks = useMemo(() => {
    return validTasks.filter(row => ['completado', 'hecho', 'finalizado'].includes(row.estado.toLowerCase().trim()));
  }, [validTasks]);

  const columns = useMemo(() => {
    return [
      {
        key: 'doing',
        title: 'Haciendo',
        tasks: doingTasks,
        countText: `${doingTasks.length} ${doingTasks.length === 1 ? 'tarjeta' : 'tarjetas'}`,
        dotColor: 'bg-amber-500'
      },
      {
        key: 'done',
        title: 'Hecho',
        tasks: doneTasks,
        countText: `${doneTasks.length} ${doneTasks.length === 1 ? 'tarjeta' : 'tarjetas'}`,
        dotColor: 'bg-emerald-500'
      },
      {
        key: 'todo',
        title: 'Por hacer',
        tasks: todoTasks,
        countText: `${todoTasks.length} ${todoTasks.length === 1 ? 'tarjeta' : 'tarjetas'}`,
        dotColor: 'bg-slate-400'
      }
    ];
  }, [todoTasks, doingTasks, doneTasks]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Report fields handlers
  const handleReportTitleChange = (val: string) => {
    setReport(prev => prev ? { ...prev, title: val } : null);
  };

  const handlePeriodChange = (field: 'periodFrom' | 'periodTo', val: string) => {
    setReport(prev => prev ? { ...prev, [field]: val } : null);
  };

  // Items handlers
  const handleItemFieldChange = (itemId: string, field: 'date' | 'responsable', val: string) => {
    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? { ...item, [field]: val } : item
        )
      };
    });
  };

  const addItem = () => {
    setReport(prev => {
      if (!prev) return null;
      const nextNum = prev.items.length + 1;
      const newItemId = `new-item-${Date.now()}`;
      
      // Auto expand the new item
      setExpandedItems(ex => ({ ...ex, [newItemId]: true }));

      return {
        ...prev,
        items: [
          ...prev.items,
          {
            id: newItemId,
            itemNumber: nextNum,
            date: '',
            responsable: '',
            machines: []
          }
        ]
      };
    });
  };

  const deleteItem = (itemId: string) => {
    setReport(prev => {
      if (!prev) return null;
      const filtered = prev.items.filter(item => item.id !== itemId);
      // Re-number remaining items
      return {
        ...prev,
        items: filtered.map((item, index) => ({ ...item, itemNumber: index + 1 }))
      };
    });
  };

  // Machines handlers
  const handleMachineNameChange = (itemId: string, machineId: string, val: string) => {
    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            machines: item.machines.map(m => 
              m.id === machineId ? { ...m, name: val } : m
            )
          };
        })
      };
    });
  };

  const addMachine = (itemId: string) => {
    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            machines: [
              ...item.machines,
              {
                id: `new-mach-${Date.now()}`,
                name: '',
                tasks: []
              }
            ]
          };
        })
      };
    });
  };

  const deleteMachine = (itemId: string, machineId: string) => {
    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            machines: item.machines.filter(m => m.id !== machineId)
          };
        })
      };
    });
  };

  // Tasks handlers
  const handleTaskFieldChange = (itemId: string, machineId: string, taskId: string, field: keyof Task, val: string) => {
    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            machines: item.machines.map(m => {
              if (m.id !== machineId) return m;
              return {
                ...m,
                tasks: m.tasks.map(t => 
                  t.id === taskId ? { ...t, [field]: val } : t
                )
              };
            })
          };
        })
      };
    });
  };

  const addTask = (itemId: string, machineId: string) => {
    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            machines: item.machines.map(m => {
              if (m.id !== machineId) return m;
              return {
                ...m,
                tasks: [
                  ...m.tasks,
                  {
                    id: `new-task-${Date.now()}`,
                    falla: '',
                    tipo: 'correctivo',
                    descripcion: '',
                    repuestos: '-',
                    cantidad: '-',
                    estado: 'pendiente'
                  }
                ]
              };
            })
          };
        })
      };
    });
  };

  const deleteTask = (itemId: string, machineId: string, taskId: string) => {
    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            machines: item.machines.map(m => {
              if (m.id !== machineId) return m;
              return {
                ...m,
                tasks: m.tasks.filter(t => t.id !== taskId)
              };
            })
          };
        })
      };
    });
  };

  // Save report to database
  const handleSave = async () => {
    if (!report) return;
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Validate dates
      if (!report.periodFrom.trim() || !report.periodTo.trim()) {
        setError('Las fechas del periodo del reporte son requeridas.');
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Cambios guardados con éxito.');
        setReport(data.report);
        
        // Wait 1.5s then redirect to view
        setTimeout(() => {
          router.push(`/reports/${id}`);
        }, 1200);
      } else {
        setError(data.error || 'Error al guardar los cambios');
      }
    } catch (err) {
      setError('Error de red al guardar el reporte');
    } finally {
      setSaving(false);
    }
  };

  const getStatusStyle = (status: string) => {
    const lower = status.toLowerCase().trim();
    if (lower === 'completado') return 'bg-[#c2e7d9] text-[#1e4620] font-semibold text-center border border-slate-400 p-1.5';
    if (lower === 'proceso') return 'bg-[#fcf3cf] text-[#7d6608] font-semibold text-center border border-slate-400 p-1.5';
    if (lower === 'pendiente') return 'bg-[#fadbd8] text-[#78281f] font-semibold text-center border border-slate-400 p-1.5';
    return 'bg-white text-slate-800 text-center border border-slate-400 p-1.5';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <svg className="animate-spin h-10 w-10 text-brand-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-500 font-medium">Cargando editor...</span>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-14 h-14 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">No se pudo cargar el editor</h2>
          <p className="text-slate-500 mt-2">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 inline-flex items-center gap-2 bg-slate-850 hover:bg-slate-750 text-white font-medium py-2 px-4 rounded-xl transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Panel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200/80 shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2.5 rounded-2xl hover:bg-slate-100 border border-slate-200/40 hover:border-slate-200 text-slate-600 transition-all active:scale-95"
              title="Volver al Panel"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Reporte Semanal</p>
              <h2 className="text-sm font-bold text-slate-800">Editar Estructura</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/reports/${id}`)}
              className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 px-4 rounded-2xl transition-all text-sm shadow-xs"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Reporte</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-4 rounded-2xl transition-all text-sm shadow-md shadow-brand-600/10 hover:shadow-brand-500/15 disabled:opacity-50"
            >
              {saving ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Split Layout */}
      <div className="flex-1 max-w-[1450px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        {report && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: HIERARCHICAL EDITOR FORM */}
            <div className="lg:col-span-5 space-y-6">
              {/* Report Header Metadata Panel */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Metadatos del Reporte</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Título del Reporte</label>
                    <input
                      type="text"
                      value={report.title}
                      onChange={(e) => handleReportTitleChange(e.target.value)}
                      placeholder="Reporte semanal de mantenimiento"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-semibold focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Periodo Desde</label>
                      <input
                        type="text"
                        value={report.periodFrom}
                        onChange={(e) => handlePeriodChange('periodFrom', e.target.value)}
                        placeholder="12/06/26"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 text-sm focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Periodo Hasta</label>
                      <input
                        type="text"
                        value={report.periodTo}
                        onChange={(e) => handlePeriodChange('periodTo', e.target.value)}
                        placeholder="20/06/26"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 text-sm focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Items del Reporte ({report.items.length})</h3>
                  <button
                    onClick={addItem}
                    className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-500 text-xs font-bold bg-brand-50 hover:bg-brand-100/60 border border-brand-100 py-1.5 px-3 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Item</span>
                  </button>
                </div>

                {report.items.map((item) => {
                  const isExpanded = !!expandedItems[item.id];
                  
                  return (
                    <div 
                      key={item.id}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
                    >
                      {/* Item Header (Accordion Trigger) */}
                      <div className="bg-slate-50/50 border-b border-slate-100 py-3.5 px-5 flex items-center justify-between gap-4">
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="flex items-center gap-2 text-left flex-1"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                          <span className="font-bold text-slate-700 text-sm">
                            Item {item.itemNumber}: {item.responsable || '(Sin Responsable)'} {item.date ? `[${item.date}]` : ''}
                          </span>
                        </button>

                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Eliminar Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Item Body (Accordion Content) */}
                      {isExpanded && (
                        <div className="p-5 space-y-6">
                          {/* Item Metadata */}
                          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4.5">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Fecha</label>
                              <input
                                type="text"
                                value={item.date}
                                onChange={(e) => handleItemFieldChange(item.id, 'date', e.target.value)}
                                placeholder="15.06.26"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 text-slate-800 text-xs focus:outline-none focus:border-brand-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Responsable</label>
                              <input
                                type="text"
                                value={item.responsable}
                                onChange={(e) => handleItemFieldChange(item.id, 'responsable', e.target.value)}
                                placeholder="PROMAQUIRSA"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 text-slate-800 text-xs focus:outline-none focus:border-brand-500 uppercase font-medium"
                              />
                            </div>
                          </div>

                          {/* Item Machines */}
                          <div className="space-y-5">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Equipos / Máquinas ({item.machines.length})</h4>
                              <button
                                onClick={() => addMachine(item.id)}
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-500 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100/60 border border-emerald-100 py-1 px-2.5 rounded-lg transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Agregar Equipo</span>
                              </button>
                            </div>

                            {item.machines.length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                No hay máquinas bajo este item.
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {item.machines.map((machine) => (
                                  <div 
                                    key={machine.id}
                                    className="border border-slate-100 rounded-2xl p-4 bg-slate-50/20 space-y-4"
                                  >
                                    {/* Machine Header */}
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex-1">
                                        <input
                                          type="text"
                                          value={machine.name}
                                          onChange={(e) => handleMachineNameChange(item.id, machine.id, e.target.value)}
                                          placeholder="Nombre del Equipo (ej. Ablandador)"
                                          className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-slate-800 text-xs font-bold focus:outline-none focus:border-brand-500"
                                        />
                                      </div>
                                      <button
                                        onClick={() => deleteMachine(item.id, machine.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                        title="Eliminar Equipo"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Tasks under Machine */}
                                    <div className="space-y-3 pl-2.5 border-l-2 border-slate-200">
                                      <div className="flex items-center justify-between">
                                        <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tareas / Fallas</h5>
                                        <button
                                          onClick={() => addTask(item.id, machine.id)}
                                          className="text-[9px] font-bold text-brand-600 hover:text-brand-500 flex items-center gap-0.5 hover:underline"
                                        >
                                          <Plus className="w-2.5 h-2.5" />
                                          <span>Agregar Falla</span>
                                        </button>
                                      </div>

                                      {machine.tasks.length === 0 ? (
                                        <p className="text-[10px] text-slate-400 py-2">
                                          Sin fallas. Se creará una fila vacía en la tabla.
                                        </p>
                                      ) : (
                                        <div className="space-y-3.5">
                                          {machine.tasks.map((task) => (
                                            <div 
                                              key={task.id} 
                                              className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs space-y-2.5 relative group"
                                            >
                                              <button
                                                onClick={() => deleteTask(item.id, machine.id, task.id)}
                                                className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Eliminar Falla"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>

                                              {/* Row 1: Falla & Tipo */}
                                              <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                  <label className="text-[9px] text-slate-400 font-semibold block mb-0.5">Falla</label>
                                                  <input
                                                    type="text"
                                                    value={task.falla}
                                                    onChange={(e) => handleTaskFieldChange(item.id, machine.id, task.id, 'falla', e.target.value)}
                                                    placeholder="No Succiona la sal"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-[10.5px] text-slate-800 focus:outline-none focus:border-brand-500"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="text-[9px] text-slate-400 font-semibold block mb-0.5">Tipo Mantenimiento</label>
                                                  <input
                                                    type="text"
                                                    value={task.tipo}
                                                    onChange={(e) => handleTaskFieldChange(item.id, machine.id, task.id, 'tipo', e.target.value)}
                                                    placeholder="correctivo"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-[10.5px] text-slate-800 focus:outline-none focus:border-brand-500"
                                                  />
                                                </div>
                                              </div>

                                              {/* Row 2: Descripcion del trabajo */}
                                              <div>
                                                <label className="text-[9px] text-slate-400 font-semibold block mb-0.5">Descripción del Trabajo</label>
                                                <input
                                                  type="text"
                                                  value={task.descripcion}
                                                  onChange={(e) => handleTaskFieldChange(item.id, machine.id, task.id, 'descripcion', e.target.value)}
                                                  placeholder="Limpieza de filtro de succion"
                                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-[10.5px] text-slate-800 focus:outline-none focus:border-brand-500"
                                                />
                                              </div>

                                              {/* Row 3: Repuestos, Cantidad, Estado */}
                                              <div className="grid grid-cols-12 gap-2">
                                                <div className="col-span-5">
                                                  <label className="text-[9px] text-slate-400 font-semibold block mb-0.5">Repuestos</label>
                                                  <input
                                                    type="text"
                                                    value={task.repuestos}
                                                    onChange={(e) => handleTaskFieldChange(item.id, machine.id, task.id, 'repuestos', e.target.value)}
                                                    placeholder="oring (tych)"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-[10.5px] text-slate-800 focus:outline-none focus:border-brand-500"
                                                  />
                                                </div>
                                                <div className="col-span-3">
                                                  <label className="text-[9px] text-slate-400 font-semibold block mb-0.5">Cantidad</label>
                                                  <input
                                                    type="text"
                                                    value={task.cantidad}
                                                    onChange={(e) => handleTaskFieldChange(item.id, machine.id, task.id, 'cantidad', e.target.value)}
                                                    placeholder="1"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-[10.5px] text-slate-800 focus:outline-none focus:border-brand-500 text-center"
                                                  />
                                                </div>
                                                <div className="col-span-4">
                                                  <label className="text-[9px] text-slate-400 font-semibold block mb-0.5">Estado</label>
                                                  <select
                                                    value={task.estado}
                                                    onChange={(e) => handleTaskFieldChange(item.id, machine.id, task.id, 'estado', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-[10.5px] text-slate-850 focus:outline-none focus:border-brand-500 font-medium capitalize"
                                                  >
                                                    <option value="completado">completado</option>
                                                    <option value="Completado">Completado</option>
                                                    <option value="Proceso">Proceso</option>
                                                    <option value="proceso">proceso</option>
                                                    <option value="Pendiente">Pendiente</option>
                                                    <option value="pendiente">pendiente</option>
                                                  </select>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: STICKY LIVE PREVIEW */}
            <div className="lg:col-span-7 lg:sticky lg:top-24 max-h-[85vh] overflow-y-auto bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-tight">Vista Previa en Vivo</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Se actualiza en tiempo real al editar a la izquierda.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Selector de Vistas de Vista Previa */}
                  <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200/30">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all active:scale-[0.98] ${
                        viewMode === 'table'
                          ? 'bg-white text-slate-850 shadow-2xs border border-slate-200/10'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>Tabla</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('kanban')}
                      className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all active:scale-[0.98] ${
                        viewMode === 'kanban'
                          ? 'bg-white text-slate-850 shadow-2xs border border-slate-200/10'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Kanban</span>
                    </button>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 text-brand-700 text-[9px] font-bold rounded-lg border border-brand-100">
                    <span className="w-1.5 h-1.5 bg-brand-600 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>
              </div>

              {viewMode === 'table' ? (
                /* Flattened visual table */
                <div className="overflow-x-auto">
                  <div className="border border-slate-800 rounded-md overflow-hidden min-w-[850px]">
                    <table className="w-full border-collapse text-[10.5px] text-slate-900 leading-normal">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-800">
                          <th className="border border-slate-800 py-2 px-1 text-center font-bold w-10">Item</th>
                          <th className="border border-slate-800 py-2 px-1.5 text-center font-bold w-16">Fecha</th>
                          <th className="border border-slate-800 py-2 px-2 text-center font-bold w-24">Responsable</th>
                          <th className="border border-slate-800 py-2 px-2 text-center font-bold w-28">Equipo/Maquina</th>
                          <th className="border border-slate-800 py-2 px-2 text-center font-bold w-36">Falla</th>
                          <th className="border border-slate-800 py-2 px-1.5 text-center font-bold w-24">Tipo de Mantenimiento</th>
                          <th className="border border-slate-800 py-2 px-2 text-center font-bold">Descripcion del trabajo</th>
                          <th className="border border-slate-800 py-2 px-2 text-center font-bold w-36">Repuestos/ Insumos usados</th>
                          <th className="border border-slate-800 py-2 px-1 text-center font-bold w-12">Cantidad</th>
                          <th className="border border-slate-800 py-2 px-1.5 text-center font-bold w-24">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flatRows.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-8 text-slate-400 text-xs">
                              No hay datos. Agrega un Item para comenzar a previsualizar la tabla.
                            </td>
                          </tr>
                        ) : (
                          flatRows.map((row) => (
                            <tr key={row.taskId} className="bg-white hover:bg-slate-50/20 transition-colors">
                              {row.itemSpan > 0 && (
                                <td rowSpan={row.itemSpan} className="border border-slate-800 text-center align-middle font-bold py-2.5 px-1.5">
                                  {row.itemIndex}
                                </td>
                              )}

                              {row.itemSpan > 0 && (
                                <td rowSpan={row.itemSpan} className="border border-slate-800 text-center align-middle py-2.5 px-1.5">
                                  {row.itemDate}
                                </td>
                              )}

                              {row.itemSpan > 0 && (
                                <td rowSpan={row.itemSpan} className="border border-slate-800 text-center align-middle uppercase py-2.5 px-1.5 font-medium leading-tight max-w-[100px] break-words">
                                  {row.itemResponsable}
                                </td>
                              )}

                              {row.machineSpan > 0 && (
                                <td rowSpan={row.machineSpan} className="border border-slate-800 text-left align-middle font-semibold py-2.5 px-2">
                                  {row.machineName}
                                </td>
                              )}

                              {row.fallaSpan > 0 && (
                                <td rowSpan={row.fallaSpan} className="border border-slate-800 text-left align-middle py-2.5 px-2 max-w-[130px] break-words">
                                  {row.falla || '-'}
                                </td>
                              )}

                              {row.tipoSpan > 0 && (
                                <td rowSpan={row.tipoSpan} className="border border-slate-800 text-center align-middle py-2.5 px-1.5 capitalize max-w-[90px] break-words">
                                  {row.tipo || '-'}
                                </td>
                              )}

                              {row.descripcionSpan > 0 && (
                                <td rowSpan={row.descripcionSpan} className="border border-slate-800 text-left align-middle py-2.5 px-2 leading-tight">
                                  {row.descripcion || '-'}
                                </td>
                              )}

                              <td className="border border-slate-800 text-left align-middle py-2.5 px-2 max-w-[120px] break-words">
                                {row.repuestos}
                              </td>

                              <td className="border border-slate-800 text-center align-middle py-2.5 px-1">
                                {row.cantidad}
                              </td>

                              <td className={getStatusStyle(row.estado)}>
                                {row.estado}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Kanban Preview */
                <div className="w-full overflow-x-auto">
                  <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md relative overflow-hidden min-w-[700px]">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] opacity-20 pointer-events-none" />
                    
                    <div className="grid grid-cols-3 gap-4 relative z-10">
                      {columns.map((col) => (
                        <div 
                          key={col.key} 
                          className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-xl p-3 flex flex-col max-h-[600px] min-h-[350px]"
                        >
                          <div className="flex items-center justify-between pb-1 border-b border-white/5 shrink-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                              <h4 className="font-bold text-white text-[11px] uppercase tracking-wide">{col.title}</h4>
                            </div>
                            <span className="text-[9px] text-slate-400 bg-white/5 py-0.5 px-1.5 rounded-full border border-white/5 font-semibold">
                              {col.tasks.length}
                            </span>
                          </div>

                          <div className="space-y-2.5 overflow-y-auto flex-1 mt-3 pr-1 py-1">
                            {col.tasks.length === 0 ? (
                              <div className="h-20 border border-dashed border-white/10 rounded-lg flex items-center justify-center text-[9.5px] text-slate-600 bg-white/2 italic">
                                Sin tareas
                              </div>
                            ) : (
                              col.tasks.map((task) => (
                                <div 
                                  key={task.taskId} 
                                  className="bg-slate-800/85 border border-white/10 rounded-lg p-3 shadow-2xs transition-all duration-155"
                                >
                                  <div className="flex items-start gap-1.5">
                                    {col.key === 'done' ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                    ) : col.key === 'doing' ? (
                                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                                    ) : (
                                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    )}
                                    <h5 className="font-semibold text-white text-[10.5px] leading-snug">
                                      {task.descripcion}
                                    </h5>
                                  </div>

                                  <div className="flex flex-wrap gap-1 mt-2">
                                    <span className="text-[8px] font-bold text-brand-400 bg-brand-950/60 border border-brand-900/40 py-0.5 px-1.5 rounded-md uppercase shrink-0">
                                      {task.machineName}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 shrink-0">
                                    <span className="text-[8px] text-slate-500 font-light truncate max-w-[80px]">
                                      {task.itemResponsable}
                                    </span>
                                    <div 
                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[8.5px] font-bold border border-slate-900/50 shrink-0 ${getAvatarColor(task.itemResponsable)}`}
                                      title={task.itemResponsable}
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

          </div>
        )}
      </div>
    </div>
  );
}
