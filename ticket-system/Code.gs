const TICKET_CONFIG = {
  eventName: "Training Exclusive AI untuk Bisnis",
  venue: "Aula Masjid Sejuta Pemuda",
  sheetName: "Tiket Peserta",
  qrService: "https://api.qrserver.com/v1/create-qr-code/"
};

function setupTicketSystem() {
  const spreadsheetId = "1XUQLxTFW9eQ4I0dZ_mOum-aTwkVICfgKLQGwTpdg7F0";
  const props = PropertiesService.getScriptProperties();
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(TICKET_CONFIG.sheetName);
  if (!sheet) {
    throw new Error("Tab 'Tiket Peserta' tidak ditemukan di spreadsheet tujuan. Tidak ada spreadsheet baru yang dibuat.");
  }

  const headers = [
    "Waktu daftar", "Kode tiket", "Nama", "Email", "WhatsApp", "Nama usaha",
    "Produk / bidang usaha", "Domisili", "Platform", "Status peserta", "Infaq kopi jamaah",
    "Pertanyaan", "Status tiket", "Status kehadiran", "Waktu check-in", "Status email", "Status WhatsApp"
  ];
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const currentHeaders = headerRange.getDisplayValues()[0];
  if (currentHeaders.every(value => !String(value).trim())) {
    headerRange.setValues([headers]);
    sheet.setFrozenRows(1);
    headerRange.setFontWeight("bold").setBackground("#102d4d").setFontColor("#ffffff");
  } else if (headers.some((value, index) => String(currentHeaders[index]).trim() !== value)) {
    throw new Error("Header tab 'Tiket Peserta' tidak cocok. Data tidak diubah.");
  }

  const checkinPin = props.getProperty("CHECKIN_PIN") ||
    String(Math.floor(100000 + Math.random() * 900000));
  props.setProperties({
    SPREADSHEET_ID: spreadsheetId,
    CHECKIN_PIN: checkinPin
  });

  Logger.log("SPREADSHEET_URL: " + spreadsheet.getUrl());
  Logger.log("CHECKIN_PIN: " + checkinPin + " (simpan dan bagikan hanya ke panitia)");
  Logger.log("Sistem memakai spreadsheet tujuan yang sudah diberikan; tidak membuat file baru.");
}
function authorizeTicketServices() {
  UrlFetchApp.fetch(TICKET_CONFIG.qrService + "?size=32x32&data=authorize");
  Logger.log("Izin layanan QR sudah aktif.");
}

function doGet() {
  return HtmlService.createHtmlOutput(checkinPage_())
    .setTitle("Check-in Peserta — Training Exclusive AI untuk Bisnis");
}

function doPost(e) {
  const data = (e && e.parameter) || {};
  const required = ["name", "phone", "product", "city", "platform", "participantType", "consent"];
  const missing = required.filter(key => !String(data[key] || "").trim());
  if (missing.length) return ticketPage_({ error: "Data wajib belum lengkap. Kembali ke formulir dan lengkapi semua kolom bertanda *." });

  const email = "";

  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) return ticketPage_({ error: "Sistem pendaftaran belum disiapkan panitia." });

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  let ticketId;
  try {
    ticketId = "AI-" + Utilities.getUuid().replace(/-/g, "").slice(0, 10).toUpperCase();
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(TICKET_CONFIG.sheetName);
    const values = [[
      new Date(), ticketId, safeCell_(data.name), email, normalizePhone_(data.phone),
      safeCell_(data.business), safeCell_(data.product), safeCell_(data.city),
      safeCell_(data.platform), safeCell_(data.participantType), safeCell_(data.infaq),
      safeCell_(data.question), "VALID", "BELUM HADIR", "", "MENUNGGU", "MENUNGGU"
    ]];
    sheet.appendRow(values[0]);
  } finally {
    lock.releaseLock();
  }

  const qrBlob = qrBlob_(ticketId);
  updateDeliveryStatus_(ticketId, "TIKET SIAP DIUNDUH", "TIDAK DIGUNAKAN");
  return ticketPage_({
    name: String(data.name), ticketId: ticketId,
    qrDataUrl: "data:image/png;base64," + Utilities.base64Encode(qrBlob.getBytes())
  });
}

