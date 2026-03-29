(function () {
  var B = (window.BPH = window.BPH || {});

  B.STORAGE_ACCOUNTS = "bph_upi_accounts_v1";
  B.STORAGE_PAYEE = "bph_payee_name_v1";
  B.STORAGE_LAST_FORM = "bph_last_form_v1";
  B.SESSION_QR_KEY = "bph_session_qr_v1";
  B.DEFAULT_PAYEE = "Biswajit Power Hub";

  B.saveLastForm = function (vpa, amount, note) {
    try {
      localStorage.setItem(
        B.STORAGE_LAST_FORM,
        JSON.stringify({
          vpa: vpa || "",
          amount: amount || "",
          note: note || "",
        })
      );
    } catch (e) {}
  };

  B.loadLastForm = function () {
    try {
      var raw = localStorage.getItem(B.STORAGE_LAST_FORM);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  B.showToast = function (message, duration) {
    var el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("toast--visible");
    clearTimeout(B._toastTimer);
    B._toastTimer = setTimeout(function () {
      el.classList.remove("toast--visible");
    }, duration || 2400);
  };

  B.storeSessionQr = function (payload) {
    try {
      sessionStorage.setItem(B.SESSION_QR_KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      return false;
    }
  };

  B.readSessionQr = function () {
    try {
      var raw = sessionStorage.getItem(B.SESSION_QR_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || typeof o.uri !== "string" || !o.uri) return null;
      return o;
    } catch (e) {
      return null;
    }
  };

  B.loadAccounts = function () {
    try {
      var raw = localStorage.getItem(B.STORAGE_ACCOUNTS);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  B.saveAccounts = function (list) {
    localStorage.setItem(B.STORAGE_ACCOUNTS, JSON.stringify(list));
  };

  B.loadPayeeName = function () {
    var s = localStorage.getItem(B.STORAGE_PAYEE);
    if (s && String(s).trim()) return String(s).trim();
    return B.DEFAULT_PAYEE;
  };

  B.savePayeeName = function (name) {
    var v = String(name || "").trim() || B.DEFAULT_PAYEE;
    localStorage.setItem(B.STORAGE_PAYEE, v);
    return v;
  };

  B.normalizeAmount = function (str) {
    var s = String(str || "").trim().replace(/,/g, "");
    if (!s) return null;
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
    var n = parseFloat(s, 10);
    if (!(n > 0) || n > 999999999) return null;
    return n.toFixed(2);
  };

  B.isVpa = function (s) {
    s = String(s || "").trim().toLowerCase();
    if (s.length < 5 || s.length > 99) return false;
    return /^[a-z0-9._-]+@[a-z0-9.-]+$/.test(s);
  };

  B.buildUpiUri = function (pa, pn, am, tn, tr) {
    var q = [
      "pa=" + encodeURIComponent(pa),
      "pn=" + encodeURIComponent(pn),
      "cu=INR",
      "am=" + am,
    ];
    if (tn) q.push("tn=" + encodeURIComponent(tn.slice(0, 80)));
    if (tr) q.push("tr=" + encodeURIComponent(tr.slice(0, 35)));
    return "upi://pay?" + q.join("&");
  };

  B.genTr = function () {
    return "BPH" + Date.now().toString(36).toUpperCase();
  };

  B.escapeHtml = function (s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  };
})();
