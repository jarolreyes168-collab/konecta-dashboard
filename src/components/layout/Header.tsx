'use client';

import React from 'react';
import { UserRole } from '@/core/domain/consolidado.entity';
import { ThemeToggle } from '../theme/ThemeToggle';
import { ShieldCheck, User, RefreshCw } from 'lucide-react';

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
}

export function Header({ user }: HeaderProps) {
  const roleBadgeColors: Record<UserRole, string> = {
    ADMIN: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    COORDINADOR: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    SUPERVISOR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    AGENTE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  return (
    <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#141D2D]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-lg text-konecta-blue dark:text-indigo-400 tracking-tight">KONECTA</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Integrado de Gestión</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">{user.email}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadgeColors[user.role]}`}>
            {user.role}
          </span>
        </div>
      </div>
    </header>
  );
}
