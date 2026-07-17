import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface Responsable {
  id: string;
  nombre: string;
}

interface FormValues {
  responsable: string;
  descripcion: string;
  estado: string;
  itemNumber?: number | string;
  fecha?: string;
  equipo?: string;
  sede?: string;
  falla?: string;
  tipo?: string;
  repuestos?: string;
  cantidad?: string;
  frecuenciaMeses?: number | null;
  esRecurrente?: boolean;
  horaInicio?: number | null;
  frecuenciaHrs?: number | null;
  proximoMantenimientoHrs?: number | null;
}

interface TaskFormProps {
  responsables: Responsable[];
  initialValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  existingEquipos?: string[];
}

export const TaskForm: React.FC<TaskFormProps> = ({
  responsables,
  initialValues = { responsable: '', descripcion: '', estado: 'PENDIENTE' },
  onSubmit,
  onCancel,
  isSubmitting,
  existingEquipos = []
}) => {
  const [responsable, setResponsable] = useState(initialValues.responsable);
  const [descripcion, setDescripcion] = useState(initialValues.descripcion);
  const [estado, setEstado] = useState(initialValues.estado === 'HECHO' ? 'CULMINADO' : initialValues.estado || 'PENDIENTE');
  const [itemNumber, setItemNumber] = useState<number | ''>((initialValues as any).itemNumber ?? '');
  const [fecha, setFecha] = useState((initialValues as any).fecha ?? '');
  const [equipo, setEquipo] = useState((initialValues as any).equipo ?? '');
  const [sede, setSede] = useState((initialValues as any).sede ?? '');
  const [falla, setFalla] = useState((originalVal => {
    // Si la falla tiene un valor, lo dejamos como está, si no, vacío
    return (initialValues as any).falla ?? '';
  })());
  const [tipo, setTipo] = useState((initialValues as any).tipo ?? '');
  const [repuestos, setRepuestos] = useState((initialValues as any).repuestos ?? '');
  const [qty, setQty] = useState(() => {
    const rawVal = (initialValues as any).cantidad ?? '';
    const trimmed = String(rawVal).trim();
    if (trimmed.endsWith(' metros')) return trimmed.replace(' metros', '');
    if (trimmed.endsWith(' kilogramo')) return trimmed.replace(' kilogramo', '');
    if (trimmed.endsWith(' unidades')) return trimmed.replace(' unidades', '');
    return trimmed;
  });
  const [unit, setUnit] = useState(() => {
    const rawVal = (initialValues as any).cantidad ?? '';
    const trimmed = String(rawVal).trim();
    if (trimmed.endsWith(' metros')) return 'metros';
    if (trimmed.endsWith(' kilogramo')) return 'kilogramo';
    if (trimmed.endsWith(' unidades')) return 'unidades';
    return '';
  });
  const [customEquipo, setCustomEquipo] = useState('');
  const [selectedEquipos, setSelectedEquipos] = useState<string[]>(() => {
    // Si initialValues.equipo contiene separador ' | ' asumimos lista
    const initEq = (initialValues as any).equipo ?? '';
    if (typeof initEq === 'string' && initEq.includes(' | ')) return initEq.split(' | ').map(s => s.trim()).filter(Boolean);
    if (typeof initEq === 'string' && initEq.trim() !== '') return [initEq.trim()];
    return [];
  });
  const [customResponsable, setCustomResponsable] = useState('');
  const [customTipo, setCustomTipo] = useState('');
  
  // Estados para Mantenimiento Preventivo (CMMS)
  const [frecuenciaType, setFrecuenciaType] = useState<string>(() => {
    if (initialValues.frecuenciaMeses === undefined || initialValues.frecuenciaMeses === null) {
      return 'unica';
    }
    const fm = Number(initialValues.frecuenciaMeses);
    if ([1, 2, 3, 4, 6, 12].includes(fm)) {
      return String(fm);
    }
    return 'personalizada';
  });
  const [customFrecuenciaMeses, setCustomFrecuenciaMeses] = useState<number | ''>(() => {
    if (initialValues.frecuenciaMeses !== undefined && initialValues.frecuenciaMeses !== null) {
      const fm = Number(initialValues.frecuenciaMeses);
      if (![1, 2, 3, 4, 6, 12].includes(fm)) {
        return fm;
      }
    }
    return '';
  });

  // Estados para Programación por Uso (Horómetro) - Solo compresoras
  const [horaInicio, setHoraInicio] = useState<number | ''>(() => {
    if (initialValues.horaInicio !== undefined && initialValues.horaInicio !== null) {
      return Number(initialValues.horaInicio);
    }
    return '';
  });
  const [frecuenciaHrs, setFrecuenciaHrs] = useState<number | ''>(() => {
    if (initialValues.frecuenciaHrs !== undefined && initialValues.frecuenciaHrs !== null) {
      return Number(initialValues.frecuenciaHrs);
    }
    return '';
  });
  const [proximoMantenimientoHrs, setProximoMantenimientoHrs] = useState<number | ''>(() => {
    if (initialValues.proximoMantenimientoHrs !== undefined && initialValues.proximoMantenimientoHrs !== null) {
      return Number(initialValues.proximoMantenimientoHrs);
    }
    return '';
  });

  const isCompresor = () => {
    if (selectedEquipos.length > 0) {
      return selectedEquipos.some(eq => eq.toUpperCase().includes('COMPRESOR') || eq.toUpperCase().includes('COMPRESORA'));
    }
    const currentEquipo = equipo === 'Otro' ? customEquipo : equipo;
    return !!(currentEquipo && (currentEquipo.toUpperCase().includes('COMPRESOR') || currentEquipo.toUpperCase().includes('COMPRESORA')));
  };

  React.useEffect(() => {
    if (horaInicio !== '' && frecuenciaHrs !== '') {
      setProximoMantenimientoHrs(Number(horaInicio) + Number(frecuenciaHrs));
    } else {
      setProximoMantenimientoHrs('');
    }
  }, [horaInicio, frecuenciaHrs]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Lista base ampliada de Equipos/Máquinas estándar en planta
  const defaultEquipoOptions = [
    'OE 4XL 1', 'OE 5XL 2', 'OE 4XL 3', 'OE 5XL 4', 'OE 5XL 5', 'OE 5XL 6',
    'OE 8XL 7', 'OE 8XL 8', 'OE 4XL 9', 'OE 5XL 10', 'OE 4 XL', 'OE 5 XL',
    'AUTOCLAVE V1', 'AUTOCLAVE V2', 'AUTOCLAVE V3', 'AUTOCLAVE V4', 'AUTOCLAVE V5',
    'AUTOCLAVE V6',
    'PLASMA P1', 'PLASMA P2', 'PLASMA P3',
    'FORMALDEHIDO F01',
    'AUTOCLAVE V-2', 'AUTOCLAVE V-5',
    'LAVADORA',
    'CALDERA',
    'COMPRESOR 25HP', 'COMPRESOR 10HP'
  ];

  // Combinación inteligente de la lista base y los equipos dinámicos provenientes de la base de datos
  const mergedEquipos = Array.from(
    new Set([
      ...defaultEquipoOptions,
      ...existingEquipos
    ])
  )
    .filter((e): e is string => typeof e === 'string' && e.trim() !== '')
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base', numeric: true }));

  const equipoOptions = ['', ...mergedEquipos, 'Otro'];

  const sedeOptions = ['', 'Lima', 'Trujillo'];

  const tipoOptions = ['', 'Preventivo', 'Correctivo', 'Predictivo', 'Otro'];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!responsable.trim()) {
      newErrors.responsable = 'Debe seleccionar o escribir un responsable.';
    }
    if (responsable === 'Otro' && !customResponsable.trim()) {
      newErrors.responsable = 'Debe ingresar el nombre del responsable.';
    }
    if (!descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Determinar frecuencia y recurrencia
      let finalFrecuenciaMeses: number | null = null;
      let finalEsRecurrente = false;

      if (frecuenciaType === 'personalizada') {
        finalFrecuenciaMeses = customFrecuenciaMeses === '' ? null : Number(customFrecuenciaMeses);
        finalEsRecurrente = finalFrecuenciaMeses !== null && finalFrecuenciaMeses > 0;
      } else if (frecuenciaType !== 'unica') {
        finalFrecuenciaMeses = Number(frecuenciaType);
        finalEsRecurrente = true;
      }

      const finalCantidad = qty.trim() ? (unit ? `${qty.trim()} ${unit}` : qty.trim()) : '';

      onSubmit({
        responsable: responsable === 'Otro' ? customResponsable || '' : responsable,
        descripcion,
        estado,
        itemNumber: itemNumber === '' ? undefined : Number(itemNumber),
        fecha: fecha || undefined,
        equipo: selectedEquipos.length > 0 ? selectedEquipos.join(' | ') : (equipo === 'Otro' ? customEquipo || undefined : equipo || undefined),
        sede: sede || undefined,
        falla: falla || undefined,
        tipo: tipo === 'Otro' ? customTipo || undefined : tipo || undefined,
        repuestos: repuestos || undefined,
        cantidad: finalCantidad || undefined,
        frecuenciaMeses: finalFrecuenciaMeses,
        esRecurrente: finalEsRecurrente,
        horaInicio: isCompresor() ? (horaInicio === '' ? null : Number(horaInicio)) : null,
        frecuenciaHrs: isCompresor() ? (frecuenciaHrs === '' ? null : Number(frecuenciaHrs)) : null,
        proximoMantenimientoHrs: isCompresor() ? (proximoMantenimientoHrs === '' ? null : Number(proximoMantenimientoHrs)) : null
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-slate-200">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-400 block">Item</label>
            <span className="text-[10px] text-slate-500 font-light">(Autocorrelativo diario si queda vacío)</span>
          </div>
          <input
            type="number"
            value={itemNumber as any}
            onChange={(e) => setItemNumber(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Automático"
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* Responsable */}
      <div>
        <label className="text-xs font-semibold text-slate-400 block mb-1">Responsable</label>
        <select
          value={responsable}
          onChange={(e) => setResponsable(e.target.value)}
          className={`w-full bg-slate-900 border ${
            errors.responsable ? 'border-rose-500' : 'border-white/10'
          } hover:border-white/20 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:outline-none focus:border-brand-500 font-medium`}
        >
          <option value="">-- Seleccionar Responsable --</option>
          {responsables.map((r) => (
            <option key={r.id} value={r.nombre} className="uppercase">
              {r.nombre}
            </option>
          ))}
          <option value="Otro">Otro</option>
        </select>
        {responsable === 'Otro' && (
          <input
            type="text"
            value={customResponsable}
            onChange={(e) => setCustomResponsable(e.target.value)}
            placeholder="Nombre del responsable"
            className="mt-3 w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm"
          />
        )}
        {errors.responsable && (
          <p className="text-rose-450 text-[10px] mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{errors.responsable}</span>
          </p>
        )}
      </div>

      {/* Falla (Now in the main large area) */}
      <div>
        <label className="text-xs font-semibold text-slate-400 block mb-1">Falla Reportada</label>
        <textarea
          rows={3}
          value={falla}
          onChange={(e) => setFalla(e.target.value)}
          placeholder="Describe la falla reportada..."
          className={`w-full bg-slate-900 border ${
            errors.falla ? 'border-rose-500' : 'border-white/10'
          } hover:border-white/20 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:outline-none focus:border-brand-500 font-medium placeholder-slate-600 resize-none`}
        />
      </div>

      {/* Equipo / Máquina, Sede, Falla */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Equipo / Máquina</label>
          <select
            value={equipo}
            onChange={(e) => {
              setEquipo(e.target.value);
              if (e.target.value !== 'Otro') setCustomEquipo('');
            }}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm"
          >
            {equipoOptions.map((option) => (
              <option key={option} value={option} className="uppercase">
                {option || '-- Seleccionar equipo --'}
              </option>
            ))}
          </select>
          {equipo === 'Otro' && (
            <input
              type="text"
              value={customEquipo}
              onChange={(e) => setCustomEquipo(e.target.value)}
              placeholder="Ingresa equipo personalizado"
              className="mt-3 w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm"
            />
          )}
          {/* Multi-equipos: agregar y mostrar tags */}
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const toAdd = equipo === 'Otro' ? customEquipo.trim() : equipo;
                if (!toAdd || toAdd === '') return;
                if (!selectedEquipos.includes(toAdd)) setSelectedEquipos(prev => [...prev, toAdd]);
                // reset selection
                setEquipo('');
                setCustomEquipo('');
              }}
              className="px-3 py-1.5 rounded-full bg-brand-600 text-white text-xs font-semibold"
            >Agregar equipo</button>
            <div className="flex flex-wrap gap-2">
              {selectedEquipos.map((eq) => (
                <div key={eq} className="bg-slate-800 text-slate-200 px-2 py-1 rounded-full text-xs flex items-center gap-2">
                  <span className="capitalize">{eq}</span>
                  <button type="button" onClick={() => setSelectedEquipos(prev => prev.filter(x => x !== eq))} className="ml-1 text-rose-400">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Sede</label>
          <select
            value={sede}
            onChange={(e) => setSede(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm"
          >
            {sedeOptions.map((option) => (
              <option key={option} value={option} className="uppercase">
                {option || '-- Seleccionar sede --'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Descripción de Actividad</label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe la actividad realizada..."
            className={`w-full bg-slate-900 border ${
              errors.descripcion ? 'border-rose-500' : 'border-white/10'
            } hover:border-white/20 rounded-xl py-2.5 px-3 text-slate-200 text-sm focus:outline-none focus:border-brand-500 font-medium placeholder-slate-600 resize-none`}
          />
          {errors.descripcion && (
            <p className="text-rose-450 text-[10px] mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{errors.descripcion}</span>
            </p>
          )}
        </div>
      </div>

      {/* Estado */}
      <div>
        <label className="text-xs font-semibold text-slate-400 block mb-1.5">Estado</label>
        <div className="grid grid-cols-3 gap-3">
          {/* PENDIENTE */}
          <label
            className={`flex items-center justify-center gap-1.5 py-3 rounded-2xl border text-xs font-bold cursor-pointer transition-all duration-200 shadow-sm ${
              estado === 'PENDIENTE'
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 font-bold scale-[1.02] shadow-rose-500/5'
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-slate-300 hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              name="estado"
              value="PENDIENTE"
              checked={estado === 'PENDIENTE'}
              onChange={() => setEstado('PENDIENTE')}
              className="sr-only"
            />
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>PENDIENTE</span>
          </label>

          {/* EN_PROCESO */}
          <label
            className={`flex items-center justify-center gap-1.5 py-3 rounded-2xl border text-xs font-bold cursor-pointer transition-all duration-200 shadow-sm ${
              estado === 'EN_PROCESO'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold scale-[1.02] shadow-amber-500/5'
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-slate-300 hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              name="estado"
              value="EN_PROCESO"
              checked={estado === 'EN_PROCESO'}
              onChange={() => setEstado('EN_PROCESO')}
              className="sr-only"
            />
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>EN PROCESO</span>
          </label>
          
          {/* CULMINADO */}
          <label
            className={`flex items-center justify-center gap-1.5 py-3 rounded-2xl border text-xs font-bold cursor-pointer transition-all duration-200 shadow-sm ${
              estado === 'CULMINADO'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold scale-[1.02] shadow-emerald-500/5'
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-slate-300 hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              name="estado"
              value="CULMINADO"
              checked={estado === 'CULMINADO'}
              onChange={() => setEstado('CULMINADO')}
              className="sr-only"
            />
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>CULMINADO</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Tipo de Mantenimiento</label>
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              if (e.target.value !== 'Otro') setCustomTipo('');
            }}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
          >
            {tipoOptions.map((option) => (
              <option key={option} value={option} className="uppercase">
                {option || '-- Seleccionar tipo --'}
              </option>
            ))}
          </select>
          {tipo === 'Otro' && (
            <input
              type="text"
              value={customTipo}
              onChange={(e) => setCustomTipo(e.target.value)}
              placeholder="Ingresa tipo personalizado"
              className="mt-3 w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm"
            />
          )}
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Repuestos / Insumos</label>
        <textarea
          rows={3}
          value={repuestos}
          onChange={(e) => setRepuestos(e.target.value)}
          placeholder="Describe los repuestos o insumos..."
          className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm resize-none"
        />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Cantidad</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={qty}
              min={0}
              onChange={(e) => setQty(e.target.value)}
              placeholder="ej. 1"
              className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm cursor-pointer"
            >
              <option value="">-- Unidad (opcional) --</option>
              <option value="metros">metros</option>
              <option value="kilogramo">kilogramo</option>
              <option value="unidades">unidades</option>
            </select>
          </div>
        </div>
      </div>

      {/* Programación por Uso (Horómetro) - Solo para compresoras */}
      {isCompresor() && (
        <div className="border-t border-white/5 pt-4 space-y-4 animate-in fade-in duration-300">
          <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>💡 PROGRAMACIÓN POR USO (HORÓMETRO)</span>
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Hora Inicio (Hrs)</label>
              <input
                type="number"
                min={0}
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="ej. 2000"
                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Frecuencia (Hrs)</label>
              <input
                type="number"
                min={1}
                value={frecuenciaHrs}
                onChange={(e) => setFrecuenciaHrs(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="ej. 200"
                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Próximo Mantenimiento (Hrs)</label>
              <input
                type="number"
                readOnly
                value={proximoMantenimientoHrs}
                placeholder="Calculado"
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 px-4 text-slate-400 text-sm focus:outline-none cursor-not-allowed font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Programación de Mantenimiento Preventivo (CMMS) */}
      <div className="border-t border-white/5 pt-4 space-y-4">
        <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>🔄 Programación Preventiva (CMMS)</span>
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">🔄 Frecuencia de Mantenimiento</label>
            <select
              value={frecuenciaType}
              onChange={(e) => {
                setFrecuenciaType(e.target.value);
                if (e.target.value !== 'personalizada') setCustomFrecuenciaMeses('');
              }}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm focus:outline-none focus:border-brand-500 font-medium"
            >
              <option value="unica">Única (No recurrente)</option>
              <option value="1">1 Mes</option>
              <option value="2">2 Meses</option>
              <option value="3">3 Meses</option>
              <option value="4">4 Meses</option>
              <option value="6">6 Meses</option>
              <option value="12">12 Meses</option>
              <option value="personalizada">Personalizada...</option>
            </select>
          </div>

          {frecuenciaType === 'personalizada' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-semibold text-slate-400 block mb-1">📅 Número de Meses</label>
              <input
                type="number"
                min={1}
                value={customFrecuenciaMeses}
                onChange={(e) => setCustomFrecuenciaMeses(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="ej. 5"
                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Form Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="py-2.5 px-4 rounded-xl hover:bg-white/5 border border-white/10 text-xs font-semibold text-slate-400 hover:text-white transition-all disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-600/10 hover:shadow-brand-500/15 transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Tarea'}
        </button>
      </div>
    </form>
  );
};
