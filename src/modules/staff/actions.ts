'use server';

import { DotaSheetsAdapter } from '@/infrastructure/google-sheets/dota-sheets.adapter';
import { DotaHierarchyResponse } from '@/core/domain/dota.entity';

export async function getStaffHierarchyAction(userEmail: string): Promise<{ success: boolean; data?: DotaHierarchyResponse; error?: string }> {
  try {
    const adapter = new DotaSheetsAdapter();
    const data = await adapter.getAgentesACargo(userEmail);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
