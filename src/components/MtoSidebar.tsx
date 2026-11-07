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
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  ShieldCheck,
  CalendarCheck2
} from 'lucide-react';

interface MtoSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  userRole?: string;
}

export default function MtoSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
  userRole
}: MtoSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/'
    },
    {
      name: 'Tareas de Planta',
      href: '/',
      icon: ClipboardList,
      active: pathname === '/'
    },
    {
      name: 'Repuestos',
      href: '/repuestos',
      icon: Package,
      active: pathname.startsWith('/repuestos')
    },
    {
      name: 'Registros Generales',
      href: '/licencias',
      icon: FileCheck2,
      active: pathname.startsWith('/licencias')
    },
    ...(userRole === 'ADMIN'
      ? [
          {
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors mx-auto"
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? item.name : undefined}
                className={`flex items-center rounded-xl py-2.5 text-xs font-medium transition-all ${
                  collapsed ? 'justify-center px-0' : 'space-x-3 px-3'
                } ${
                  item.active
                    ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-white border border-blue-500/30 shadow-md shadow-blue-500/5 font-semibold'
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

        {/* Bottom Version */}
        {!collapsed && (
          <div className="p-3 border-t border-slate-800/60 text-center">
            <span className="text-[10px] text-slate-500 font-medium">
              v1.2.0 — ERP Asepsis MTO
            </span>
          </div>
        )}
      </aside>
    </>
  );
}
