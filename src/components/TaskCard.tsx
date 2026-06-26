import React from 'react';
import { Edit3, Trash2, User } from 'lucide-react';

interface Tarea {
  id: string;
  responsable: string;
  descripcion: string;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface TaskCardProps {
  tarea: Tarea;
  onEdit: (tarea: Tarea) => void;
  onDelete: (id: string) => void;
  isViewer: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ tarea, onEdit, onDelete, isViewer }) => {
  return (
    <div className="bg-slate-800/85 border border-white/10 hover:border-brand-400/40 rounded-xl p-4.5 shadow-sm hover:shadow-lg transition-all duration-200 group">
      <div className="space-y-3">
        {/* Description / Work Details */}
        <p className="text-white text-xs font-semibold leading-relaxed whitespace-pre-wrap">
          {tarea.descripcion}
        </p>

        {/* Footer: Responsible name and Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
            <User className="w-3.5 h-3.5 text-brand-400" />
            <span className="uppercase tracking-wider truncate max-w-[150px]" title={tarea.responsable}>
              {tarea.responsable}
            </span>
          </div>

          {!isViewer && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(tarea)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-450 hover:text-brand-400 transition-colors"
                title="Editar tarea"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(tarea.id)}
                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-455 hover:text-rose-400 transition-colors"
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
};
