import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function TrazabilidadPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-konecta-blue dark:text-indigo-400" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Módulo Trazabilidad</h1>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Línea de tiempo y seguimiento de etapas de cada gestión u orden.
      </p>
      <div className="p-8 rounded-2xl bg-white dark:bg-[#141D2D] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        Módulo Trazabilidad integrado con BBDD_CONSOLIDADO.
      </div>
    </div>
  );
}
