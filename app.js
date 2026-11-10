
addEventListener('error', e => {
  const m = document.querySelector('#app');
  if (m) m.innerHTML = '<p class="err">Error: ' + e.message + ' (' + String(e.filename || '').split('/').pop() + ':' + e.lineno + ')</p>';
});

const $ = s => document.querySelector(s), app = $('#app');

const store = {
  get: (k, d) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? d }
    catch { return d }
  },
  set: (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)) }
    catch { }
  }
};

const esc = s => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

let cap = 0, timer, D = null;
let favs = store.get('favs', []);
let filtro = { q: '', tipo: 'todos', solo: false };

const ALTAR = `<svg class="altar" viewBox="0 0 320 320" role="img" aria-label="Ilustración de un altar de Hanal Pixán con arco, flores de cempasúchil, velas y mucbipollo">
<path d="M40 310V120a120 120 0 0 1 240 0V310" fill="none" stroke="#ffa51f" stroke-width="8"/>
<use href="#flor" x="265" y="105" width="30" height="30"/>
<use href="#flor" x="256" y="59" width="30" height="30"/>
<use href="#flor" x="230" y="20" width="30" height="30"/>
<use href="#flor" x="191" y="-6" width="30" height="30"/>
<use href="#flor" x="145" y="-15" width="30" height="30"/>
<use href="#flor" x="99" y="-6" width="30" height="30"/>
<use href="#flor" x="60" y="20" width="30" height="30"/>
<use href="#flor" x="34" y="59" width="30" height="30"/>
<use href="#flor" x="25" y="105" width="30" height="30"/>
<use href="#flor" x="25" y="145" width="30" height="30"/>
<use href="#flor" x="265" y="145" width="30" height="30"/>
<use href="#flor" x="25" y="190" width="30" height="30"/>
<use href="#flor" x="265" y="190" width="30" height="30"/>
<use href="#flor" x="25" y="235" width="30" height="30"/>
<use href="#flor" x="265" y="235" width="30" height="30"/>
<use href="#flor" x="25" y="280" width="30" height="30"/>
<use href="#flor" x="265" y="280" width="30" height="30"/>
<rect x="55" y="255" width="210" height="55" fill="#3b1b66"/>
<rect x="82" y="205" width="156" height="50" fill="#4a2480"/>
<rect x="108" y="160" width="104" height="45" fill="#5b2c99"/>
<path d="M55 266h210M82 216h156M108 171h104" stroke="#e0457b" stroke-width="4" stroke-dasharray="8 5"/>
<ellipse cx="160" cy="198" rx="30" ry="7" fill="#3f8f4f"/>
<ellipse cx="160" cy="193" rx="22" ry="9" fill="#8a4b1f"/>
<use href="#flor" x="88" y="225" width="24" height="24"/>
<use href="#flor" x="122" y="225" width="24" height="24"/>
<use href="#flor" x="176" y="225" width="24" height="24"/>
<use href="#flor" x="208" y="225" width="24" height="24"/>
<use href="#flor" x="62" y="277" width="24" height="24"/>
<use href="#flor" x="104" y="277" width="24" height="24"/>
<use href="#flor" x="200" y="277" width="24" height="24"/>
<use href="#flor" x="236" y="277" width="24" height="24"/>
<use href="#vela" x="120" y="120" width="14" height="42"/>
<use href="#vela" x="186" y="120" width="14" height="42"/>
<use href="#vela" x="96" y="168" width="14" height="42"/>
<use href="#vela" x="210" y="168" width="14" height="42"/>
<use href="#vela" x="70" y="218" width="14" height="42"/>
<use href="#vela" x="236" y="218" width="14" height="42"/>
</svg>`;

