import { NextRequest, NextResponse } from 'next/server';
import zlib from 'zlib';
import { getGoogleSheetsClient, getTargetSheetId } from '@/infrastructure/google-sheets/client';

export const dynamic = 'force-dynamic';

// Helper de compresión gzip transparente para Vercel Serverless
function createGzipResponse(data: any, status = 200) {
  const jsonStr = JSON.stringify(data);
  if (jsonStr.length > 2048) {
    const compressed = zlib.gzipSync(Buffer.from(jsonStr, 'utf-8'));
    return new NextResponse(compressed as any, {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'gzip',
      },
    });
  }
  return NextResponse.json(data, { status });
}

// Caché en memoria para evitar llamadas redundantes a Google Sheets
interface CacheItem {
  timestamp: number;
  values: any[][];
}
const memoryCache = new Map<string, CacheItem>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutos

// Columnas objetivo usadas en la UI del Dashboard (filtros, tarjetas, tablas y exportaciones)
const TARGET_COLUMNS = new Set([
  'mesventa', 'campana', 'origendecontacto', 'semana', 'coordinador', 'supervisor', 'representante', 'item1', 'mesactivacion', 'fecha', 'fechaentrega',
  'telefonodiscado', 'usuario', 'numerodocumento', 'nombredecliente', 'tipodeventa', 'operadorlogistico', 'nroorden1', 'resultadoentregaorden1',
  'motivoentregaorden1', 'observacionentregaorden1', 'resultadoactivacion', 'motivoactivacion', 'fechaactivacion', 'ordenactivafinal', 'reprocallback',
  'reprodetallecallback', 'reproresponsabilidadnoentrega', 'resultadoreprogramacion', 'bonoregular', 'estadofinalentrega',
  'nombreequipo', 'nombremarca', 'lugardeentrega', 'departamentoprovinciadistrito', 'horarioentrega', 'lugardenacimiento', 'nombrepadre', 'nombremadre',
  'telefonodecontacto1', 'telefonodecontacto2', 'direcciondeenvio', 'coordenadas', 'nssportabilidad', 'nrossportabilidad', 'solicitudservicioss',
  'usuarioasesor', 'valida', 'entregae', 'activae', 'progresoq', 'anuladoq', 'canceladoq', 'vvdq', 'expprog', 'vedq', 'vvtq', 'vetq',
  'correoagente', 'correosupervisor', 'ordenfinal', 'resultadoentregafinal', 'motivoentregafinal', 'observacionentregafinal', 'estadoactivafinal',
  'submotivoactivafinal', 'fechaactivafinal', 'respagenteq', '299x6q', '299x6', '50x3q', 'plan299q', 'marcatemporal', 'tiporegistro',
  'nodeclaradas', 'proyeccion', 'estado', 'modeloequipo'
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { functionName, args = [] } = body;

    const client = await getGoogleSheetsClient();
    const spreadsheetId = getTargetSheetId();

    async function getSheetValues(sheetName: string, force = false): Promise<any[][]> {
      const now = Date.now();
      const cached = memoryCache.get(sheetName);
      if (!force && cached && now - cached.timestamp < CACHE_TTL_MS) {
        return cached.values;
      }

      try {
        const res = await client.spreadsheets.values.get({
          spreadsheetId,
          range: `'${sheetName}'`,
          valueRenderOption: 'FORMATTED_VALUE',
        });
        const values = res.data.values || [];
        memoryCache.set(sheetName, { timestamp: now, values });
        return values;
      } catch (err: any) {
        console.warn(`[API Integrado] Advertencia leyendo hoja '${sheetName}':`, err.message);
        if (cached) return cached.values;
        return [];
      }
    }

    // 1. DASHBOARD PRINCIPAL (getDashboardData & getDashboardDataFast)
    if (functionName === 'getDashboardData' || functionName === 'getDashboardDataFast') {
      const fase = String(args[0] || 'actual');
      const forzar = args[1] === true;

      const displayValues = await getSheetValues('BBDD_CONSOLIDADO', forzar);
      if (displayValues.length <= 1) {
        return createGzipResponse({
          success: true,
          result: {
            userEmail: 'jarol.reyes@konecta.com',
            userName: 'Jarol Reyes',
            role: 'Coordinador',
            isAdmin: true,
            data: [],
            total: 0,
            parcial: false,
          },
        });
      }

      const allHeaders = (displayValues[0] || []).map((h: any) => String(h || '').trim());
      const allRows = displayValues.slice(1);

      // Filtrar columnas optimizadas para la UI
      const matchedIndices: number[] = [];
      const selectedHeaders: string[] = [];
      allHeaders.forEach((header, idx) => {
        const clean = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (TARGET_COLUMNS.has(clean) || selectedHeaders.length < 50) {
          matchedIndices.push(idx);
          selectedHeaders.push(header);
        }
      });

      // Detectar índice de fecha
      const fechaIdxInMatched = selectedHeaders.findIndex(
        (h) => h.toLowerCase() === 'marca temporal' || h.toLowerCase() === 'fecha'
      );

      // Separar mes en curso (actual) vs histórico (resto)
      const actualRows: any[][] = [];
      const restoRows: any[][] = [];

      allRows.forEach((row) => {
        const compactRow = matchedIndices.map((i) => (row[i] !== undefined ? row[i] : ''));
        const dateVal = String(compactRow[fechaIdxInMatched] || '');
        if (
          dateVal.includes('2026') &&
          (dateVal.includes('/10/') || dateVal.includes('-10-') || dateVal.includes('.10.') || dateVal.includes('10/'))
        ) {
          actualRows.push(compactRow);
        } else {
          restoRows.push(compactRow);
        }
      });

      // Si no se detectaron filas en Octubre, tomar las últimas 3,000 como 'actual'
      let selectedRows: any[][] = [];
      let isParcial = false;

      if (fase === 'actual') {
        selectedRows = actualRows.length > 0 ? actualRows : allRows.slice(-3000);
        isParcial = allRows.length > selectedRows.length;
      } else if (fase === 'resto') {
        selectedRows = restoRows.length > 0 ? restoRows : allRows.slice(0, Math.max(0, allRows.length - 3000));
        isParcial = false;
      } else {
        selectedRows = allRows;
        isParcial = false;
      }

      // Convertir a objetos esperados por el frontend
      const data = selectedRows.map((row) => {
        const item: Record<string, string> = {};
        for (let i = 0; i < selectedHeaders.length; i++) {
          const val = row[i];
          if (val !== undefined && val !== '') {
            item[selectedHeaders[i]] = String(val).trim();
          }
        }
        return item;
      });

      return createGzipResponse({
        success: true,
        result: {
          userEmail: 'jarol.reyes@konecta.com',
          userName: 'Jarol Reyes',
          role: 'Coordinador',
          isAdmin: true,
          fase,
          parcial: isParcial,
          total: allRows.length,
          data,
        },
      });
    }

    // 2. KPIS HISTÓRICO (BBDD_STAFF)
    if (functionName === 'getKpisHistoricoData') {
      const displayValues = await getSheetValues('BBDD_STAFF');
      if (displayValues.length <= 1) {
        return createGzipResponse({ success: true, result: [] });
      }

      const headers = (displayValues[0] || []).map((h: any) => String(h || '').trim());
      const rows = displayValues.slice(1);

      const result = rows.map((row: any[]) => {
        const item: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          if (row[idx] !== undefined && row[idx] !== '') {
            item[h] = String(row[idx]).trim();
          }
        });
        return item;
      });

      return createGzipResponse({ success: true, result });
    }

    // 3. BLINDAJE HISTÓRICO (BBDD_BLINDAJE)
    if (functionName === 'getBlindajeHistoricoData') {
      const displayValues = await getSheetValues('BBDD_BLINDAJE');
      if (displayValues.length === 0) {
        return createGzipResponse({ success: true, result: { headers: [], data: [] } });
      }

      const headers = (displayValues[0] || []).map((h: any) => String(h || '').trim());
      const rows = displayValues.slice(1);

      const data = rows.map((row: any[]) => {
        const item: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          if (row[idx] !== undefined && row[idx] !== '') {
            item[h] = String(row[idx]).trim();
          }
        });
        return item;
      });

      return createGzipResponse({ success: true, result: { headers, data } });
    }

    // 4. PICK UP (BBDD_PICKUP)
    if (functionName === 'getPickUpData') {
      let displayValues = await getSheetValues('BBDD_PICKUP');
      if (displayValues.length <= 1 || (displayValues[0] && displayValues[0][0] === '#REF!')) {
        const consol = await getSheetValues('BBDD_CONSOLIDADO');
        if (consol.length > 1) {
          const headers = (consol[0] || []).map((h: any) => String(h || '').trim());
          const tipoRegIdx = headers.indexOf('Tipo Registro');
          displayValues = [
            consol[0],
            ...consol.slice(1).filter((r: any[]) => tipoRegIdx === -1 || String(r[tipoRegIdx] || '').includes('PICK')),
          ];
        }
      }

      const headers = (displayValues[0] || []).map((h: any) => String(h || '').trim());
      const rows = displayValues.slice(1);

      const result = rows.map((row: any[]) => {
        const item: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          if (row[idx] !== undefined && row[idx] !== '') {
            item[h] = String(row[idx]).trim();
          }
        });
        return item;
      });

      return createGzipResponse({ success: true, result: { headers, data: result } });
    }

    // 5. DELIVERY (BBDD_DELIVERY)
    if (functionName === 'getDeliveryData') {
      let displayValues = await getSheetValues('BBDD_DELIVERY');
      if (displayValues.length <= 1 || (displayValues[0] && displayValues[0][0] === '#REF!')) {
        const consol = await getSheetValues('BBDD_CONSOLIDADO');
        if (consol.length > 1) {
          const headers = (consol[0] || []).map((h: any) => String(h || '').trim());
          const tipoRegIdx = headers.indexOf('Tipo Registro');
          displayValues = [
            consol[0],
            ...consol.slice(1).filter((r: any[]) => tipoRegIdx === -1 || String(r[tipoRegIdx] || '').includes('DELIVERY')),
          ];
        }
      }

      const headers = (displayValues[0] || []).map((h: any) => String(h || '').trim());
      const rows = displayValues.slice(1);

      const result = rows.map((row: any[]) => {
        const item: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          if (row[idx] !== undefined && row[idx] !== '') {
            item[h] = String(row[idx]).trim();
          }
        });
        return item;
      });

      return createGzipResponse({ success: true, result: { headers, data: result } });
    }

    // 6. TERMINALES (TERMINALES)
    if (functionName === 'getTerminalesData') {
      const displayValues = await getSheetValues('TERMINALES');
      const headers = (displayValues[0] || []).map((h: any) => String(h || '').trim()).filter(Boolean);
      const rows = displayValues.slice(1);

      const result = rows.map((row: any[]) => {
        const item: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          if (row[idx] !== undefined && row[idx] !== '') {
            item[h] = String(row[idx]).trim();
          }
        });
        return item;
      });

      return createGzipResponse({ success: true, result: { headers, data: result } });
    }

    // 7. ACCESORIOS (ACCESORIOS)
    if (functionName === 'getAccesoriosData') {
      const displayValues = await getSheetValues('ACCESORIOS');
      const headers = (displayValues[0] || []).map((h: any) => String(h || '').trim()).filter(Boolean);
      const rows = displayValues.slice(1);

      const result = rows.map((row: any[]) => {
        const item: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          if (row[idx] !== undefined && row[idx] !== '') {
            item[h] = String(row[idx]).trim();
          }
        });
        return item;
      });

      return createGzipResponse({ success: true, result: { headers, data: result } });
    }

    // 8. OPCIONES DEL FORMULARIO DE VENTAS (BBDD_DATA)
    if (functionName === 'getFormularioOpciones') {
      const valores = await getSheetValues('BBDD_DATA');
      if (valores.length < 2) {
        return createGzipResponse({ success: true, result: {} });
      }

      const encabezados = (valores[0] || []).map((h: any) => String(h || '').trim());
      const opciones: Record<string, string[]> = {};

      encabezados.forEach((nombreColumna: string, indiceColumna: number) => {
        if (!nombreColumna) return;
        const valoresUnicos = [
          ...new Set(
            valores
              .slice(1)
              .map((fila: any[]) => String(fila[indiceColumna] || '').trim())
              .filter(Boolean)
          ),
        ];
        opciones[nombreColumna] = valoresUnicos;
      });

      return createGzipResponse({ success: true, result: opciones });
    }

    // 9. DATOS DE USUARIO DOTA
    if (functionName === 'getDatosUsuarioDota') {
      return createGzipResponse({
        success: true,
        result: {
          correo: 'jarol.reyes@konecta.com',
          usuario: 'jarol.reyes',
          dni: '00000000',
          campania: 'TLV_KON',
          origenContacto: 'Fonocompras',
          esPrivilegiado: true,
          enviadoPor: 'jarol.reyes@konecta.com',
        },
      });
    }

    // 10. STOCK UNIFICADO (STOCK_UNIFICADO)
    if (functionName === 'getStockUnificadoData') {
      const displayValues = await getSheetValues('STOCK_UNIFICADO');
      const headers = (displayValues[0] || []).map((h: any) => String(h || '').trim()).filter(Boolean);
      const rows = displayValues.slice(1);

      const data = rows.map((row: any[]) => {
        const item: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          if (row[idx] !== undefined && row[idx] !== '') {
            item[h] = String(row[idx]).trim();
          }
        });
        return item;
      });

      return createGzipResponse({ success: true, result: { headers, data } });
    }

    // 11. GUARDAR FORMULARIO DE VENTA
    if (functionName === 'guardarFormularioVenta') {
      const datos = args[0] || {};
      const fecha = new Date().toISOString();

      await client.spreadsheets.values.append({
        spreadsheetId,
        range: 'RESPUESTAS_VENTA!A:Z',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [
            [
              fecha,
              datos['Lugar de Entrega'] || '',
              datos['Nombre Papá'] || '',
              datos['Tipo Venta'] || '',
              datos['Cuota mensual por el equipo'] || '',
              datos['Tipología'] || '',
              datos['Número Discado'] || '',
              datos['DNI'] || '',
              datos['Nro SS'] || '',
              datos['Venta Origen'] || '',
              datos['Campaña'] || '',
              datos['Motivo Retiro Tienda'] || '',
              datos['Bono/Descuento'] || '',
              datos['Nombre Mamá'] || '',
              datos['Modalidad/Operador'] || '',
              datos['Referencias'] || '',
              datos['SKU Accesorio'] || '',
              datos['Etiqueta Pack Ofrecida'] || '',
              datos['Documento Cliente'] || '',
              datos['Coordenadas'] || '',
              datos['Estado Civil'] || '',
              datos['Tipo Documento'] || '',
              datos['Dirección de envío'] || '',
              datos['Correo Electrónico'] || '',
              datos['Método de Pago'] || '',
              datos['Usuario'] || 'jarol.reyes',
            ],
          ],
        },
      });

      // Invalidar caché de consolidado para que se refresque
      memoryCache.delete('BBDD_CONSOLIDADO');

      return createGzipResponse({
        success: true,
        result: { exito: true, ok: true, mensaje: 'Venta registrada con éxito.' },
      });
    }

    // 12. ADMIN STATS & DIAGNÓSTICO
    if (functionName === 'getAdminStats' || functionName === 'esAdminActual') {
      return createGzipResponse({
        success: true,
        result: {
          esAdmin: true,
          sessionEmail: 'jarol.reyes@konecta.com',
          webEmail: 'jarol.reyes@konecta.com',
          correoWebEnLista: true,
          version: 'V6.1',
        },
      });
    }

    console.warn(`[API Integrado] Función desconocida solicitada: ${functionName}`);
    return createGzipResponse({ success: true, result: null });
  } catch (error: any) {
    console.error('[API Integrado] Error ejecutando:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
