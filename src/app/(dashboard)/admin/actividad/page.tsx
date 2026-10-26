import React from 'react';
import { getAuditLogsAction } from '@/modules/audit/actions';
import { Activity, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminActividadPage() {
  const res = await getAuditLogsAction(100);
  const logs = res.data || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Registro de Actividad y Auditoría (LOG_ACTIVIDAD)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Telemetría de eventos de usuario (Login, Módulos, Búsquedas, Formularios y Exportaciones)
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141D2D] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#182337] text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase font-bold text-[11px]">
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Usuario / Email</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Evento</th>
                <th className="p-3">Módulo</th>
                <th className="p-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    No hay registros de auditoría aún en LOG_ACTIVIDAD.
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={index} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      <div>{log.fecha}</div>
                      <div className="text-[10px] text-slate-400">{log.hora}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{log.nombre}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{log.email}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.rol}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {log.evento}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                      {log.modulo}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {log.detalle}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
