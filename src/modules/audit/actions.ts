'use server';

import { AuditSheetsAdapter } from '@/infrastructure/google-sheets/audit-sheets.adapter';
import { AuditEventType, AuditLogEntry } from '@/core/domain/audit-log.entity';

export async function logAuditEventAction(
  evento: AuditEventType,
  modulo: string,
  detalle: string,
  user: { email: string; nombre: string; rol: string }
) {
  try {
    const adapter = new AuditSheetsAdapter();
    await adapter.appendBatch([
      {
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        evento,
        modulo,
        detalle,
      },
    ]);
    return { success: true };
  } catch (err: any) {
    console.error('Error logging audit event:', err.message);
    return { success: false, error: err.message };
  }
}

export async function getAuditLogsAction(limit = 100): Promise<{ success: boolean; data?: AuditLogEntry[]; error?: string }> {
  try {
    const adapter = new AuditSheetsAdapter();
    const data = await adapter.getRecentLogs(limit);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
