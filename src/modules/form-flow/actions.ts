'use server';

import { revalidateTag } from 'next/cache';
import { FormFlowSheetsAdapter } from '@/infrastructure/google-sheets/form-flow-sheets.adapter';
import { FormFlowConfig } from '@/core/domain/form-flow.entity';

export async function getFormFlowConfigAction() {
  try {
    const adapter = new FormFlowSheetsAdapter();
    const result = await adapter.getConfig();
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveFormFlowConfigAction(config: FormFlowConfig, userEmail: string) {
  try {
    const adapter = new FormFlowSheetsAdapter();
    await adapter.saveConfig(config, userEmail);
    revalidateTag('form-flow');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
