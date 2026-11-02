import type { APIRoute } from 'astro';
import { getAllFacilitiesList, getFacilitiesByState, getFacilitiesByStateCity } from '../data/loader';
import { stateSlug } from '../utils/slugify';

const SITE = 'https://seniorhomeviolations.com';

export const GET: APIRoute = () => {
  const facilities = getAllFacilitiesList();
  const byState = getFacilitiesByState();
  const byStateCity = getFacilitiesByStateCity();

  const urls: string[] = [];

  // Homepage
  urls.push(entry('/', '1.0', 'weekly'));

  // State pages
  for (const abbr of byState.keys()) {
    urls.push(entry(`/state/${stateSlug(abbr)}/`, '0.8', 'weekly'));
  }

  // City pages
  for (const key of byStateCity.keys()) {
    urls.push(entry(`/state/${key}/`, '0.7', 'weekly'));
  }

  // Facility pages
  for (const f of facilities) {
    urls.push(entry(`${f.url}/`, '0.6', 'monthly'));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};

function entry(path: string, priority: string, changefreq: string): string {
  return `  <url>
    <loc>${SITE}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}
