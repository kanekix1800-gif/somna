// Somna: service worker da versão web para celular (EXPO.md §8).
// GERADO por scripts/web-celular.mjs — não edite. Versão 2b773900ed53 (hash do build publicado).
(function servicoWorker(cfg) {
  'use strict';
  var CACHE = cfg.prefixo + cfg.versao;
  var BASE = new URL('./', self.location.href).href;
  var PAGINA = BASE;
  var INDICE = BASE + 'index.html';
  var PRECACHE = cfg.precache.map(function (u) {
    return new URL(u, BASE).href;
  });
  var ESTATICOS = cfg.estaticos.map(function (u) {
    return new URL(u, BASE).href;
  });
  function nada() {}

  self.addEventListener('install', function (evento) {
    evento.waitUntil(
      caches
        .open(CACHE)
        .then(function (cache) {
          return cache.addAll(
            PRECACHE.map(function (u) {
              return new Request(u, { cache: 'no-cache' });
            }),
          );
        })
        .then(function () {
          return self.skipWaiting();
        }),
    );
  });

  self.addEventListener('activate', function (evento) {
    evento.waitUntil(
      caches
        .keys()
        .then(function (nomes) {
          return Promise.all(
            nomes
              .filter(function (n) {
                return n.indexOf(cfg.prefixo) === 0 && n !== CACHE;
              })
              .map(function (n) {
                return caches.delete(n);
              }),
          );
        })
        .then(function () {
          return self.clients.claim();
        }),
    );
  });

  self.addEventListener('fetch', function (evento) {
    var req = evento.request;
    if (req.method !== 'GET') return;
    var url = new URL(req.url);
    var semBusca = url.origin + url.pathname;
    if (semBusca === PAGINA || semBusca === INDICE) evento.respondWith(pagina(evento));
    else if (ESTATICOS.indexOf(semBusca) !== -1) evento.respondWith(estatico(evento, semBusca));
    else if (url.hostname === 'fonts.googleapis.com') evento.respondWith(cssDeFonte(evento));
    else if (url.hostname === 'fonts.gstatic.com') evento.respondWith(arquivoDeFonte(evento));
  });

  function comPrazo(promessa, ms) {
    return new Promise(function (ok, falha) {
      var t = setTimeout(function () {
        falha(new Error('prazo'));
      }, ms);
      promessa.then(
        function (v) {
          clearTimeout(t);
          ok(v);
        },
        function (e) {
          clearTimeout(t);
          falha(e);
        },
      );
    });
  }
  /** Item do cache desta versão, ou null (também quando o Cache Storage falha, como em alguns modos privados). */
  function doCache(chave) {
    return caches
      .open(CACHE)
      .then(function (cache) {
        return cache.match(chave);
      })
      ['catch'](function () {
        return null;
      });
  }
  /** Cópia guardada da página: a desta versão ou, durante uma troca de versão, a de qualquer cache. */
  function copiaGuardada() {
    return doCache(PAGINA).then(function (salvo) {
      return (
        salvo ||
        caches.match(PAGINA)['catch'](function () {
          return null;
        })
      );
    });
  }
  /** Guarda uma cópia sem atrasar a resposta; falha de cache não atrapalha a página. */
  function guardar(evento, chave, r) {
    if (r.ok || r.type === 'opaque') {
      try {
        var copia = r.clone();
        evento.waitUntil(
          caches
            .open(CACHE)
            .then(function (cache) {
              return cache.put(chave, copia);
            })
            ['catch'](nada),
        );
      } catch (e) {
        /* sem cópia desta vez */
      }
    }
    return r;
  }

  function pagina(evento) {
    var req = evento.request;
    var rede = fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (r) {
      if (r.redirected) return { r: null, copia: null };
      return { r: r, copia: r.ok && r.type === 'basic' ? r.clone() : null };
    });
    // Registrado já (síncrono): a cópia é guardada mesmo quando a resposta sai do cache por causa do prazo
    evento.waitUntil(
      rede
        .then(function (x) {
          if (!x.copia) return undefined;
          return caches.open(CACHE).then(function (cache) {
            return cache.put(PAGINA, x.copia);
          });
        })
        ['catch'](nada),
    );
    var resposta = rede.then(function (x) {
      if (!x.r) return fetch(req);
      if (x.r.status >= 500) {
        return copiaGuardada().then(function (salvo) {
          return salvo || x.r;
        });
      }
      return x.r;
    });
    return comPrazo(resposta, cfg.prazoRedeMs)['catch'](function () {
      return copiaGuardada().then(function (salvo) {
        return salvo || resposta;
      });
    });
  }

  function estatico(evento, chave) {
    return doCache(chave).then(function (salvo) {
      if (salvo) return salvo;
      return fetch(evento.request).then(function (r) {
        return r.type === 'basic' ? guardar(evento, chave, r) : r;
      });
    });
  }

  function cssDeFonte(evento) {
    var req = evento.request;
    return fetch(req)
      .then(function (r) {
        return guardar(evento, req.url, r);
      })
      ['catch'](function () {
        return doCache(req.url).then(function (salvo) {
          return salvo || new Response('/* Somna sem internet: fonte do sistema */\n', { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
        });
      });
  }

  function arquivoDeFonte(evento) {
    var req = evento.request;
    return doCache(req.url).then(function (salvo) {
      if (salvo) return salvo;
      return fetch(req).then(function (r) {
        return guardar(evento, req.url, r);
      });
    });
  }
})({"versao":"2b773900ed53","prefixo":"somna-web-","precache":["./","manifest.webmanifest","icones/favicon-32.png","icones/icone-192.png","icones/apple-touch-icon.png"],"estaticos":["manifest.webmanifest","icones/icone-192.png","icones/icone-512.png","icones/icone-maskable-512.png","icones/apple-touch-icon.png","icones/favicon-32.png","previa.png"],"prazoRedeMs":4000});