const GUIR = `<div class="guirnalda" aria-hidden="true">
<svg viewBox="0 0 100 100"><use href="#flor"/></svg>
<svg viewBox="0 0 100 100"><use href="#flor"/></svg>
<svg viewBox="0 0 100 100"><use href="#flor"/></svg>
<svg viewBox="0 0 100 100"><use href="#flor"/></svg>
<svg viewBox="0 0 100 100"><use href="#flor"/></svg>
<svg viewBox="0 0 100 100"><use href="#flor"/></svg>
<svg viewBox="0 0 100 100"><use href="#flor"/></svg>
<svg viewBox="0 0 100 100"><use href="#flor"/></svg>
<svg viewBox="0 0 100 100"><use href="#flor"/></svg>
</div>`;

const V = {

  inicio: () => `
    <section class="hero">
      <div>
        <h1>${esc(D.game.titulo)}</h1>
        <p class="lema">${esc(D.game.lema)}</p>
        <p>${esc(D.game.sinopsis)}</p>
        <p>
          <a class="btn" href="#historia">Conoce la historia</a>
          <a class="btn sec" href="#niveles">Explora los niveles</a>
        </p>
      </div>
      ${ALTAR}
    </section>
    ${GUIR}
    <h2>Cómo se juega</h2>
    <div class="grid">
      ${D.mecanicas.map(m => `
        <article class="card">
          <h3>${esc(m.t)}</h3>
          <p>${esc(m.d)}</p>
        </article>
      `).join('')}
    </div>
    <p>${esc(D.game.genero)} · ${esc(D.game.plataformas)}</p>
  `,

  historia: () => {
    const H = D.historia;
    const tabs = ['Introducción', ...H.capitulos.map(c => c.tab)];
    const c = cap > 0 ? H.capitulos[cap - 1] : null;
    const ult = cap === tabs.length - 1;

    return `
      <h2>Historia</h2>
      <div class="tools" role="group" aria-label="Capítulos">
        ${tabs.map((t, i) => `
          <button class="${i === cap ? '' : 'sec'}"
            data-c="${i}" aria-pressed="${i === cap}">
            ${esc(t)}
          </button>
        `).join('')}
      </div>
      ${c
        ? `
          <h3>${esc(c.titulo)}</h3>
          ${c.texto.map(p => `<p>${esc(p)}</p>`).join('')}
          ${c.recompensa.length
            ? `<div class="recomp"><b>Recompensa</b>${c.recompensa.map(p => `<p>${esc(p)}</p>`).join('')}</div>`
            : ''}
        `
        : `
          <h3>Introducción</h3>
          ${H.intro.map(s => `<p class="verso">${s.map(esc).join('<br>')}</p>`).join('')}
        `
      }
      ${ult
        ? `<p class="final">${esc(H.final)}</p>`
        : `<p><button data-c="${cap + 1}">Siguiente</button></p>`
      }
    `;
  },

  personajes: () => {
    const l = D.personajes.filter(p =>
      (filtro.tipo === 'todos' || p.tipo === filtro.tipo) &&
      (!filtro.solo || favs.includes(p.id)) &&
      (p.n + p.d + p.rol).toLowerCase().includes(filtro.q.toLowerCase())
    );

    return `
      <h2>Personajes</h2>
      <div class="tools">
        <input id="q" type="search" placeholder="Buscar personaje"
          aria-label="Buscar personaje" value="${esc(filtro.q)}">

        <select id="tipo" aria-label="Filtrar por tipo">
          ${['todos', 'aliado', 'enemigo', 'neutral'].map(t => `
            <option value="${t}"${filtro.tipo === t ? ' selected' : ''}>
              ${t[0].toUpperCase() + t.slice(1)}
            </option>
          `).join('')}
        </select>

        <button class="sec" id="solo" aria-pressed="${filtro.solo}">
          ${filtro.solo ? 'Ver todos' : 'Solo favoritos'}
        </button>
      </div>

      <div class="grid">
        ${l.length
          ? l.map(p => `
            <article class="card ${p.tipo}">
              <button class="fav" data-id="${p.id}"
                aria-pressed="${favs.includes(p.id)}"
                aria-label="Favorito: ${esc(p.n)}">
                ${favs.includes(p.id) ? '★' : '☆'}
              </button>

              ${p.img
                ? `<img class="retrato" src="${esc(p.img)}"
                    alt="Modelo 3D de ${esc(p.n)}" loading="lazy">`
                : ''
              }

              <h3>${esc(p.n)}</h3>
              <p class="rol">${esc(p.rol)}</p>
              <p>${esc(p.d)}</p>
            </article>
          `).join('')
          : '<p>No hay personajes con ese filtro. Cambia la búsqueda o quita los filtros.</p>'
        }
      </div>
    `;
  },

  niveles: () => `
    <h2>Niveles</h2>
    <div class="grid niv">
      ${D.niveles.map((n, i) => `
        <article class="card nivel">
          <img class="img-nivel" src="${esc(n.img)}"
            alt="Escenario: ${esc(n.t)}" loading="lazy">

          <h3>${esc(n.n)}: ${esc(n.t)}</h3>
          <p>${esc(n.d)}</p>
          <p class="recompensa">Recompensa: ${esc(n.r)}</p>

          <audio controls preload="none" src="${esc(n.audio)}"
            aria-label="Audio de ${esc(n.t)}"></audio>

          <p>
            <button class="sec dato" data-i="${i}">
              Dato curioso
            </button>
          </p>

          <div class="wiki" id="w${i}" role="status"></div>
        </article>
      `).join('')}
    </div>
  `,

  evento: () => {
    const e = D.evento;
    const f = new Date(e.fecha);

    // Búsqueda de Google Maps usando el nombre y la dirección completa.
    const direccionCompleta = `${e.lugar}, ${e.direccion}`;
    const mapaQuery = encodeURIComponent(direccionCompleta);

    return `
      <h2>${esc(e.nombre)}</h2>

      <p>${esc(e.desc)}</p>

      <div class="grid">

        <article class="card">
          <h3>Fecha</h3>
          <p>${f.toLocaleDateString('es-MX', {
            dateStyle: 'full'
          })}</p>
        </article>

        <article class="card">
          <h3>Hora</h3>
          <p>${f.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </article>

        <article class="card">
          <h3>Lugar</h3>
          <p>
            ${esc(e.lugar)}
            <br>
            ${esc(e.direccion)}
          </p>
        </article>

      </div>

      <h3>Ubicación de la Universidad Tecnológica de Cancún</h3>

      <p>
        <strong>${esc(e.lugar)}</strong>
        <br>
        ${esc(e.direccion)}
      </p>

      <iframe
        class="mapa"
        title="Mapa de Google Maps de la Universidad Tecnológica de Cancún"
        loading="lazy"
        allowfullscreen
        referrerpolicy="no-referrer-when-downgrade"
        src="https://www.google.com/maps?q=${mapaQuery}&output=embed">
      </iframe>

      <p>
        <a class="btn sec"
          target="_blank"
          rel="noopener"
          href="https://www.google.com/maps/search/?api=1&query=${mapaQuery}">
          Ver ubicación y dirección en Google Maps
        </a>
      </p>

      <h3>Faltan</h3>
      <div class="tiempo" id="cuenta"></div>
    `;
  }

};

