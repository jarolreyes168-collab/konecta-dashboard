'use client';

import React, { useState, useTransition } from 'react';
import { ConsolidadoRecord, ManagementStatus, ManagementType } from '@/core/domain/consolidado.entity';
import { bulkUpdateStatusAction } from '@/modules/consolidado/actions';
import { Search, Filter, CheckSquare, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface RecordsTableProps {
  initialRecords: ConsolidadoRecord[];
}

const STATUS_BADGES: Record<ManagementStatus, string> = {
  VENTA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  PENDIENTE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  CONTACTADO: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  NO_DESEA: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  RECHAZADO: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
};

export function RecordsTable({ initialRecords }: RecordsTableProps) {
  const [records, setRecords] = useState<ConsolidadoRecord[]>(initialRecords);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [typeFilter, setTypeFilter] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [isPending, startTransition] = useTransition();

  // Filtrado local
  const filtered = records.filter(row => {
    const term = search.toLowerCase();
    const matchSearch =
      row.representante.toLowerCase().includes(term) ||
      row.dniCliente.toLowerCase().includes(term) ||
      row.telefonoCliente.toLowerCase().includes(term) ||
      row.correoAgente.toLowerCase().includes(term);

    const matchStatus = statusFilter === 'TODOS' || row.estado === statusFilter;
    const matchType = typeFilter === 'TODOS' || row.tipoGestion === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginated.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleBulkUpdate = (newStatus: ManagementStatus) => {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      const res = await bulkUpdateStatusAction({
        ids: selectedIds,
        nuevoEstado: newStatus,
      });

      if (res.success) {
        setRecords(prev =>
          prev.map(r => (selectedIds.includes(r.id) ? { ...r, estado: newStatus } : r))
        );
        setSelectedIds([]);
      } else {
        alert(res.error || 'Error al actualizar registros');
      }
    });
  };

  return (
    <div className="bg-white dark:bg-[#141D2D] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por asesor, DNI o teléfono..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-konecta-blue/30 dark:focus:ring-indigo-500/40"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="VENTA">Venta</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="CONTACTADO">Contactado</option>
            <option value="NO_DESEA">No Desea</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="TODOS">Todos los Tipos</option>
            <option value="PICK_UP">Pick Up</option>
            <option value="DELIVERY">Delivery</option>
            <option value="TERMINALES">Terminales</option>
            <option value="ACCESORIOS">Accesorios</option>
            <option value="EQUIPOS">Equipos</option>
          </select>
        </div>

        {/* Acciones por Lote */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
              {selectedIds.length} seleccionados
            </span>
            <button
              disabled={isPending}
              onClick={() => handleBulkUpdate('VENTA')}
              className="text-xs font-semibold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:opacity-50"
            >
              Venta
            </button>
            <button
              disabled={isPending}
              onClick={() => handleBulkUpdate('RECHAZADO')}
              className="text-xs font-semibold px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition disabled:opacity-50"
            >
              Rechazar
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#182337] text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase font-bold text-[11px]">
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={paginated.length > 0 && selectedIds.length === paginated.length}
                  className="rounded text-konecta-blue focus:ring-konecta-blue"
                />
              </th>
              <th className="p-3">Fecha / Hora</th>
              <th className="p-3">Asesor / Supervisor</th>
              <th className="p-3">Campaña / Tipo</th>
              <th className="p-3">Cliente / Teléfono</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                  No se encontraron registros en BBDD_CONSOLIDADO.
                </td>
              </tr>
            ) : (
              paginated.map(row => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => handleToggleSelect(row.id)}
                      className="rounded text-konecta-blue focus:ring-konecta-blue"
                    />
                  </td>
                  <td className="p-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{row.fecha}</div>
                    <div className="text-[10px] text-slate-400">{row.hora}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{row.representante}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{row.correoSupervisor}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{row.campania}</span>
                    <div className="text-[10px] font-bold text-konecta-blue dark:text-indigo-400 uppercase">
                      {row.tipoGestion}
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                      DNI: {row.dniCliente}
                    </div>
                    <div className="text-[11px] text-slate-400">{row.telefonoCliente}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_BADGES[row.estado]}`}
                    >
                      {row.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} a{' '}
          {Math.min(currentPage * pageSize, filtered.length)} de {filtered.length} registros
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-semibold">
            Pág. {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
