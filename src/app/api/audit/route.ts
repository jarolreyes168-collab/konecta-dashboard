import { NextRequest, NextResponse } from 'next/server';
import { AuditSheetsAdapter } from '@/infrastructure/google-sheets/audit-sheets.adapter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventos, perfil } = body;

    if (!eventos || !Array.isArray(eventos)) {
      return NextResponse.json({ success: false, error: 'Lista de eventos inválida' }, { status: 400 });
    }

    const adapter = new AuditSheetsAdapter();
    const entries = eventos.map((e: any) => ({
      email: perfil?.email || 'desconocido',
      nombre: perfil?.nombre || 'Desconocido',
      rol: perfil?.rol || 'AGENTE',
      evento: e.ev || 'MODULO',
      modulo: e.mod || 'GENERAL',
      detalle: e.det || '',
    }));

    const result = await adapter.appendBatch(entries);
    return NextResponse.json({ success: true, count: result.count });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
