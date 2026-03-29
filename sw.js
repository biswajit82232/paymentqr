/* Service worker — offline-first; bump CACHE after each deploy */
var CACHE = "bph-pwa-v5";

/* Absolute URLs so precache works on GitHub Pages (e.g. /your-repo/) */
var ROOT = new URL("./", self.location.href).href;
function asset(name) {
  return new URL(name, ROOT).href;
}

var ASSETS = [
  asset("index.html"),
  asset("qr.html"),
  asset("settings.html"),
  asset("styles.css"),
  asset("common.js"),
  asset("app.js"),
  asset("qr-page.js"),
  asset("settings.js"),
  asset("qrcodejs.min.js"),
  asset("pwa.js"),
  asset("manifest.webmanifest"),
  asset("icons/icon-192.png"),
  asset("icons/icon-512.png"),
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return Promise.all(
          ASSETS.map(function (url) {
            return cache.add(url).catch(function () {});
          })
        );
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key !== CACHE) return caches.delete(key);
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

function offlineHtmlPage(reqUrl) {
  try {
    var path = new URL(reqUrl).pathname.replace(/\/+$/, "");
    var leaf = path.split("/").pop() || "";
    if (leaf === "qr.html") return caches.match(asset("qr.html"));
    if (leaf === "settings.html") return caches.match(asset("settings.html"));
  } catch (e) {}
  return caches.match(asset("index.html"));
}

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  var reqUrl = event.request.url;
  if (reqUrl.indexOf(self.location.origin) !== 0) return;

  var accept = event.request.headers.get("accept") || "";
  var isNavigate =
    event.request.mode === "navigate" || accept.indexOf("text/html") !== -1;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;

      return fetch(event.request)
        .then(function (res) {
          if (res && res.status === 200 && res.type === "basic") {
            var clone = res.clone();
            caches.open(CACHE).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return res;
        })
        .catch(function () {
          if (isNavigate) {
            return offlineHtmlPage(reqUrl).then(function (page) {
              return page || caches.match(asset("index.html"));
            });
          }
          return caches.match(event.request);
        });
    })
  );
});
