'use client';

import React from 'react';
import {
  Menu,
  X,
  MapPin,
  Search,
  Bell,
  LogOut,
  Plus,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';

interface MtoTopNavbarProps {
  user: {
    name?: string;
    username?: string;
    role?: string;
  } | null;
  selectedSede: string;
  onSedeChange: (sede: string) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  onOpenCreateTask: () => void;
  onLogout: () => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export default function MtoTopNavbar({
  user,
  selectedSede,
  onSedeChange,
  searchTerm,
  onSearchChange,
  onOpenCreateTask,
  onLogout,
  mobileMenuOpen,
  onToggleMobileMenu
}: MtoTopNavbarProps) {
  // Initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-14 bg-[#090e1a]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-5 lg:px-6 flex items-center justify-between sticky top-0 z-30 select-none no-print">
      {/* Left: Mobile button + Brand + Sede Selector + Quick Search */}
      <div className="flex items-center gap-2.5 sm:gap-4 lg:gap-6">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-300 hover:text-white hover:bg-[#121c33] transition-colors"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand Shield Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-sm shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2Z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wide text-white leading-tight">ERP Asepsis</span>
            <span className="text-[10px] font-semibold text-cyan-400 tracking-wider">
              {selectedSede === 'ALL' || !selectedSede ? 'MTO • TODAS' : `MTO • ${selectedSede}`}
            </span>
          </div>
        </div>

        {/* Sede Selector Dropdown Pill */}
        <div className="hidden sm:flex items-center space-x-1.5 bg-[#121c33] border border-slate-700/60 rounded-xl px-2.5 py-1 text-xs text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-medium text-slate-400">Sede:</span>
          <select
            value={selectedSede}
            onChange={(e) => onSedeChange(e.target.value)}
            className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer pr-1"
          >
            <option value="ALL" className="bg-[#0f172a] text-white">Todas</option>
            <option value="LIMA" className="bg-[#0f172a] text-white">Lima</option>
            <option value="TRUJILLO" className="bg-[#0f172a] text-white">Trujillo</option>
          </select>
        </div>

        {/* Global Fast Search bar */}
        <div className="hidden md:flex items-center bg-[#121c33] border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-300 w-52 lg:w-64 justify-between focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all">
          <div className="flex items-center space-x-2 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent text-white text-xs placeholder-slate-500 focus:outline-none w-full"
            />
          </div>
          <kbd className="hidden lg:inline-block bg-slate-800 text-[10px] text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right: Action button + Notifications + User Profile + Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Create Task Button */}
        <button
          type="button"
          onClick={onOpenCreateTask}
          className="py-1.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 border border-blue-400/30 text-xs font-bold text-white transition-all active:scale-95 flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Crear nueva tarea</span>
          <span className="sm:hidden">Nueva</span>
        </button>

        {/* User Profile */}
        {user && (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-cyan-600/30 shrink-0">
              {getInitials(user.name || user.username)}
            </div>
            <div className="hidden xl:flex flex-col text-left leading-tight max-w-[130px]">
              <span className="text-xs font-semibold text-white truncate" title={user.name}>
                {user.name || user.username}
              </span>
              <span className="text-[10px] text-slate-400 font-medium capitalize truncate">
                {user.role?.toLowerCase() || 'Usuario'}
              </span>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="p-2 rounded-xl bg-slate-800/40 hover:bg-rose-500/15 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-all active:scale-95 cursor-pointer ml-1"
          title="Cerrar Sesión"
          aria-label="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
