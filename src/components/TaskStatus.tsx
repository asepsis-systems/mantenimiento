import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';

interface Tarea {
  id: string;
  responsable: string;
  descripcion: string;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface TaskStatusProps {
  tarea: Tarea;
  onToggleStatus: (id: string, newEstado: string) => void;
  isViewer: boolean;
}

export const TaskStatus: React.FC<TaskStatusProps> = ({ tarea, onToggleStatus, isViewer }) => {
  const isHecho = tarea.estado === 'HECHO';

  return (
    <div className="bg-slate-800/85 border border-white/10 hover:border-brand-400/40 rounded-xl p-4.5 shadow-sm hover:shadow-lg transition-all duration-200">
      <div className="space-y-4">
        {/* Description Snippet */}
        <div className="flex items-start gap-2.5">
          {isHecho ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <h4 className="font-semibold text-white text-xs leading-relaxed truncate-2-lines line-clamp-2">
            {tarea.descripcion}
          </h4>
        </div>

        {/* Status Buttons Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
          {/* Button: HECHO */}
          <button
            type="button"
            disabled={isViewer}
            onClick={() => onToggleStatus(tarea.id, 'HECHO')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border text-[10px] font-bold tracking-wide transition-all active:scale-[0.97] ${
              isHecho
                ? 'bg-emerald-600/25 border-emerald-500/40 text-emerald-400 ring-2 ring-emerald-500/10'
                : 'bg-slate-900/40 border-white/5 text-slate-500 hover:bg-slate-800/80 hover:text-slate-300 disabled:opacity-50'
            }`}
          >
            <span>✓ HECHO</span>
          </button>

          {/* Button: PENDIENTE */}
          <button
            type="button"
            disabled={isViewer}
            onClick={() => onToggleStatus(tarea.id, 'PENDIENTE')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border text-[10px] font-bold tracking-wide transition-all active:scale-[0.97] ${
              !isHecho
                ? 'bg-amber-600/25 border-amber-500/40 text-amber-400 ring-2 ring-amber-500/10'
                : 'bg-slate-900/40 border-white/5 text-slate-500 hover:bg-slate-800/80 hover:text-slate-300 disabled:opacity-50'
            }`}
          >
            <span>○ PENDIENTE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
