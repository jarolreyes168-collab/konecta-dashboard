import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient, getTargetSheetId } from '@/infrastructure/google-sheets/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { functionName, args = [] } = body;

    const client = await getGoogleSheetsClient();
    const spreadsheetId = getTargetSheetId();

    async function getSheetValues(sheetName: string, range = 'A1:ZZ') {
      try {
        const res = await client.spreadsheets.values.get({
          spreadsheetId,
          range: `'${sheetName}'!${range}`,
          valueRenderOption: 'FORMATTED_VALUE',
        });
        return res.data.values || [];
      } catch (err: any) {
        console.warn(`[API Integrado] Error leyendo ${sheetName}:`, err.message);
        return [];
      }
    }

    // 1. DASHBOARD PRINCIPAL
    if (functionName === 'getDashboardData' || functionName === 'getDashboardDataFast') {
      const displayValues = await getSheetValues('BBDD_CONSOLIDADO');
      if (displayValues.length <= 1) {
        return NextResponse.json({
          success: true,
          result: {
            userEmail: 'jarol.reyes@konecta.com',
            userName: 'Jarol Reyes',
            role: 'Coordinador',
            isAdmin: true,
            data: [],
          },
        });
      }

      const headers = (displayValues[0] || []).map((h: any) => String(h || '').trim());
      const rows = displayValues.slice(1);

      const data = rows.map((row: any[]) => {
        const item: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          item[h] = row[idx] !== undefined ? String(row[idx]).trim() : '';
        });
        return item;
      });

      return NextResponse.json({
        success: true,
        result: {
          userEmail: 'jarol.reyes@konecta.com',
          userName: 'Jarol Reyes',
          role: 'Coordinador',
          isAdmin: true,
          data,
        },
      });
    }

    // 2. KPIS HISTÓRICO (BBDD_STAFF)
    if (functionName === 'getKpisHistoricoData') {
      const displayValues = await getSheetValues('BBDD_STAFF');
      if (displayValues.length <= 1) {
        return NextResponse.json({ success: true, result: [] });
      }

      const headers = (displayValues[0] || []).map((h: any) => String(h || '').trim());
      const rows = displayValues.slice(1);

      const result = rows.map((row: any[]) => {
        const item: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          item[h] = row[idx] !== undefined ? String(row[idx]).trim() : '';
        });
        return item;
      });

      return NextResponse.json({ success: true, result });
    }

    // 3. BLINDAJE HISTÓRICO
    if (functionName === 'getBlindajeHistoricoData') {
      const displayValues = await getSheetValues('BBDD_BLINDAJE');
      if (displayValues.length === 0) {
        return NextResponse.json({ success: true, result: { headers: [], data: [] } });
      }

      const headers = (displayValues[0] || []).map((h: any) => String(h || '').trim());
      const rows = displayValues.slice(1);

      const data = rows.map((row: any[]) => {
        const item: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          item[h] = row[idx] !== undefined ? String(row[idx]).trim() : '';
        });
        return item;
      });

      return NextResponse.json({ success: true, result: { headers, data } });
    }

    // 4. PICK UP
    if (functionName === 'getPickUpData') {
      let displayValues = await getSheetValues('BBDD_PICKUP');
      // Si la hoja BBDD_PICKUP está vacía o tiene #REF!, filtrar directo desde BBDD_CONSOLIDADO
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
          item[h] = row[idx] !== undefined ? String(row[idx]).trim() : '';
        });
        return item;
      });

      return NextResponse.json({ success: true, result: { headers, data: result } });
    }

    // 5. DELIVERY
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
          item[h] = row[idx] !== undefined ? String(row[idx]).trim() : '';
        });
        return item;
      });

      return NextResponse.json({ success: true, result: { headers, data: result } });
    }

    // 6. TERMINALES
    if (functionName === 'getTerminalesData') {
      const displayValues = await getSheetValues('TERMINALES');
      const headers = (displayValues[0] || []).map((h: any) => String(h || '').trim()).filter(Boolean);
      const rows = displayValues.slice(1);

      const result = rows.map((row: any[]) => {
        const item: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          item[h] = row[idx] !== undefined ? String(row[idx]).trim() : '';
        });
        return item;
      });

      return NextResponse.json({ success: true, result: { headers, data: result } });
    }

    // 7. ACCESORIOS
    if (functionName === 'getAccesoriosData') {
      const displayValues = await getSheetValues('ACCESORIOS');
      const headers = (displayValues[0] || []).map((h: any) => String(h || '').trim()).filter(Boolean);
      const rows = displayValues.slice(1);

      const result = rows.map((row: any[]) => {
        const item: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          item[h] = row[idx] !== undefined ? String(row[idx]).trim() : '';
        });
        return item;
      });

      return NextResponse.json({ success: true, result: { headers, data: result } });
    }

    // 8. OPCIONES DEL FORMULARIO DE VENTAS (BBDD_DATA)
    if (functionName === 'getFormularioOpciones') {
      const valores = await getSheetValues('BBDD_DATA');
      if (valores.length < 2) {
        return NextResponse.json({ success: true, result: {} });
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

      return NextResponse.json({ success: true, result: opciones });
    }

    // 9. DATOS DE USUARIO DOTA
    if (functionName === 'getDatosUsuarioDota') {
      return NextResponse.json({
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

    // 10. STOCK UNIFICADO
    if (functionName === 'getStockUnificadoData') {
      const displayValues = await getSheetValues('STOCK_UNIFICADO');
      const headers = (displayValues[0] || []).map((h: any) => String(h || '').trim()).filter(Boolean);
      const rows = displayValues.slice(1);

      const data = rows.map((row: any[]) => {
        const item: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          item[h] = row[idx] !== undefined ? String(row[idx]).trim() : '';
        });
        return item;
      });

      return NextResponse.json({ success: true, result: { headers, data } });
    }

    // 11. GUARDAR FORMULARIO DE VENTA
    if (functionName === 'guardarFormularioVenta') {
      const datos = args[0] || {};
      const fecha = new Date().toISOString();

      const res = await client.spreadsheets.values.append({
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

      return NextResponse.json({
        success: true,
        result: { exito: true, ok: true, mensaje: 'Venta registrada con éxito.' },
      });
    }

    // 12. ADMIN STATS / GENERALES
    if (functionName === 'getAdminStats' || functionName === 'esAdminActual') {
      return NextResponse.json({
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
    return NextResponse.json({ success: true, result: null });
  } catch (error: any) {
    console.error('[API Integrado] Error ejecutando:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
