import React from 'react';
import { GitBranch } from 'lucide-react';
import { getFormFlowConfigAction } from '@/modules/form-flow/actions';

export const dynamic = 'force-dynamic';

export default async function AdminFlujosPage() {
  const res = await getFormFlowConfigAction();
  const config = res.data?.config;
  const history = res.data?.history || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Configuración de Flujos y Reglas (FormFlow)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Gestión visual del árbol de reglas, dependencias de campos e historial de versiones para rollback.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#141D2D] border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Reglas Activas</h2>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {config?.reglas?.length ? (
              <ul className="space-y-2">
                {config.reglas.map((r, i) => (
                  <li key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">Si {r.campoOrigen}</span> {r.condicion} &quot;{r.valorCondicion}&quot; &rarr; Mostrar {r.mostrarCampos.join(', ')}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-6 text-center text-slate-400">No hay reglas condicionales configuradas aún.</p>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#141D2D] border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Historial de Versiones</h2>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-xs text-slate-400">Sin historial registrado.</p>
            ) : (
              history.map((h, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{h.timestamp.slice(0, 19).replace('T', ' ')}</p>
                  <p className="text-[11px] text-slate-400">Por: {h.autor}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
