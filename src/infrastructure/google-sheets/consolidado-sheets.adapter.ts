import { IDataRepository, QueryOptions, PaginatedResult } from '@/core/ports/data-repository.port';
import { ConsolidadoRecord, ManagementStatus, ManagementType } from '@/core/domain/consolidado.entity';
import { getGoogleSheetsClient, getTargetSheetId } from './client';
import { sanitizeForSpreadsheet } from '@/lib/sanitizer';

export class ConsolidadoSheetsAdapter implements IDataRepository<ConsolidadoRecord> {
  private sheetName: string;

  constructor(sheetName = 'BBDD_CONSOLIDADO') {
    this.sheetName = sheetName;
  }

  private normalizeHeader(val: string): string {
    return String(val || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private mapRowToRecord(row: string[], headerMap: Map<string, number>, rowIndex: number): ConsolidadoRecord {
    const getVal = (colName: string): string => {
      const idx = headerMap.get(this.normalizeHeader(colName));
      return idx !== undefined && row[idx] !== undefined ? String(row[idx]).trim() : '';
    };

    const idVal = getVal('ID');
    // Si no tiene columna ID explícita, se usa el número de fila A1 de la hoja (fila 1 es header)
    const id = idVal || String(rowIndex + 2);

    return {
      id,
      fecha: getVal('Fecha'),
      hora: getVal('Hora'),
      representante: getVal('Representante') || getVal('Usuario') || getVal('Asesor'),
      correoAgente: getVal('Correo Agente').toLowerCase(),
      correoSupervisor: getVal('CORREO_SUPERVISOR') || getVal('Correo Supervisor'),
      coordinador: getVal('Coordinador'),
      campania: getVal('Campaña') || getVal('Campania'),
      tipoGestion: (getVal('Tipo Gestion') || getVal('Tipo') || 'PICK_UP') as ManagementType,
      estado: (getVal('Estado') || 'PENDIENTE') as ManagementStatus,
      dniCliente: getVal('DNI Cliente') || getVal('DNI'),
      telefonoCliente: getVal('Telefono Cliente') || getVal('Telefono'),
      observaciones: getVal('Observaciones'),
      imagenEquipo: getVal('Imagen Equipo'),
    };
  }

  private recordToRow(record: Partial<ConsolidadoRecord>): string[] {
    return [
      sanitizeForSpreadsheet(record.id ?? ''),
      sanitizeForSpreadsheet(record.fecha ?? new Date().toISOString().slice(0, 10)),
      sanitizeForSpreadsheet(record.hora ?? new Date().toTimeString().slice(0, 8)),
      sanitizeForSpreadsheet(record.representante ?? ''),
      sanitizeForSpreadsheet(record.correoAgente ?? ''),
      sanitizeForSpreadsheet(record.correoSupervisor ?? ''),
      sanitizeForSpreadsheet(record.coordinador ?? ''),
      sanitizeForSpreadsheet(record.campania ?? ''),
      sanitizeForSpreadsheet(record.tipoGestion ?? 'PICK_UP'),
      sanitizeForSpreadsheet(record.estado ?? 'PENDIENTE'),
      sanitizeForSpreadsheet(record.dniCliente ?? ''),
      sanitizeForSpreadsheet(record.telefonoCliente ?? ''),
      sanitizeForSpreadsheet(record.observaciones ?? ''),
      sanitizeForSpreadsheet(record.imagenEquipo ?? ''),
    ];
  }

  private async fetchAllRows(): Promise<{ records: ConsolidadoRecord[]; headerMap: Map<string, number> }> {
    const client = await getGoogleSheetsClient();
    const spreadsheetId = getTargetSheetId();

    const response = await client.spreadsheets.values.get({
      spreadsheetId,
      range: `${this.sheetName}!A1:Z`,
      valueRenderOption: 'FORMATTED_VALUE',
    });

    const values = response.data.values;
    if (!values || values.length <= 1) {
      return { records: [], headerMap: new Map() };
    }

    const rawHeaders: string[] = values[0];
    const headerMap = new Map<string, number>();
    rawHeaders.forEach((h, index) => {
      headerMap.set(this.normalizeHeader(h), index);
    });

    const records: ConsolidadoRecord[] = values.slice(1).map((row, index) => {
      return this.mapRowToRecord(row, headerMap, index);
    });

    return { records, headerMap };
  }

  async findMany(options?: QueryOptions<ConsolidadoRecord>): Promise<PaginatedResult<ConsolidadoRecord>> {
    const { records } = await this.fetchAllRows();
    let result = [...records];

    // Filtros por campo exacto o inclusión
    if (options?.filters && options.filters.length > 0) {
      result = result.filter(rec => {
        return options.filters!.every(f => {
          const val = String((rec as any)[f.field] || '').toLowerCase().trim();
          const target = String(f.value || '').toLowerCase().trim();

          if (f.operator === 'eq') return val === target;
          if (f.operator === 'neq') return val !== target;
          if (f.operator === 'contains') return val.includes(target);
          if (f.operator === 'in' && Array.isArray(f.value)) {
            return f.value.map(v => String(v).toLowerCase().trim()).includes(val);
          }
          return true;
        });
      });
    }

    // Búsqueda en texto libre
    if (options?.search && options.search.term) {
      const term = options.search.term.toLowerCase().trim();
      result = result.filter(rec => {
        return options.search!.fields.some(field => {
          const val = String((rec as any)[field] || '').toLowerCase();
          return val.includes(term);
        });
      });
    }

    // Ordenamiento
    if (options?.sortBy) {
      const sortField = options.sortBy;
      const dir = options.sortDirection === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        const valA = String(a[sortField] ?? '');
        const valB = String(b[sortField] ?? '');
        return valA.localeCompare(valB) * dir;
      });
    }

    const total = result.length;
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 25;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginatedData = result.slice((page - 1) * pageSize, page * pageSize);

    return {
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findById(id: string): Promise<ConsolidadoRecord | null> {
    const { records } = await this.fetchAllRows();
    const found = records.find(r => r.id === id);
    return found || null;
  }

  async create(item: Omit<ConsolidadoRecord, 'id'>): Promise<ConsolidadoRecord> {
    const client = await getGoogleSheetsClient();
    const spreadsheetId = getTargetSheetId();

    const newId = `REC-${Date.now()}`;
    const newRecord: ConsolidadoRecord = {
      ...item,
      id: newId,
      fecha: item.fecha || new Date().toISOString().slice(0, 10),
      hora: item.hora || new Date().toTimeString().slice(0, 8),
    };

    const rowValues = this.recordToRow(newRecord);

    await client.spreadsheets.values.append({
      spreadsheetId,
      range: `${this.sheetName}!A:N`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [rowValues] },
    });

    return newRecord;
  }

  async update(id: string, item: Partial<ConsolidadoRecord>): Promise<ConsolidadoRecord> {
    const { records } = await this.fetchAllRows();
    const rowIndex = records.findIndex(r => r.id === id);

    if (rowIndex === -1) {
      throw new Error(`Registro con ID ${id} no encontrado en ${this.sheetName}.`);
    }

    const existing = records[rowIndex];
    const updated: ConsolidadoRecord = { ...existing, ...item };
    const sheetRowNumber = rowIndex + 2;

    const client = await getGoogleSheetsClient();
    const spreadsheetId = getTargetSheetId();

    await client.spreadsheets.values.update({
      spreadsheetId,
      range: `${this.sheetName}!A${sheetRowNumber}:N${sheetRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [this.recordToRow(updated)],
      },
    });

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const { records } = await this.fetchAllRows();
    const rowIndex = records.findIndex(r => r.id === id);
    if (rowIndex === -1) return false;

    const client = await getGoogleSheetsClient();
    const spreadsheetId = getTargetSheetId();

    const ssMeta = await client.spreadsheets.get({ spreadsheetId });
    const sheet = ssMeta.data.sheets?.find(s => s.properties?.title === this.sheetName);
    const numericSheetId = sheet?.properties?.sheetId;

    if (numericSheetId === undefined) {
      throw new Error(`No se encontró el ID interno de la pestaña ${this.sheetName}`);
    }

    const zeroBasedRowIndex = rowIndex + 1; // 0-indexed para batchUpdate
    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: numericSheetId,
                dimension: 'ROWS',
                startIndex: zeroBasedRowIndex,
                endIndex: zeroBasedRowIndex + 1,
              },
            },
          },
        ],
      },
    });

    return true;
  }

  async bulkUpdate(updates: { id: string; data: Partial<ConsolidadoRecord> }[]): Promise<{ updatedCount: number }> {
    const { records } = await this.fetchAllRows();
    const client = await getGoogleSheetsClient();
    const spreadsheetId = getTargetSheetId();
    const dataToWrite: { range: string; values: string[][] }[] = [];

    let count = 0;
    for (const update of updates) {
      const idx = records.findIndex(r => r.id === update.id);
      if (idx !== -1) {
        const merged: ConsolidadoRecord = { ...records[idx], ...update.data };
        const sheetRowNumber = idx + 2;
        dataToWrite.push({
          range: `${this.sheetName}!A${sheetRowNumber}:N${sheetRowNumber}`,
          values: [this.recordToRow(merged)],
        });
        count++;
      }
    }

    if (dataToWrite.length > 0) {
      await client.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: dataToWrite,
        },
      });
    }

    return { updatedCount: count };
  }
}
