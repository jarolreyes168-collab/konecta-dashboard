import { IDataRepository } from '@/core/ports/data-repository.port';
import { ConsolidadoRecord } from '@/core/domain/consolidado.entity';
import { ConsolidadoSheetsAdapter } from '../google-sheets/consolidado-sheets.adapter';
import { MySQLConsolidadoAdapter } from '../mysql/mysql-consolidado.adapter';

let consolidadoRepoInstance: IDataRepository<ConsolidadoRecord> | null = null;

/**
 * Factoría que resuelve la instancia activa del repositorio de datos.
 * Lee la variable DATABASE_DRIVER ('sheets' | 'mysql').
 */
export function getConsolidadoRepository(): IDataRepository<ConsolidadoRecord> {
  if (consolidadoRepoInstance) {
    return consolidadoRepoInstance;
  }

  const driver = process.env.DATABASE_DRIVER || 'sheets';

  if (driver === 'mysql') {
    consolidadoRepoInstance = new MySQLConsolidadoAdapter();
  } else {
    consolidadoRepoInstance = new ConsolidadoSheetsAdapter('BBDD_CONSOLIDADO');
  }

  return consolidadoRepoInstance;
}
