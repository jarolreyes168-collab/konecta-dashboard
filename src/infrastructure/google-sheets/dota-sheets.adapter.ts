import { getGoogleSheetsClient, getTargetSheetId } from './client';
import { DotaAgent, DotaHierarchyResponse } from '@/core/domain/dota.entity';

export class DotaSheetsAdapter {
  private sheetName: string;

  constructor(sheetName = 'DOTA') {
    this.sheetName = sheetName;
  }

  private normalizeHeader(val: string): string {
    return String(val || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  async getAgentesACargo(userEmail: string): Promise<DotaHierarchyResponse> {
    const client = await getGoogleSheetsClient();
    const spreadsheetId = getTargetSheetId();

    const response = await client.spreadsheets.values.get({
      spreadsheetId,
      range: `${this.sheetName}!A1:Z`,
      valueRenderOption: 'FORMATTED_VALUE',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      return { isSupervisor: false, isCoordinador: false, supervisorEmail: userEmail, agentes: [] };
    }

    const rawHeaders: string[] = rows[0];
    const headerMap = new Map<string, number>();
    rawHeaders.forEach((h, idx) => headerMap.set(this.normalizeHeader(h), idx));

    const colCorreoSuper = headerMap.get('correosupervisor') ?? -1;
    const colCorreoCoord = headerMap.get('correocoordinador') ?? -1;
    const colCorreoAgente = headerMap.get('correocuenta') ?? headerMap.get('correo') ?? -1;
    const colNombre = headerMap.get('nombre') ?? headerMap.get('nombres') ?? -1;
    const colDni = headerMap.get('dni') ?? -1;
    const colCampania = headerMap.get('campana') ?? headerMap.get('campania') ?? -1;

    const emailNorm = userEmail.toLowerCase().trim();

    const matchedRows = rows.slice(1).filter((r: string[]) => {
      const superMail = colCorreoSuper !== -1 ? String(r[colCorreoSuper] || '').toLowerCase().trim() : '';
      const coordMail = colCorreoCoord !== -1 ? String(r[colCorreoCoord] || '').toLowerCase().trim() : '';
      return superMail === emailNorm || coordMail === emailNorm;
    });

    const isSupervisor = matchedRows.some((r: string[]) => {
      const superMail = colCorreoSuper !== -1 ? String(r[colCorreoSuper] || '').toLowerCase().trim() : '';
      return superMail === emailNorm;
    });

    const isCoordinador = matchedRows.some((r: string[]) => {
      const coordMail = colCorreoCoord !== -1 ? String(r[colCorreoCoord] || '').toLowerCase().trim() : '';
      return coordMail === emailNorm;
    });

    const agentes: DotaAgent[] = matchedRows.map((r: string[]) => {
      const correo = colCorreoAgente !== -1 ? String(r[colCorreoAgente] || '').trim() : '';
      return {
        correo,
        usuario: correo.split('@')[0],
        dni: colDni !== -1 ? String(r[colDni] || '').trim() : '',
        campania: colCampania !== -1 ? String(r[colCampania] || '').trim() : '',
        nombre: colNombre !== -1 ? String(r[colNombre] || '').trim() : correo.split('@')[0],
        correoSupervisor: colCorreoSuper !== -1 ? String(r[colCorreoSuper] || '').trim() : '',
        correoCoordinador: colCorreoCoord !== -1 ? String(r[colCorreoCoord] || '').trim() : '',
      };
    });

    return {
      isSupervisor,
      isCoordinador,
      supervisorEmail: emailNorm,
      agentes,
    };
  }
}
