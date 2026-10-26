'use server';

import { revalidateTag } from 'next/cache';
import { getConsolidadoRepository } from '@/infrastructure/factory/repository.factory';
import { ConsolidadoMutationSchema, BulkStatusUpdateSchema } from './schemas';
import { QueryOptions } from '@/core/ports/data-repository.port';
import { ConsolidadoRecord } from '@/core/domain/consolidado.entity';

export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getConsolidadoRecordsAction(options?: QueryOptions<ConsolidadoRecord>) {
  try {
    const repo = getConsolidadoRepository();
    const result = await repo.findMany(options);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al obtener registros' };
  }
}

export async function createConsolidadoRecordAction(input: unknown): Promise<ActionResponse<ConsolidadoRecord>> {
  const parsed = ConsolidadoMutationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map(i => i.message).join(', '),
    };
  }

  try {
    const repo = getConsolidadoRepository();
    const created = await repo.create({
      ...parsed.data,
      fecha: new Date().toISOString().slice(0, 10),
      hora: new Date().toTimeString().slice(0, 8),
    });
    revalidateTag('consolidado');
    return { success: true, data: created };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateConsolidadoRecordAction(
  id: string,
  input: unknown
): Promise<ActionResponse<ConsolidadoRecord>> {
  const parsed = ConsolidadoMutationSchema.partial().safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map(i => i.message).join(', '),
    };
  }

  try {
    const repo = getConsolidadoRepository();
    const updated = await repo.update(id, parsed.data);
    revalidateTag('consolidado');
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function bulkUpdateStatusAction(input: unknown): Promise<ActionResponse<{ updatedCount: number }>> {
  const parsed = BulkStatusUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map(i => i.message).join(', '),
    };
  }

  try {
    const repo = getConsolidadoRepository();
    const updates = parsed.data.ids.map(id => ({
      id,
      data: { estado: parsed.data.nuevoEstado },
    }));

    const result = await repo.bulkUpdate(updates);
    revalidateTag('consolidado');
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
