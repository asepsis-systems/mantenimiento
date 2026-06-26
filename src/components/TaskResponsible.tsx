import React from 'react';
import { Edit2, Trash2, User } from 'lucide-react';

interface Responsable {
  id: string;
  nombre: string;
}

interface TaskResponsibleProps {
  responsable: Responsable;
  isSelected: boolean;
  onSelect: () => void;
  onRename: (id: string, currentNombre: string) => void;
  onDelete: (id: string) => void;
  isViewer: boolean;
}

export const TaskResponsible: React.FC<TaskResponsibleProps> = ({
  responsable,
  isSelected,
  onSelect,
  onRename,
  onDelete,
  isViewer
}) => {
  const getInitials = (name: string) => {
    if (!name) return '??';
    const cleanName = name.trim().toUpperCase();
    const words = cleanName.split(/\s+/);
    if (words.length >= 2) {
      return (cleanName.startsWith('ING. ') && words.length >= 3)
        ? (words[1][0] || '') + (words[2][0] || '')
        : (words[0][0] || '') + (words[1][0] || '');
    }
    return cleanName.substring(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-amber-500 text-white',
      'bg-sky-500 text-white',
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

  return (
    <div
      onClick={onSelect}
      className={`border rounded-xl p-3 flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer group/resp ${
        isSelected
          ? 'bg-brand-600/20 border-brand-500/50 ring-2 ring-brand-500/10'
          : 'bg-slate-800/60 border-white/5 hover:bg-slate-850/80 hover:border-white/10'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Avatar */}
        <div
          className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs select-none border border-slate-900/50 shrink-0 ${getAvatarColor(
            responsable.nombre
          )}`}
        >
          {getInitials(responsable.nombre)}
        </div>

        {/* Name */}
        <span
          className={`text-xs font-semibold uppercase truncate tracking-wide ${
            isSelected ? 'text-brand-300 font-bold' : 'text-slate-200'
          }`}
        >
          {responsable.nombre}
        </span>
      </div>

      {/* Edit / Delete actions for non-viewers */}
      {!isViewer && (
        <div className="flex items-center gap-1 opacity-0 group-hover/resp:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRename(responsable.id, responsable.nombre);
            }}
            className="p-1 rounded hover:bg-white/5 text-slate-450 hover:text-brand-400 transition-colors"
            title="Renombrar responsable"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(responsable.id);
            }}
            className="p-1 rounded hover:bg-rose-500/10 text-slate-455 hover:text-rose-400 transition-colors"
            title="Eliminar responsable"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
