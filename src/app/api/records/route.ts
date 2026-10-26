import { NextRequest, NextResponse } from 'next/server';
import { getConsolidadoRepository } from '@/infrastructure/factory/repository.factory';
import { ConsolidadoMutationSchema } from '@/modules/consolidado/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);
    const estado = searchParams.get('estado');
    const q = searchParams.get('q');

    const repo = getConsolidadoRepository();
    const filters = estado ? [{ field: 'estado', operator: 'eq' as const, value: estado }] : [];

    const result = await repo.findMany({
      page,
      pageSize,
      filters,
      search: q
        ? {
            term: q,
            fields: ['representante', 'dniCliente', 'telefonoCliente', 'correoAgente'],
          }
        : undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ConsolidadoMutationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      );
    }

    const repo = getConsolidadoRepository();
    const created = await repo.create({
      ...parsed.data,
      fecha: new Date().toISOString().slice(0, 10),
      hora: new Date().toTimeString().slice(0, 8),
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
