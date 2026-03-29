(function () {
  var B = window.BPH;
  if (!B) return;

  var accountsEl = document.getElementById("accounts");
  var newLabel = document.getElementById("newLabel");
  var newVpa = document.getElementById("newVpa");
  var btnAdd = document.getElementById("btnAdd");
  var errEl = document.getElementById("err");
  var payeeName = document.getElementById("payeeName");
  var payeeSaved = document.getElementById("payeeSaved");
  var btnExport = document.getElementById("btnExport");
  var importFile = document.getElementById("importFile");
  var offlineBar = document.getElementById("offlineBar");

  var payeeSaveTimer = null;
  var payeeSnapshot = "";

  function showErr(msg) {
    errEl.textContent = msg;
    errEl.hidden = !msg;
  }

  function syncOfflineBar() {
    if (!offlineBar) return;
    offlineBar.hidden = navigator.onLine;
  }

  function flashSaved() {
    payeeSaved.hidden = false;
    clearTimeout(payeeSaveTimer);
    payeeSaveTimer = setTimeout(function () {
      payeeSaved.hidden = true;
    }, 1600);
  }

  function loadPayeeField() {
    payeeSnapshot = B.loadPayeeName();
    payeeName.value = payeeSnapshot;
  }

  function savePayeeFromField() {
    var next = B.savePayeeName(payeeName.value);
    if (next === payeeSnapshot) return;
    payeeSnapshot = next;
    flashSaved();
  }

  payeeName.addEventListener("blur", savePayeeFromField);
  payeeName.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      payeeName.blur();
    }
  });

  function renderAccounts() {
    var list = B.loadAccounts();
    accountsEl.innerHTML = "";
    if (!list.length) {
      var empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No accounts yet. Add a label and UPI ID below.";
      accountsEl.appendChild(empty);
      return;
    }
    list.forEach(function (acc, i) {
      var row = document.createElement("div");
      row.className = "acc-row";
      row.innerHTML =
        '<div class="acc-grid">' +
        '<div class="acc-cell"><span class="lbl">Label</span><span class="acc-value">' +
        B.escapeHtml(acc.label) +
        "</span></div>" +
        '<div class="acc-cell"><span class="lbl">UPI ID</span><span class="acc-value">' +
        B.escapeHtml(acc.vpa) +
        "</span></div></div>" +
        '<button type="button" class="btn btn-remove" data-i="' +
        i +
        '">Remove</button>';
      accountsEl.appendChild(row);
    });
    accountsEl.querySelectorAll("button[data-i]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.getAttribute("data-i"), 10);
        var next = B.loadAccounts().filter(function (_, j) {
          return j !== idx;
        });
        B.saveAccounts(next);
        renderAccounts();
      });
    });
  }

  btnAdd.addEventListener("click", function () {
    showErr("");
    var label = newLabel.value.trim() || "Account";
    var vpa = newVpa.value.trim().toLowerCase();
    if (!B.isVpa(vpa)) {
      showErr("Enter a valid UPI ID (e.g. name@okaxis).");
      return;
    }
    var list = B.loadAccounts();
    if (list.some(function (a) { return a.vpa === vpa; })) {
      showErr("That UPI ID is already saved.");
      return;
    }
    list.push({ label: label, vpa: vpa });
    B.saveAccounts(list);
    newVpa.value = "";
    newLabel.value = "";
    newLabel.focus();
    renderAccounts();
    B.showToast("Account added");
  });

  newVpa.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      btnAdd.click();
    }
  });

  if (btnExport) {
    btnExport.addEventListener("click", function () {
      var payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        app: "Payment QR",
        payeeName: B.loadPayeeName(),
        accounts: B.loadAccounts(),
      };
      var blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "payment-qr-backup.json";
      a.click();
      URL.revokeObjectURL(a.href);
      B.showToast("Backup downloaded");
    });
  }

  if (importFile) {
    importFile.addEventListener("change", function () {
      var f = importFile.files && importFile.files[0];
      importFile.value = "";
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          if (!data || !Array.isArray(data.accounts)) {
            showErr("Invalid backup file.");
            return;
          }
          if (
            !confirm(
              "Replace all saved UPI IDs and payee name with this backup?"
            )
          ) {
            return;
          }
          var seen = {};
          var cleaned = [];
          for (var i = 0; i < data.accounts.length; i++) {
            var a = data.accounts[i];
            if (!a || typeof a.vpa !== "string" || typeof a.label !== "string") {
              showErr("Backup contains invalid entries.");
              return;
            }
            var v = String(a.vpa).trim().toLowerCase();
            if (!B.isVpa(v)) {
              showErr("Backup contains an invalid UPI ID: " + v);
              return;
            }
            if (seen[v]) continue;
            seen[v] = true;
            cleaned.push({
              label: String(a.label).slice(0, 40),
              vpa: v,
            });
          }
          B.saveAccounts(cleaned);
          if (data.payeeName && String(data.payeeName).trim()) {
            B.savePayeeName(data.payeeName);
          }
          loadPayeeField();
          renderAccounts();
          showErr("");
          B.showToast("Backup restored");
        } catch (e) {
          showErr("Could not read backup file.");
        }
      };
      reader.readAsText(f);
    });
  }

  window.addEventListener("online", syncOfflineBar);
  window.addEventListener("offline", syncOfflineBar);

  loadPayeeField();
  renderAccounts();
  syncOfflineBar();
})();
