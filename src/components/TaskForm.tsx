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
}

interface TaskFormProps {
  responsables: Responsable[];
  initialValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  responsables,
  initialValues = { responsable: '', descripcion: '', estado: 'PENDIENTE' },
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [responsable, setResponsable] = useState(initialValues.responsable);
  const [descripcion, setDescripcion] = useState(initialValues.descripcion);
  const [estado, setEstado] = useState(initialValues.estado);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!responsable.trim()) {
      newErrors.responsable = 'Debe seleccionar o escribir un responsable.';
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
      onSubmit({ responsable, descripcion, estado });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-slate-200">
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
        </select>
        {errors.responsable && (
          <p className="text-rose-450 text-[10px] mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{errors.responsable}</span>
          </p>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label className="text-xs font-semibold text-slate-400 block mb-1">Descripción del Trabajo</label>
        <textarea
          rows={4}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="ej. Lubricación de los motores principales y revisión de niveles..."
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

      {/* Estado */}
      <div>
        <label className="text-xs font-semibold text-slate-400 block mb-1">Estado Inicial</label>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`flex items-center justify-center py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
              estado === 'PENDIENTE'
                ? 'bg-amber-600/20 border-amber-500/40 text-amber-400 font-bold'
                : 'bg-slate-900 border-white/10 text-slate-500 hover:text-slate-300'
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
            <span>PENDIENTE</span>
          </label>
          
          <label
            className={`flex items-center justify-center py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
              estado === 'HECHO'
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400 font-bold'
                : 'bg-slate-900 border-white/10 text-slate-500 hover:text-slate-300'
            }`}
          >
            <input
              type="radio"
              name="estado"
              value="HECHO"
              checked={estado === 'HECHO'}
              onChange={() => setEstado('HECHO')}
              className="sr-only"
            />
            <span>HECHO</span>
          </label>
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
