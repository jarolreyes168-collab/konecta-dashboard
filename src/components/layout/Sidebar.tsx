'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Award,
  Package,
  Truck,
  Smartphone,
  FileEdit,
  BarChart3,
  Shield,
  Activity,
  GitBranch,
} from 'lucide-react';

interface SidebarProps {
  isAdminOrCoordinator?: boolean;
}

export function Sidebar({ isAdminOrCoordinator = true }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Resumen', href: '/resumen', icon: LayoutDashboard },
    { label: 'Trazabilidad', href: '/trazabilidad', icon: TrendingUp },
    { label: 'Efectividad', href: '/efectividad', icon: Award },
    { label: 'Pick Up', href: '/pickup', icon: Package },
    { label: 'Delivery', href: '/delivery', icon: Truck },
    { label: 'Terminales', href: '/terminales', icon: Smartphone },
    { label: 'Formulario Venta', href: '/formulario-venta', icon: FileEdit },
    { label: 'KPIs Histórico', href: '/kpis-historico', icon: BarChart3 },
    { label: 'Blindaje', href: '/blindaje', icon: Shield },
  ];

  const adminItems = [
    { label: 'Log Actividad', href: '/admin/actividad', icon: Activity },
    { label: 'Flujos Formulario', href: '/admin/flujos', icon: GitBranch },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141D2D] flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Módulos Operativos
          </p>
          <nav className="space-y-1">
            {navItems.map(item => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition ${
                    active
                      ? 'bg-konecta-blue text-white shadow-sm shadow-konecta-blue/20 dark:bg-indigo-600'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {isAdminOrCoordinator && (
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Administración
            </p>
            <nav className="space-y-1">
              {adminItems.map(item => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          <p className="font-semibold text-slate-600 dark:text-slate-400">Konecta Next.js v2.0</p>
          <p>Sheets ID: ...{process.env.NEXT_PUBLIC_SHEET_ID_SHORT || 'XmU'}</p>
        </div>
      </div>
    </aside>
  );
}
