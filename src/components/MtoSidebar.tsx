'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wrench,
  Package,
  FileCheck2,
  Users,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

interface MtoSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  userRole?: string;
  activeSection?: 'dashboard' | 'tareas';
  onSelectSection?: (section: 'dashboard' | 'tareas') => void;
}

export default function MtoSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
  userRole,
  activeSection = 'dashboard',
  onSelectSection
}: MtoSidebarProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  const navItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      href: '/?tab=dashboard',
      icon: LayoutDashboard,
      active: isHome ? activeSection === 'dashboard' : false,
      onClick: isHome && onSelectSection ? () => onSelectSection('dashboard') : undefined
    },
    {
      id: 'tareas',
      name: 'Tareas de Planta',
      href: '/?tab=tareas',
      icon: ClipboardList,
      active: isHome ? activeSection === 'tareas' : false,
      onClick: isHome && onSelectSection ? () => onSelectSection('tareas') : undefined
    },
    {
      id: 'repuestos',
      name: 'Repuestos',
      href: '/repuestos',
      icon: Package,
      active: pathname.startsWith('/repuestos')
    },
    {
      id: 'licencias',
      name: 'Registros Generales',
      href: '/licencias',
      icon: FileCheck2,
      active: pathname.startsWith('/licencias')
    },
    ...(userRole === 'ADMIN'
      ? [
          {
            id: 'users',
            name: 'Usuarios y Roles',
            href: '/users',
            icon: Users,
            active: pathname.startsWith('/users')
          }
        ]
      : [])
  ];

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
          aria-label="Cerrar menú"
        />
      )}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-40 flex shrink-0 flex-col border-r border-slate-800/80 bg-[#090e1a] text-slate-300 select-none overflow-y-auto transition-[width,transform] duration-200 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] ${
          collapsed ? 'w-16' : 'w-60'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Header inside sidebar */}
        <div className="p-3 border-b border-slate-800/60 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2 px-1">
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Mantenimiento
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors mx-auto cursor-pointer"
            title={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4 text-cyan-400" /> : <ChevronsLeft className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const handleClick = (e: React.MouseEvent) => {
              if (item.onClick) {
                e.preventDefault();
                item.onClick();
              }
              onCloseMobile();
            };

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={handleClick}
                title={collapsed ? item.name : undefined}
                className={`flex items-center rounded-xl py-2.5 text-xs font-medium transition-all ${
                  collapsed ? 'justify-center px-0' : 'space-x-3 px-3'
                } ${
                  item.active
                    ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-white border border-blue-500/30 shadow-md shadow-blue-500/5 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#121c33]/70'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    item.active ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Colapsar Button & Version */}
        <div className="p-2 border-t border-slate-800/60 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`flex items-center gap-2.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-[#121c33] transition-all cursor-pointer ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-cyan-400" />
                <span>Colapsar</span>
              </>
            )}
          </button>

          {!collapsed && (
            <div className="text-center pt-0.5 pb-1">
              <span className="text-[10px] text-slate-500 font-medium">
                v1.2.0 — MTO Asepsis
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
