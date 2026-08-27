/**
 * De XML-sitemap bevat absolute URL's met het productiedomein. Zolang het domein
 * nog niet op deze Worker staat (of bij een preview op *.workers.dev) verwijst de
 * sitemap dan naar een host die hier niets serveert.
 *
 * Deze Worker herschrijft het domein in de sitemap naar de host waarop hij wordt
 * opgevraagd, zodat de sitemap altijd klopt met waar hij vandaan komt. Op het
 * echte domein is de vervanging een no-op.
 *
 * Belangrijk: de ETag van het bronbestand hoort NIET ongewijzigd terug, want de
 * body verschilt per host. Anders levert een revalidatie een 304 op en blijft er
 * een oude versie in de cache van de browser hangen.
 */
const CANONICAL = 'https://uitvaartpolis-online.com';
const SITEMAP = /^\/sitemap[\w.-]*\.xml$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!SITEMAP.test(url.pathname)) return env.ASSETS.fetch(request);

    // Vraag het bronbestand zonder conditionele headers op, zodat we altijd een
    // volledige body krijgen om te herschrijven (nooit een kaal 304'tje).
    const assetRequest = new Request(request.url, { method: 'GET', headers: {} });
    const response = await env.ASSETS.fetch(assetRequest);
    if (!response.ok) return response;

    const body = (await response.text()).split(CANONICAL).join(url.origin);

    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('last-modified');
    headers.set('content-type', 'application/xml; charset=utf-8');
    headers.set('cache-control', 'public, max-age=0, must-revalidate');

    // ETag host-specifiek maken: dezelfde bron, andere host = andere body.
    const source = response.headers.get('etag');
    if (source) headers.set('etag', `"${url.host}-${source.replace(/^W\/|"/g, '')}"`);
    else headers.delete('etag');

    return new Response(body, { status: 200, headers });
  },
};
