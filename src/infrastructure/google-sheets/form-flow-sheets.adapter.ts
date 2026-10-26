import { getGoogleSheetsClient, getTargetSheetId } from './client';
import { FormFlowConfig, FormFlowHistoryEntry } from '@/core/domain/form-flow.entity';

export class FormFlowSheetsAdapter {
  private sheetName: string;

  constructor(sheetName = 'FORM_FLOW_CFG') {
    this.sheetName = sheetName;
  }

  async getConfig(): Promise<{ config: FormFlowConfig; history: FormFlowHistoryEntry[] }> {
    try {
      const client = await getGoogleSheetsClient();
      const spreadsheetId = getTargetSheetId();

      const res = await client.spreadsheets.values.get({
        spreadsheetId,
        range: `${this.sheetName}!A1:B1`,
        valueRenderOption: 'RAW',
      });

      const row = res.data.values?.[0];
      const configStr = row?.[0];
      const historyStr = row?.[1];

      const config: FormFlowConfig = configStr ? JSON.parse(configStr) : { reglas: [], grupos: {} };
      const history: FormFlowHistoryEntry[] = historyStr ? JSON.parse(historyStr) : [];

      return { config, history };
    } catch {
      // Fallback si la hoja aún no está creada
      return { config: { reglas: [], grupos: {} }, history: [] };
    }
  }

  async saveConfig(newConfig: FormFlowConfig, userEmail: string): Promise<boolean> {
    const client = await getGoogleSheetsClient();
    const spreadsheetId = getTargetSheetId();

    const { config: currentConfig, history: currentHistory } = await this.getConfig();

    const newHistoryEntry: FormFlowHistoryEntry = {
      versionIndex: currentHistory.length + 1,
      timestamp: new Date().toISOString(),
      autor: userEmail,
      config: currentConfig,
    };

    const updatedHistory = [newHistoryEntry, ...currentHistory.slice(0, 4)];

    await client.spreadsheets.values.update({
      spreadsheetId,
      range: `${this.sheetName}!A1:B1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[JSON.stringify(newConfig), JSON.stringify(updatedHistory)]],
      },
    });

    return true;
  }
}
