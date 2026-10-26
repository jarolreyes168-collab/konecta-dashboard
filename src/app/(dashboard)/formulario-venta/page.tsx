import React from 'react';
import { FileEdit } from 'lucide-react';

export default function FormularioVentaPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <FileEdit className="w-5 h-5 text-konecta-blue dark:text-indigo-400" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Formulario Dinámico de Venta</h1>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Captura de transacciones gobernada por el motor de reglas FormFlow.
      </p>
      <div className="p-8 rounded-2xl bg-white dark:bg-[#141D2D] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        El formulario se renderiza automáticamente según las reglas activas de FormFlow.
      </div>
    </div>
  );
}
