const V = 'saatan-v13', SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'data.json', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'img/nivel1.svg', 'img/nivel2.svg', 'img/nivel3.svg', 'img/nivel4.svg', 'audio/nivel1.wav', 'audio/nivel2.wav', 'audio/nivel3.wav', 'audio/nivel4.wav'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting() });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x))))); self.clients.claim() });
self.addEventListener('fetch', e => {
    const r = e.request; if (r.method !== 'GET') return;
    const u = new URL(r.url); if (u.origin !== location.origin) return;
    if (u.pathname.endsWith('data.json')) { e.respondWith(fetch(r).then(x => { const c = x.clone(); caches.open(V).then(h => h.put(r, c)); return x }).catch(() => caches.match(r))); return }
    if (r.headers.has('range')) { e.respondWith(caches.match(u.pathname.slice(1) || 'index.html').then(h => h ? h.arrayBuffer().then(b => { const m = /bytes=(\d+)-(\d*)/.exec(r.headers.get('range')), s = +m[1], en = m[2] ? +m[2] : b.byteLength - 1; return new Response(b.slice(s, en + 1), { status: 206, headers: { 'Content-Type': h.headers.get('Content-Type') || 'audio/wav', 'Content-Range': `bytes ${s}-${en}/${b.byteLength}` } }) }) : fetch(r))); return }
    e.respondWith(caches.match(r).then(h => h || fetch(r).then(x => { const c = x.clone(); caches.open(V).then(k => k.put(r, c)); return x })).catch(() => caches.match('index.html')));
});