async function wiki(i) {
  const n = D.niveles[i];
  const box = $('#w' + i);
  const k = 'wiki-' + n.wiki;

  box.textContent = 'Consultando Wikipedia…';

  try {
    const r = await fetch(
      `https://${D.wiki_idioma}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(n.wiki)}`
    );

    if (!r.ok) throw 0;

    const j = await r.json();

    store.set(k, { t: j.title, e: j.extract });
    pinta(box, j.title, j.extract, false);

  } catch {
    const g = store.get(k, null);

    g
      ? pinta(box, g.t, g.e, true)
      : (
        box.className = 'wiki err',
        box.textContent = 'No se pudo cargar el dato. Conéctate a internet e inténtalo de nuevo.'
      );
  }
}

function pinta(box, t, e, off) {
  box.className = 'wiki msg';

  box.innerHTML = `
    <b>${esc(t)}</b>
    <br>
    ${esc(e)}
    <br>
    <small>Fuente: Wikipedia${off ? ' (guardado de tu última consulta)' : ''}</small>
  `;
}

function ruta() {
  clearInterval(timer);

  const k = (location.hash || '#inicio').slice(1);
  const v = V[k] ? k : 'inicio';

  app.innerHTML = V[v]();

  document.querySelectorAll('#nav a').forEach(a =>
    a.hash === '#' + v
      ? a.setAttribute('aria-current', 'page')
      : a.removeAttribute('aria-current')
  );

  document.title =
    (v === 'inicio' ? '' : v[0].toUpperCase() + v.slice(1) + ' · ')
    + D.game.titulo;

  enlaza(v);
  window.scrollTo(0, 0);
}

