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

  var payeeSaveTimer = null;
  var payeeSnapshot = "";

  function showErr(msg) {
    errEl.textContent = msg;
    errEl.hidden = !msg;
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
  });

  newVpa.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      btnAdd.click();
    }
  });

  loadPayeeField();
  renderAccounts();
})();
