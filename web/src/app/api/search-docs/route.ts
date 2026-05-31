import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import { NextResponse } from 'next/server';

const { GET: searchGET } = createFromSource(source);

// Em producao o fumadocs nao deve ser acessivel — bloqueia o endpoint de busca
// dos docs junto com as rotas /docs (ver next.config.ts e docs/page.tsx).
export function GET(request: Request): Promise<Response> | Response {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not Found' }, { status: 404 });
  }

  return searchGET(request);
}
