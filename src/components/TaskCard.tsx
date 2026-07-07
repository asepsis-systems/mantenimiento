import React from 'react';
import { Edit3, Trash2, User } from 'lucide-react';

interface Tarea {
  id: string;
  responsable: string;
  descripcion: string;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  itemNumber?: number | null;
  fecha?: string | null;
  equipo?: string | null;
  sede?: string | null;
  falla?: string | null;
  tipo?: string | null;
  repuestos?: string | null;
  cantidad?: string | null;
}

interface TaskCardProps {
  tarea: Tarea;
  onEdit: (tarea: Tarea) => void;
  onDelete: (id: string) => void;
  isViewer: boolean;
}

function TaskCard({ tarea, onEdit, onDelete, isViewer }: TaskCardProps) {
  return (
    <div className="bg-slate-800/85 border border-white/10 hover:border-brand-400/40 rounded-xl p-4.5 shadow-sm hover:shadow-lg transition-all duration-200 group">
      <div className="space-y-3">
        {/* Header small meta */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            {tarea.itemNumber !== undefined && tarea.itemNumber !== null && (
              <span className="px-2 py-0.5 bg-white/5 rounded-md">#{tarea.itemNumber}</span>
            )}
            {tarea.fecha && <span className="text-slate-300">{tarea.fecha}</span>}
          </div>
          <div className="text-[11px] text-slate-400">{tarea.tipo || ''}</div>
        </div>
        {/* Description / Work Details */}
        <p className="text-white text-xs font-semibold leading-relaxed whitespace-pre-wrap">
          {tarea.descripcion}
        </p>

        {/* Footer: Responsible name and Actions */}
        <div className="pt-2 text-xs text-slate-300 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {tarea.equipo && (
              <div className="rounded-2xl bg-white/5 px-3 py-2">
                <span className="text-[10px] uppercase text-slate-400">Equipo / Máquina</span>
                <div className="text-[12px] text-slate-100 font-semibold">{tarea.equipo}</div>
              </div>
            )}
            {tarea.falla && (
              <div className="rounded-2xl bg-white/5 px-3 py-2">
                <span className="text-[10px] uppercase text-slate-400">Falla</span>
                <div className="text-[12px] text-rose-300 font-semibold">{tarea.falla}</div>
              </div>
            )}
            {tarea.tipo && (
              <div className="rounded-2xl bg-white/5 px-3 py-2">
                <span className="text-[10px] uppercase text-slate-400">Tipo de Mantenimiento</span>
                <div className="text-[12px] text-slate-100 font-semibold">{tarea.tipo}</div>
              </div>
            )}
            {tarea.repuestos && (
              <div className="rounded-2xl bg-white/5 px-3 py-2">
                <span className="text-[10px] uppercase text-slate-400">Repuestos</span>
                <div className="text-[12px] text-slate-100 font-semibold">{tarea.repuestos}</div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-[10px] uppercase text-slate-400">Responsable</div>
            <div className="font-semibold text-slate-100">{tarea.responsable}</div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5">
            <div className="text-[10px] uppercase text-slate-400">Estado</div>
            <span className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
              tarea.estado === 'HECHO' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' :
              tarea.estado === 'PENDIENTE' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
              'bg-slate-700/80 text-slate-200 border border-slate-600/80'
            }`}>
              {tarea.estado}
            </span>
          </div>

          {!isViewer && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(tarea)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white hover:text-brand-400 transition-colors"
                title="Editar tarea"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(tarea.id)}
                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white hover:text-rose-400 transition-colors"
                title="Eliminar tarea"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
