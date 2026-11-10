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

/* ---------- Conexión con la Api ---------- */

// La PWA (local o publicada) siempre usa la Api en la nube.
const API = 'https://kaxtik-api.runasp.net';

const api = async path => {
  const r = await fetch(API + path, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(r.status);
  return r.json();
};

// Mientras la Api no tenga un campo de tipo, se deduce del rol.
const tipoDe = rol => /jefe|antagonista|enemigo/i.test(rol) ? 'enemigo' : 'aliado';

// Convierte los datos de la Api al formato que usan las vistas.
function aplicarApi(chars, levels) {
  if (chars.length) {
    D.personajes = chars.map(c => ({
      id: String(c.id),
      n: c.name,
      rol: c.role,
      tipo: tipoDe(c.role),
      d: c.description,
      img: c.imageUrl ? API + c.imageUrl : null
    }));
  }

  if (levels.length) {
    // Recompensa y Wikipedia aún vienen de data.json (por número de nivel).
    const locales = D.niveles;
    D.niveles = levels.map(l => {
      const extra = locales[l.number] || {};
      return {
        n: l.number === 0 ? 'Tutorial' : `Nivel ${l.number}`,
        t: l.name,
        d: l.story,
        a: l.atmosphere,
        img: l.imageUrl ? API + l.imageUrl : extra.img,
        r: extra.r || '',
        wiki: extra.wiki || 'Día_de_Muertos'
      };
    });
  }
}

// Si la Api no responde, usa lo último guardado; si no hay nada, se queda con data.json.
async function cargarApi() {
  try {
    const [chars, levels] = await Promise.all([api('/api/characters'), api('/api/levels')]);
    store.set('api', { chars, levels });
    aplicarApi(chars, levels);
  } catch {
    const g = store.get('api', null);
    if (g) aplicarApi(g.chars, g.levels);
  }
}

/* ---------- Ilustraciones ---------- */

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

// Íconos de bloques (estilo voxel) para las mecánicas.
const ICONOS = [
  // Hierba alta: sigilo
  '<rect x="3" y="11" width="2" height="10"/><rect x="7" y="6" width="2" height="15"/><rect x="11" y="9" width="2" height="12"/><rect x="15" y="5" width="2" height="16"/><rect x="19" y="10" width="2" height="11"/>',
  // Piedra lanzada: distracción
  '<path d="M3 18C6 6 14 4 19 10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/><rect x="16" y="14" width="6" height="5"/><rect x="17" y="13" width="4" height="1"/>',
  // Columna: usar el entorno
  '<rect x="5" y="3" width="14" height="3"/><rect x="7" y="6" width="3" height="13"/><rect x="14" y="6" width="3" height="13"/><rect x="4" y="19" width="16" height="2"/>',
  // Altar escalonado: ofrenda
  '<rect x="3" y="17" width="18" height="4"/><rect x="6" y="13" width="12" height="4"/><rect x="9" y="9" width="6" height="4"/><rect x="11" y="4" width="2" height="5"/>'
];

/* ---------- Vistas ---------- */

const V = {

  inicio: () => {
    const protas = D.personajes.filter(p => p.tipo === 'aliado').slice(0, 2);
    const e = D.evento;
    const dias = Math.ceil((new Date(e.fecha) - Date.now()) / 864e5);

    return `
      <section class="hero">
        <div class="hero-texto">
          <h1>${esc(D.game.titulo)}</h1>
          <p class="lema">${esc(D.game.lema)}</p>
          <p>${esc(D.game.sinopsis)}</p>
          <ul class="chips">
            <li>${esc(D.game.genero)}</li>
            <li>${esc(D.game.plataformas)}</li>
          </ul>
          <p class="acciones">
            <a class="btn" href="#historia">Conoce la historia</a>
            <a class="btn sec" href="#niveles">Explora los niveles</a>
          </p>
        </div>
        <div class="hero-altar">${ALTAR}</div>
      </section>

      ${GUIR}

      <section>
        <h2>Cómo se juega</h2>
        <div class="grid mec">
          ${D.mecanicas.map((m, i) => `
            <article class="card mecanica">
              <svg class="icono" viewBox="0 0 24 24" aria-hidden="true">${ICONOS[i % ICONOS.length]}</svg>
              <h3>${esc(m.t)}</h3>
              <p>${esc(m.d)}</p>
            </article>
          `).join('')}
        </div>
      </section>

      ${protas.length ? `
        <section>
          <h2>Los protagonistas</h2>
          <div class="duo">
            ${protas.map(p => `
              <a class="duo-item" href="#personajes">
                <span class="marco">
                  ${p.img ? `<img class="retrato" src="${esc(p.img)}" alt="Modelo 3D de ${esc(p.n)}" loading="lazy">` : ''}
                </span>
                <span>
                  <b>${esc(p.n)}</b>
                  <small>${esc(p.rol)}</small>
                </span>
              </a>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <section>
        <h2>Los mundos</h2>
        <div class="mundos">
          ${D.niveles.map(n => `
            <a class="mundo" href="#niveles">
              ${n.img ? `<img src="${esc(n.img)}" alt="Escenario: ${esc(n.t)}" loading="lazy">` : ''}
              <span class="etiqueta">${esc(n.n)}</span>
              <b>${esc(n.t)}</b>
            </a>
          `).join('')}
        </div>
      </section>

      ${dias > 0 ? `
        <a class="aviso-evento" href="#evento">
          <span class="num">${dias}</span>
          <span>
            <b>${dias === 1 ? 'día' : 'días'} para la ${esc(e.nombre)}</b>
            <small>Consulta la fecha, el lugar y el mapa</small>
          </span>
        </a>
      ` : ''}
    `;
  },

  historia: () => {
    const H = D.historia;
    const tabs = ['Introducción', ...H.capitulos.map(c => c.tab)];
    const c = cap > 0 ? H.capitulos[cap - 1] : null;
    const ult = cap === tabs.length - 1;
    const nivel = c && D.niveles.find(n => n.t.toLowerCase().includes(c.tab.toLowerCase()));

    return `
      <h2>Historia</h2>

      <ol class="camino" aria-label="Capítulos">
        ${tabs.map((t, i) => `
          <li>
            <button class="paso${i === cap ? ' actual' : ''}${i < cap ? ' leido' : ''}"
              data-c="${i}" aria-current="${i === cap ? 'step' : 'false'}">
              <span class="punto" aria-hidden="true"></span>
              ${esc(t)}
            </button>
          </li>
        `).join('')}
      </ol>

      <article class="capitulo">
        ${c
        ? `
            ${nivel && nivel.img
          ? `<figure class="portada-cap">
                  <img src="${esc(nivel.img)}" alt="Escenario: ${esc(nivel.t)}">
                  <span class="etiqueta">${esc(nivel.n)}</span>
                </figure>`
          : ''
        }
            <h3>${esc(c.titulo)}</h3>
            <div class="relato">
              ${c.texto.map(p => `<p>${esc(p)}</p>`).join('')}
            </div>
            ${c.recompensa.length
          ? `<aside class="recomp">
                  <svg class="icono" viewBox="0 0 24 24" aria-hidden="true">${ICONOS[3]}</svg>
                  <div>
                    <b>Recompensa</b>
                    ${c.recompensa.map(p => `<p>${esc(p)}</p>`).join('')}
                  </div>
                </aside>`
          : ''
        }
          `
        : `
            <h3>Introducción</h3>
            <div class="calavera-lit">
              ${H.intro.map(s => `<p class="verso">${s.map(esc).join('<br>')}</p>`).join('')}
            </div>
          `
      }
      </article>

      ${ult
        ? `<blockquote class="final">
            <svg width="20" height="60" viewBox="0 0 20 60" aria-hidden="true"><use href="#vela"/></svg>
            <p>${esc(H.final)}</p>
          </blockquote>`
        : ''
      }

      <div class="pasos">
        ${cap > 0 ? `<button class="sec" data-c="${cap - 1}">Anterior</button>` : '<span></span>'}
        ${!ult ? `<button data-c="${cap + 1}">Siguiente: ${esc(tabs[cap + 1])}</button>` : ''}
      </div>
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

      <div class="grid pj">
        ${l.length
        ? l.map(p => `
            <article class="card personaje ${p.tipo}">
              <div class="marco">
                ${p.img
            ? `<img class="retrato" src="${esc(p.img)}"
                      alt="Modelo 3D de ${esc(p.n)}" loading="lazy">`
            : ''
          }
              </div>

              <div class="info">
                <h3>${esc(p.n)}</h3>
                <p class="rol">${esc(p.rol)}</p>
                <p>${esc(p.d)}</p>
              </div>

              <button class="fav" data-id="${p.id}"
                aria-pressed="${favs.includes(p.id)}"
                aria-label="Favorito: ${esc(p.n)}">
                ${favs.includes(p.id) ? '★' : '☆'}
              </button>
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
          <div class="marco-nivel">
            ${n.img
      ? `<img class="img-nivel" src="${esc(n.img)}"
                  alt="Escenario: ${esc(n.t)}" loading="lazy">`
      : ''
    }
            <span class="etiqueta">${esc(n.n)}</span>
          </div>

          <div class="info">
            <h3>${esc(n.t)}</h3>
            <p>${esc(n.a || n.d)}</p>

            ${n.a
      ? `<details>
                  <summary>Leer la historia</summary>
                  <p>${esc(n.d)}</p>
                </details>`
      : ''
    }

            ${n.r ? `<p class="recompensa">Recompensa: ${esc(n.r)}</p>` : ''}

            <p>
              <button class="sec dato" data-i="${i}">
                Dato curioso
              </button>
            </p>

            <div class="wiki" id="w${i}" role="status"></div>
          </div>
        </article>
      `).join('')}
    </div>
  `,

  evento: () => {
    const e = D.evento;
    const f = new Date(e.fecha);
    const fin = e.fin ? new Date(e.fin) : null;
    const hora = x => x.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

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
          <h3>Horario</h3>
          <p>
            Inicio: ${hora(f)}
            ${fin ? `<br>Cierre: ${hora(fin)}` : ''}
          </p>
        </article>

        <article class="card">
          <h3>Lugar</h3>
          <p>
            ${esc(e.lugar)}
            ${e.edificio ? `<br><strong>${esc(e.edificio)}</strong>` : ''}
            <br>
            ${esc(e.direccion)}
          </p>
        </article>

      </div>

      <h3>Ubicación de la Universidad Tecnológica de Cancún</h3>

      <p>
        <strong>${esc(e.lugar)}${e.edificio ? `, ${esc(e.edificio)}` : ''}</strong>
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

/* ---------- Wikipedia ---------- */

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

/* ---------- Navegación ---------- */

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
    app.querySelectorAll('.dato').forEach(b =>
      b.onclick = () => wiki(+b.dataset.i)
    );
  }
}

/* ---------- Arranque ---------- */

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

  // Personajes y niveles desde la Api (con respaldo si no responde).
  await cargarApi();

  addEventListener('hashchange', ruta);
  ruta();

  // Menú hamburguesa (solo visible en pantallas pequeñas)
  const cab = $('.top'), menuBtn = $('#menuBtn');

  const menu = abierto => {
    cab.classList.toggle('abierto', abierto);
    menuBtn.setAttribute('aria-expanded', abierto);
    menuBtn.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  };

  menuBtn.onclick = () => menu(!cab.classList.contains('abierto'));
  $('#nav').addEventListener('click', e => { if (e.target.closest('a')) menu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') menu(false); });

  const est = $('#estado');

  const on = () => est.hidden = navigator.onLine;

  addEventListener('online', on);
  addEventListener('offline', on);

  on();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
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