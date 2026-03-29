(function () {
  if (!("serviceWorker" in navigator)) return;

  var okOrigin =
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]";

  if (!okOrigin) return;

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(function () {});
  });
})();
