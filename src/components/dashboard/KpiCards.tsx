import React from 'react';
import { TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface KpiCardsProps {
  total: number;
  ventas: number;
  pendientes: number;
  efectividad: number;
}

export function KpiCards({ total, ventas, pendientes, efectividad }: KpiCardsProps) {
  const cards = [
    {
      title: 'Total Gestiones',
      value: total.toLocaleString(),
      subtext: 'BBDD Consolidado',
      icon: TrendingUp,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgIcon: 'bg-indigo-50 dark:bg-indigo-950/60',
      border: 'border-indigo-100 dark:border-indigo-900/40',
    },
    {
      title: 'Ventas Cerradas',
      value: ventas.toLocaleString(),
      subtext: 'Gestiones efectivas',
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgIcon: 'bg-emerald-50 dark:bg-emerald-950/60',
      border: 'border-emerald-100 dark:border-emerald-900/40',
    },
    {
      title: 'Pendientes',
      value: pendientes.toLocaleString(),
      subtext: 'En seguimiento',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgIcon: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-100 dark:border-amber-900/40',
    },
    {
      title: 'Efectividad Operativa',
      value: `${efectividad.toFixed(1)}%`,
      subtext: 'Ratio Ventas / Total',
      icon: AlertCircle,
      color: 'text-sky-600 dark:text-sky-400',
      bgIcon: 'bg-sky-50 dark:bg-sky-950/60',
      border: 'border-sky-100 dark:border-sky-900/40',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`p-5 rounded-2xl bg-white dark:bg-[#141D2D] border ${card.border} shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl ${card.bgIcon} ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{card.value}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
