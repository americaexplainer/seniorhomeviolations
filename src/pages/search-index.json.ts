import type { APIRoute } from 'astro';
import { buildSearchIndex } from '../data/loader';

export const GET: APIRoute = () => {
  const index = buildSearchIndex();
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