function checkInTicket(ticketId, pin) {
  const props = PropertiesService.getScriptProperties();
  if (!pin || String(pin) !== props.getProperty("CHECKIN_PIN")) {
    return { ok: false, message: "PIN panitia salah." };
  }
  const code = String(ticketId || "").trim().toUpperCase();
  if (!/^AI-[A-F0-9]{10}$/.test(code)) return { ok: false, message: "QR tidak berisi kode tiket yang valid." };

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = SpreadsheetApp.openById(props.getProperty("SPREADSHEET_ID"))
      .getSheetByName(TICKET_CONFIG.sheetName);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { ok: false, message: "Belum ada tiket terdaftar." };
    const match = sheet.getRange(2, 2, lastRow - 1, 1)
      .createTextFinder(code).matchEntireCell(true).findNext();
    if (!match) return { ok: false, message: "Tiket tidak ditemukan." };

    const row = match.getRow();
    const attendance = sheet.getRange(row, 14).getValue();
    const name = sheet.getRange(row, 3).getValue();
    if (attendance === "HADIR") {
      return { ok: false, message: "Tiket ini sudah check-in sebelumnya.", name: name, ticketId: code };
    }
    sheet.getRange(row, 14, 1, 2).setValues([["HADIR", new Date()]]);
    return { ok: true, message: "Kehadiran berhasil dicatat.", name: name, ticketId: code };
  } finally {
    lock.releaseLock();
  }
}

function updateDeliveryStatus_(ticketId, emailStatus, whatsappStatus) {
  const sheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID"))
    .getSheetByName(TICKET_CONFIG.sheetName);
  const lastRow = sheet.getLastRow();
  const match = sheet.getRange(2, 2, Math.max(1, lastRow - 1), 1)
    .createTextFinder(ticketId).matchEntireCell(true).findNext();
  if (match) sheet.getRange(match.getRow(), 16, 1, 2).setValues([[emailStatus, whatsappStatus]]);
}

function qrBlob_(ticketId) {
  const url = TICKET_CONFIG.qrService + "?size=420x420&data=" + encodeURIComponent(ticketId);
  return UrlFetchApp.fetch(url).getBlob().setName(ticketId + ".png");
}

