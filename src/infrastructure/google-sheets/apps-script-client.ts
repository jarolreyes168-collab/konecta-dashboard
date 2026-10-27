/**
 * Cliente Proxy para Google Sheets basado en Google Apps Script Web App.
 * Permite saltarse las restricciones de dominio / DLP corporativo de Konecta,
 * ya que Apps Script se ejecuta con la identidad y permisos de la cuenta interna de Google.
 */

interface AppsScriptResponse {
  values?: any[][];
  sheets?: Array<{ properties: { title: string; sheetId: number } }>;
  success?: boolean;
  count?: number;
  error?: string;
  status?: string;
}

function parseRange(rangeStr?: string) {
  if (!rangeStr) return { sheetName: 'BBDD_CONSOLIDADO', cellRange: '' };
  const parts = rangeStr.split('!');
  if (parts.length > 1) {
    return {
      sheetName: parts[0].replace(/['"]/g, '').trim(),
      cellRange: parts[1].trim(),
    };
  }
  return { sheetName: 'BBDD_CONSOLIDADO', cellRange: rangeStr.trim() };
}

export function getAppsScriptSheetsClient(scriptUrl: string) {
  async function callAppsScript(payload: any): Promise<AppsScriptResponse> {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Apps Script respondió con estado HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        if (json.error) {
          throw new Error(`Error en Google Apps Script: ${json.error}`);
        }
        return json;
      } catch (err: any) {
        if (text.includes('<HTML>') || text.includes('<!DOCTYPE') || text.includes('accounts.google.com')) {
          throw new Error(
            'El script de Google Apps Script requiere permisos públicos. Asegúrate de publicar la aplicación web con "Quién tiene acceso" = "Cualquiera" (Anyone).'
          );
        }
        throw new Error(`Respuesta inválida de Apps Script: ${text.slice(0, 200)}`);
      }
    } catch (error: any) {
      console.error('[AppsScriptClient] Error ejecutando acción en Apps Script:', error);
      throw error;
    }
  }

  return {
    spreadsheets: {
      values: {
        get: async (params: { spreadsheetId?: string; range: string; valueRenderOption?: string }) => {
          const { sheetName, cellRange } = parseRange(params.range);
          const result = await callAppsScript({
            action: 'getValues',
            sheetName,
            range: cellRange,
          });

          return {
            data: {
              values: result.values || [],
            },
          };
        },

        append: async (params: {
          spreadsheetId?: string;
          range: string;
          valueInputOption?: string;
          insertDataOption?: string;
          requestBody: { values: any[][] };
        }) => {
          const { sheetName } = parseRange(params.range);
          const result = await callAppsScript({
            action: 'appendValues',
            sheetName,
            values: params.requestBody.values,
          });

          return {
            data: {
              updates: {
                updatedRows: result.count || params.requestBody.values.length,
              },
            },
          };
        },

        update: async (params: {
          spreadsheetId?: string;
          range: string;
          valueInputOption?: string;
          requestBody: { values: any[][] };
        }) => {
          const { sheetName, cellRange } = parseRange(params.range);
          await callAppsScript({
            action: 'updateValues',
            sheetName,
            range: cellRange,
            values: params.requestBody.values,
          });

          return {
            data: {
              updatedRows: params.requestBody.values.length,
            },
          };
        },

        batchUpdate: async (params: {
          spreadsheetId?: string;
          requestBody: {
            valueInputOption?: string;
            data: Array<{ range: string; values: any[][] }>;
          };
        }) => {
          await callAppsScript({
            action: 'batchUpdateValues',
            data: params.requestBody.data,
          });

          return {
            data: {
              totalUpdatedRows: params.requestBody.data.length,
            },
          };
        },
      },

      get: async (params: { spreadsheetId?: string }) => {
        const result = await callAppsScript({ action: 'getMeta' });
        return {
          data: {
            sheets: result.sheets || [
              { properties: { title: 'BBDD_CONSOLIDADO', sheetId: 0 } },
              { properties: { title: 'LOG_ACTIVIDAD', sheetId: 1 } },
              { properties: { title: 'DOTA', sheetId: 2 } },
              { properties: { title: 'FORM_FLOW_CFG', sheetId: 3 } },
            ],
          },
        };
      },

      batchUpdate: async (params: {
        spreadsheetId?: string;
        requestBody: {
          requests: Array<any>;
        };
      }) => {
        const requests = params.requestBody.requests || [];
        for (const req of requests) {
          if (req.deleteDimension && req.deleteDimension.dimension === 'ROWS') {
            const startIndex = req.deleteDimension.range.startIndex; // 0-based
            const rowIndex = startIndex + 1; // 1-based para Apps Script
            await callAppsScript({
              action: 'deleteRow',
              rowIndex,
            });
          }
        }

        return { data: { replies: [] } };
      },
    },
  };
}

