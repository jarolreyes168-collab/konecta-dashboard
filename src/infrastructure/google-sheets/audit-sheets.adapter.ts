import { getGoogleSheetsClient, getTargetSheetId } from './client';
import { AuditLogEntry, AuditEventType } from '@/core/domain/audit-log.entity';
import { sanitizeForSpreadsheet } from '@/lib/sanitizer';

export class AuditSheetsAdapter {
  private sheetName: string;

  constructor(sheetName = 'LOG_ACTIVIDAD') {
    this.sheetName = sheetName;
  }

  async appendBatch(entries: Omit<AuditLogEntry, 'timestamp' | 'fecha' | 'hora'>[]): Promise<{ count: number }> {
    if (!entries || entries.length === 0) return { count: 0 };

    const client = await getGoogleSheetsClient();
    const spreadsheetId = getTargetSheetId();

    const now = new Date();
    const fecha = now.toISOString().slice(0, 10);
    const hora = now.toTimeString().slice(0, 8);

    const rows = entries.map(entry => [
      now.toISOString(),
      fecha,
      hora,
      entry.email.toLowerCase().trim(),
      sanitizeForSpreadsheet(entry.nombre, 80),
      sanitizeForSpreadsheet(entry.rol, 40),
      entry.evento,
      sanitizeForSpreadsheet(entry.modulo, 80),
      sanitizeForSpreadsheet(entry.detalle, 300),
    ]);

    await client.spreadsheets.values.append({
      spreadsheetId,
      range: `${this.sheetName}!A:I`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: rows },
    });

    return { count: rows.length };
  }

  async getRecentLogs(limit = 100): Promise<AuditLogEntry[]> {
    const client = await getGoogleSheetsClient();
    const spreadsheetId = getTargetSheetId();

    const res = await client.spreadsheets.values.get({
      spreadsheetId,
      range: `${this.sheetName}!A1:I`,
      valueRenderOption: 'FORMATTED_VALUE',
    });

    const values = res.data.values || [];
    if (values.length <= 1) return [];

    const rows = (values.slice(1).reverse().slice(0, limit) as any[]).map((r: any) => ({
      timestamp: String(r[0] || ''),
      fecha: String(r[1] || ''),
      hora: String(r[2] || ''),
      email: String(r[3] || ''),
      nombre: String(r[4] || ''),
      rol: String(r[5] || ''),
      evento: (r[6] || 'MODULO') as AuditEventType,
      modulo: String(r[7] || ''),
      detalle: String(r[8] || ''),
    }));
  }
}
