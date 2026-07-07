import React from 'react';
import { X } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300" 
      />

      {/* Modal Dialog Content */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-3xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/5">
          <h3 className="font-bold text-white text-base tracking-wide uppercase">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div>{children}</div>
      </div>
    </div>
  );
};
