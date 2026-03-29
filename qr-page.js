(function () {
  var B = window.BPH;
  if (!B || typeof QRCode === "undefined") return;

  var data = B.readSessionQr();
  var mainBox = document.getElementById("qrViewMain");
  var qrHost = document.getElementById("qrHost");
  var qrMeta = document.getElementById("qrMeta");
  var qrBrandName = document.getElementById("qrBrandName");
  var btnDl = document.getElementById("btnDl");
  var btnShare = document.getElementById("btnShare");

  var TAGLINE = "UPI · Scan to pay";

  function sanitizeFilenamePart(s) {
    return String(s || "")
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40) || "payment-qr";
  }

  function downloadName(brandName, am) {
    var brand = sanitizeFilenamePart(brandName);
    var part = String(am).replace(/\./g, "-");
    return brand + "-inr-" + part + ".png";
  }

  function fitTitleFont(ctx, text, maxW, startPx, minPx) {
    var size = startPx;
    var family = 'system-ui, "Segoe UI", Roboto, sans-serif';
    for (; size >= minPx; size -= 1) {
      ctx.font = "600 " + size + "px " + family;
      if (ctx.measureText(text).width <= maxW) break;
    }
  }

  function buildBrandedPng(qrCanvas, brandName, amountLabel) {
    var W = 320;
    var headerH = 80;
    var amountH = 52;
    var qrPad = 16;
    var qrSize = qrCanvas.width;
    var bodyH = qrPad * 2 + qrSize;
    var H = headerH + amountH + bodyH;

    var dpr = Math.min(2, window.devicePixelRatio || 2);
    var out = document.createElement("canvas");
    out.width = Math.round(W * dpr);
    out.height = Math.round(H * dpr);
    var ctx = out.getContext("2d");
    if (!ctx) return null;

    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    var grd = ctx.createLinearGradient(0, 0, W, headerH);
    grd.addColorStop(0, "#1a1a1a");
    grd.addColorStop(1, "#2d2d2d");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, headerH);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    fitTitleFont(ctx, brandName, W - 32, 19, 13);
    ctx.fillText(brandName, W / 2, headerH / 2 - 10);

    ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
    ctx.font =
      '600 11px system-ui, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(TAGLINE, W / 2, headerH / 2 + 18);

    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, headerH, W, amountH);

    ctx.fillStyle = "#111111";
    ctx.font =
      '700 28px system-ui, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(amountLabel, W / 2, headerH + amountH / 2);

    var yBody = headerH + amountH;
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, yBody, W, bodyH);

    var qrX = (W - qrSize) / 2;
    var qrY = yBody + qrPad;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#e8e8ea";
    ctx.lineWidth = 1;
    var inset = 8;
    ctx.beginPath();
    var r = 8;
    var bx = qrX - inset;
    var by = qrY - inset;
    var bw = qrSize + inset * 2;
    var bh = qrSize + inset * 2;
    ctx.moveTo(bx + r, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
    ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
    ctx.arcTo(bx, by + bh, bx, by, r);
    ctx.arcTo(bx, by, bx + bw, by, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.drawImage(qrCanvas, qrX, qrY);

    return out;
  }

  function getBrandedComposite() {
    var qrCanvas = qrHost.querySelector("canvas");
    if (!qrCanvas) return null;
    var brandName = B.loadPayeeName();
    var amountLabel = data.amount ? "₹" + data.amount : "—";
    return buildBrandedPng(qrCanvas, brandName, amountLabel);
  }

  function syncShareVisibility() {
    if (!btnShare) return;
    btnShare.hidden = typeof navigator.share !== "function";
  }

  if (!data) {
    window.location.replace("index.html");
    return;
  }

  mainBox.hidden = false;
  qrBrandName.textContent = B.loadPayeeName();
  qrMeta.textContent = data.amount ? "₹" + data.amount : "—";

  new QRCode(qrHost, {
    text: data.uri,
    width: 256,
    height: 256,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M,
  });

  syncShareVisibility();

  btnDl.addEventListener("click", function () {
    var composite = getBrandedComposite();
    if (!composite) return;

    var brandName = B.loadPayeeName();
    var a = document.createElement("a");
    a.download = downloadName(brandName, data.amount || "upi");
    a.href = composite.toDataURL("image/png");
    a.click();
  });

  if (btnShare) {
    btnShare.addEventListener("click", function () {
      var composite = getBrandedComposite();
      if (!composite) return;

      var brandName = B.loadPayeeName();
      var amountLabel = data.amount ? "₹" + data.amount : "—";
      var fname = downloadName(brandName, data.amount || "upi");

      composite.toBlob(function (blob) {
        if (!blob) return;
        var file = new File([blob], fname, { type: "image/png" });
        try {
          if (navigator.canShare && !navigator.canShare({ files: [file] })) {
            alert("Your browser cannot share this image. Use Download PNG.");
            return;
          }
        } catch (e) {
          alert("Your browser cannot share this image. Use Download PNG.");
          return;
        }
        navigator
          .share({
            files: [file],
            title: "UPI payment QR",
            text: amountLabel + " — scan to pay with any UPI app",
          })
          .catch(function (err) {
            if (err && err.name === "AbortError") return;
            alert("Could not share. Try Download PNG.");
          });
      }, "image/png");
    });
  }
})();
