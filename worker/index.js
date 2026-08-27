/**
 * De XML-sitemap bevat absolute URL's met het productiedomein. Zolang het domein
 * nog niet op deze Worker staat (of bij een preview op *.workers.dev) verwijst de
 * sitemap dan naar een host die hier niets serveert.
 *
 * Deze Worker herschrijft het domein in de sitemap naar de host waarop hij wordt
 * opgevraagd, zodat de sitemap altijd klopt met waar hij vandaan komt. Op het
 * echte domein is de vervanging een no-op.
 */
const CANONICAL = 'https://uitvaartpolis-online.com';
const SITEMAP = /^\/sitemap[\w.-]*\.xml$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);

    if (!SITEMAP.test(url.pathname) || !response.ok) return response;

    const body = (await response.text()).split(CANONICAL).join(url.origin);
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(body, { status: response.status, headers });
  },
};