function cuenta() {
  const el = $('#cuenta');
  const t = new Date(D.evento.fecha);

  const p = () => {
    const d = t - Date.now();

    if (d <= 0) {
      el.innerHTML = '<p>El evento ya comenzó o terminó.</p>';
      clearInterval(timer);
      return;
    }

    let r = d;

    el.innerHTML = [
      ['días', 864e5],
      ['horas', 36e5],
      ['min', 6e4],
      ['seg', 1e3]
    ].map(([n, m]) => {
      const v = Math.floor(r / m);
      r -= v * m;

      return `<div><b>${v}</b>${n}</div>`;
    }).join('');
  };

  p();
  timer = setInterval(p, 1000);
}

function enlaza(v) {

  if (v === 'historia') {
    app.querySelectorAll('[data-c]').forEach(b =>
      b.onclick = () => {
        cap = +b.dataset.c;
        app.innerHTML = V.historia();
        enlaza('historia');
        window.scrollTo(0, 0);
      }
    );
  }

  if (v === 'evento') {
    cuenta();
  }

  if (v === 'personajes') {

    const re = (foco) => {
      app.innerHTML = V.personajes();
      enlaza('personajes');

      if (foco) {
        const q = $('#q');
        q.focus();
        q.setSelectionRange(q.value.length, q.value.length);
      }
    };

    $('#q').oninput = e => {
      filtro.q = e.target.value;
      re(true);
    };

    $('#tipo').onchange = e => {
      filtro.tipo = e.target.value;
      re();
    };

    $('#solo').onclick = () => {
      filtro.solo = !filtro.solo;
      re();
    };

    app.querySelectorAll('.fav').forEach(b =>
      b.onclick = () => {
        const i = b.dataset.id;

        favs = favs.includes(i)
          ? favs.filter(x => x !== i)
          : [...favs, i];

        store.set('favs', favs);
        re();
      }
    );
  }

  if (v === 'niveles') {

    const as = [...app.querySelectorAll('audio')];

    as.forEach(a =>
      a.onplay = () =>
        as.forEach(o => o !== a && o.pause())
    );

    app.querySelectorAll('.dato').forEach(b =>
      b.onclick = () => wiki(+b.dataset.i)
    );
  }
}

(async () => {

  try {
    D = await (await fetch('data.json')).json();

  } catch {
    app.innerHTML = `
      <p class="err">
        No se pudo cargar el contenido.
        Conéctate a internet e inténtalo de nuevo.
      </p>
    `;
    return;
  }

  addEventListener('hashchange', ruta);
  ruta();

  const est = $('#estado');

  const on = () => est.hidden = navigator.onLine;

  addEventListener('online', on);
  addEventListener('offline', on);

  on();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  let dp;

  addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    dp = e;
    $('#instalar').hidden = false;
  });

  $('#instalar').onclick = async () => {
    if (!dp) return;

    dp.prompt();
    await dp.userChoice;

    dp = null;
    $('#instalar').hidden = true;
  };

})();
