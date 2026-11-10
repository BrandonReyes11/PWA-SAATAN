const V = 'saatan-v23';

const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'data.json', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'img/gameplay_practica.png', 'img/gameplay_selva_nahual.png', 'img/gameplay_iglesia_diablo.png', 'img/personajes/iktan.png', 'img/personajes/abbi.png', 'img/personajes/nahual.png'];

// Servidores de la Api (local y en la nube).
const API_HOSTS = ['localhost:5095', 'kaxtik-api.runasp.net'];
const FUENTES = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting() });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x))))); self.clients.claim() });

const guardar = (r, x) => {
    if (x.ok || x.type === 'opaque') { const c = x.clone(); caches.open(V).then(h => h.put(r, c)); }
    return x;
};
// Primero la red (datos frescos); si no hay conexión, lo guardado.
const redPrimero = r => fetch(r).then(x => guardar(r, x)).catch(() => caches.match(r).then(h => h || Response.error()));
// Primero lo guardado (imágenes y fuentes); si no existe, la red.
const cachePrimero = r => caches.match(r).then(h => h || fetch(r).then(x => guardar(r, x))).catch(() => Response.error());

self.addEventListener('fetch', e => {
    const r = e.request; if (r.method !== 'GET') return;
    const u = new URL(r.url);

    if (API_HOSTS.includes(u.host)) {
        e.respondWith(u.pathname.startsWith('/api/') ? redPrimero(r) : cachePrimero(r));
        return;
    }
    if (FUENTES.includes(u.hostname)) { e.respondWith(cachePrimero(r)); return; }
    if (u.origin !== location.origin) return;

    if (u.pathname.endsWith('data.json')) { e.respondWith(redPrimero(r)); return; }
    e.respondWith(caches.match(r).then(h => h || fetch(r).then(x => guardar(r, x))).catch(() => caches.match('index.html').then(h => h || Response.error())));
});