(function () {
  var B = window.BPH;
  if (!B) return;

  var qrForm = document.getElementById("qrForm");
  var selVpa = document.getElementById("selVpa");
  var amountEl = document.getElementById("amount");
  var txnNote = document.getElementById("txnNote");
  var errEl = document.getElementById("err");

  function showErr(msg) {
    errEl.textContent = msg;
    errEl.hidden = !msg;
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

  window.addEventListener("pageshow", fillSelect);
  fillSelect();
})();