function ticketPage_(data) {
  const error = data.error ? "<div class='error'>" + htmlEscape_(data.error) + "</div>" : "";
  const ticket = data.ticketId ? "<div class='ticket'><p class='ok'>Pendaftaran berhasil · Tiket valid</p>" +
    "<h2>" + htmlEscape_(data.name) + "</h2><p class='code'>" + htmlEscape_(data.ticketId) + "</p>" +
    "<img class='qr' src='" + data.qrDataUrl + "' alt='QR tiket'>" +
    "<p>Lokasi: " + TICKET_CONFIG.venue + "</p>" +
    "<p>Simpan tiket ini. Tunjukkan QR kepada panitia saat datang; QR hanya bisa dipakai satu kali.</p>" +
    "<div class='actions'><a class='btn' href='" + data.qrDataUrl + "' download='" + htmlEscape_(data.ticketId) + "-QR.png'>Unduh QR tiket</a>" +
    "<button class='btn' type='button' onclick='window.print()'>Cetak / simpan sebagai PDF</button></div></div>" : "";
  const html = "<!doctype html><html lang='id'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
    "<title>Tiket AI untuk Bisnis</title><style>body{margin:0;background:#e9eef5;color:#142b43;font:16px/1.5 system-ui,Arial}.box{max-width:520px;margin:7vh auto;padding:28px;background:#edf2f8;border-radius:24px;box-shadow:12px 12px 28px #b9c4d1,-10px -10px 24px #fff}.logo{color:#159b9a;font-size:12px;font-weight:800;letter-spacing:.12em}.ticket{text-align:center}.ok{color:#12705f;font-weight:800}.code{font-size:24px;font-weight:900;letter-spacing:.06em}.qr{width:min(260px,80%);height:auto;background:white;padding:12px;border-radius:14px}h1{color:#102d4d}p{color:#5e7185}.error{background:#fff0e9;color:#a5402f;padding:14px;border-radius:12px}.actions{display:grid;gap:10px;margin-top:20px}.btn{display:inline-block;padding:13px 16px;border:0;border-radius:11px;background:#2865d8;color:#fff;text-align:center;text-decoration:none;font:700 15px system-ui,Arial;cursor:pointer}@media print{body{background:#fff}.box{margin:0 auto;box-shadow:none;border:1px solid #ddd}.actions{display:none}}</style>" +
    "<body><main class='box'><div class='logo'>TRAINING EXCLUSIVE</div><h1>" +
    (data.ticketId ? "Tiket pendaftaran" : "Pendaftaran belum berhasil") + "</h1>" + error + ticket +
    "<p>Training Exclusive AI untuk Bisnis · Masjid Mudzaki</p></main></body></html>";
  return HtmlService.createHtmlOutput(html).setTitle("Tiket — Training Exclusive AI untuk Bisnis");
}

function checkinPage_() {
  return "<!doctype html><html lang='id'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
    "<title>Check-in Peserta</title><script src='https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'></script>" +
    "<style>body{font:16px system-ui,Arial;background:#e9eef5;color:#142b43;margin:0;padding:20px}.card{max-width:520px;margin:5vh auto;background:#edf2f8;padding:24px;border-radius:20px;box-shadow:10px 10px 24px #bcc6d2,-8px -8px 22px white}h1{color:#102d4d}input,button{font:inherit;padding:12px;border-radius:10px;border:1px solid #d2dce7;width:100%;box-sizing:border-box;margin:7px 0}button{background:#2865d8;color:white;font-weight:800;border:0}.result{padding:12px;border-radius:10px;margin-top:12px;background:#e0f3eb}.bad{background:#fff0e9}</style>" +
    "<main class='card'><h1>Check-in peserta</h1><p>Pindai QR tiket, lalu masukkan PIN panitia untuk mencatat kehadiran.</p><div id='reader'></div>" +
    "<label>Kode tiket<input id='ticket' placeholder='AI-XXXXXXXXXX'></label><label>PIN panitia<input id='pin' type='password' inputmode='numeric' placeholder='PIN 6 digit'></label>" +
    "<button onclick='checkin()'>Catat kehadiran</button><div id='result'></div></main>" +
    "<script>const scanner=new Html5Qrcode('reader');Html5Qrcode.getCameras().then(c=>{if(c.length)scanner.start({facingMode:'environment'},{fps:10,qrbox:220},v=>{document.getElementById('ticket').value=v;scanner.stop()})}).catch(()=>{});function checkin(){const code=document.getElementById('ticket').value.trim();const pin=document.getElementById('pin').value.trim();google.script.run.withSuccessHandler(r=>{const box=document.getElementById('result');box.className='result '+(r.ok?'':'bad');box.textContent=r.message+(r.name?' · '+r.name:'')+(r.ticketId?' · '+r.ticketId:'')}).checkInTicket(code,pin)}</script></html>";
}

function normalizePhone_(value) {
  let phone = String(value || "").replace(/\D/g, "");
  if (phone.startsWith("0")) phone = "62" + phone.slice(1);
  else if (!phone.startsWith("62")) phone = "62" + phone;
  return phone;
}

function safeCell_(value) {
  const text = String(value || "").trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function htmlEscape_(value) {
  return String(value || "").replace(/[&<>\"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[ch]));
}
