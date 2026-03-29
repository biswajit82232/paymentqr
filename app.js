(function () {
  var B = window.BPH;
  if (!B) return;

  var qrForm = document.getElementById("qrForm");
  var selVpa = document.getElementById("selVpa");
  var amountEl = document.getElementById("amount");
  var txnNote = document.getElementById("txnNote");
  var errEl = document.getElementById("err");
  var btnClear = document.getElementById("btnClear");
  var offlineBar = document.getElementById("offlineBar");

  function showErr(msg) {
    errEl.textContent = msg;
    errEl.hidden = !msg;
  }

  function syncOfflineBar() {
    if (!offlineBar) return;
    offlineBar.hidden = navigator.onLine;
  }

  function fillSelect() {
    var list = B.loadAccounts();
    var cur = selVpa.value;
    selVpa.innerHTML = "";
    if (!list.length) {
      var o = document.createElement("option");
      o.value = "";
      o.textContent = "No accounts yet";
      selVpa.appendChild(o);
      selVpa.disabled = true;
      return;
    }
    selVpa.disabled = false;
    list.forEach(function (acc) {
      var o = document.createElement("option");
      o.value = acc.vpa;
      o.textContent = acc.label;
      selVpa.appendChild(o);
    });
    if (cur && list.some(function (a) { return a.vpa === cur; })) {
      selVpa.value = cur;
    }
  }

  function applyLastForm() {
    var last = B.loadLastForm();
    if (!last) return;
    var list = B.loadAccounts();
    if (last.vpa && list.some(function (a) { return a.vpa === last.vpa; })) {
      selVpa.value = last.vpa;
    }
    if (last.amount && B.normalizeAmount(last.amount)) {
      amountEl.value = last.amount;
    }
    if (typeof last.note === "string") {
      txnNote.value = last.note;
    }
  }

  function goToQrPage() {
    showErr("");

    var list = B.loadAccounts();
    if (!list.length) {
      showErr("Add at least one UPI ID in Settings.");
      return;
    }
    var vpa = selVpa.value;
    if (!vpa || !B.isVpa(vpa)) {
      showErr("Select a valid payee UPI ID.");
      return;
    }
    var am = B.normalizeAmount(amountEl.value);
    if (!am) {
      showErr("Enter amount (e.g. 500 or 99.50, max 2 decimals).");
      amountEl.focus();
      return;
    }

    var pn = B.loadPayeeName();
    var tn = txnNote.value.trim();
    var tr = B.genTr();
    var uri = B.buildUpiUri(vpa, pn, am, tn, tr);

    B.saveLastForm(vpa, amountEl.value.trim(), tn);

    var ok = B.storeSessionQr({
      uri: uri,
      amount: am,
    });
    if (!ok) {
      showErr("Could not save QR data. Check that this browser allows storage, then try again.");
      return;
    }

    window.location.assign("qr.html");
  }

  qrForm.addEventListener("submit", function (e) {
    e.preventDefault();
    goToQrPage();
  });

  document.querySelectorAll(".quick-chip").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var v = btn.getAttribute("data-amt");
      if (v) {
        amountEl.value = v + ".00";
        showErr("");
        amountEl.focus();
      }
    });
  });

  if (btnClear) {
    btnClear.addEventListener("click", function () {
      amountEl.value = "";
      txnNote.value = "";
      showErr("");
      if (selVpa.options.length && !selVpa.disabled) {
        selVpa.selectedIndex = 0;
      }
      amountEl.focus();
    });
  }

  window.addEventListener("online", syncOfflineBar);
  window.addEventListener("offline", syncOfflineBar);

  window.addEventListener("pageshow", function () {
    fillSelect();
    applyLastForm();
    syncOfflineBar();
  });
  fillSelect();
  applyLastForm();
  syncOfflineBar();
})();
