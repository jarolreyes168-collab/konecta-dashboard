import React from 'react';
import { getConsolidadoRepository } from '@/infrastructure/factory/repository.factory';
import { getRoleBasedFilters, resolveUserRole } from '@/infrastructure/auth/rbac';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { RecordsTable } from '@/components/dashboard/RecordsTable';
import { ConsolidadoRecord } from '@/core/domain/consolidado.entity';
import { AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ResumenPage() {
  const userEmail = 'jarol.reyes@konecta.com';
  const role = resolveUserRole(userEmail);
  const filters = getRoleBasedFilters(role, userEmail);

  let records: ConsolidadoRecord[] = [];
  let total = 0;
  let errorMessage: string | null = null;

  try {
    const repo = getConsolidadoRepository();
    const result = await repo.findMany({
      filters,
      pageSize: 50,
      sortBy: 'fecha',
      sortDirection: 'desc',
    });
    records = result.data;
    total = result.total;
  } catch (err: any) {
    errorMessage = err.message;
  }

  const ventas = records.filter(r => r.estado === 'VENTA').length;
  const pendientes = records.filter(r => r.estado === 'PENDIENTE').length;
  const efectividad = total > 0 ? (ventas / total) * 100 : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Resumen General de Operaciones</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Conectado con la hoja Google Sheets: <code className="font-mono text-konecta-blue dark:text-indigo-400">{process.env.GOOGLE_SHEET_ID || '1tvTwpiG83FJoeSxBnS2a6OLksZzkrPx-pRefTvTcXmU'}</code>
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300">
            <p className="font-bold">Aviso de Configuración de Credenciales de Google Sheets</p>
            <p className="mt-1">{errorMessage}</p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Para completar la sincronización en vivo, coloca el correo de tu Service Account y la clave privada en el archivo <code className="font-mono">.env.local</code> y comparte la hoja de Google con ese correo con permisos de <strong>Editor</strong>.
            </p>
          </div>
        </div>
      )}

      <KpiCards
        total={total}
        ventas={ventas}
        pendientes={pendientes}
        efectividad={efectividad}
      />

      <RecordsTable initialRecords={records} />
    </div>
  );
}
