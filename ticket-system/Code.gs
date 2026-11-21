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
  const qrDataUrl = "data:image/png;base64," + Utilities.base64Encode(qrBlob.getBytes());
  return ticketPage_({
    name: String(data.name), ticketId: ticketId, qrDataUrl: qrDataUrl,
    whatsappUrl: whatsappConfirmationUrl_(data, ticketId)
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
    const name = String(sheet.getRange(row, 3).getDisplayValue() || "");
    if (sheet.getRange(row, 14).getValue() === "HADIR") {
      return { ok: false, alreadyCheckedIn: true, message: "Tiket ini sudah check-in sebelumnya.", name: name, ticketId: code };
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

function whatsappConfirmationUrl_(data, ticketId) {
  const fields = [
    ["Nama peserta", data.name],
    ["Nomor WhatsApp", normalizePhone_(data.phone)],
    ["Nama usaha", data.business],
    ["Bidang usaha", data.product],
    ["Domisili", data.city],
    ["Platform jualan", data.platform],
    ["Status peserta", data.participantType],
    ["Infaq kopi jamaah", data.infaq],
    ["Pertanyaan", data.question]
  ].filter(item => String(item[1] || "").trim());

  const message = "Assalamu'alaikum Admin Masjid Mudzaki,\n\n" +
    "Saya sudah mengisi formulir pendaftaran Training Exclusive AI untuk Bisnis. Mohon bantu konfirmasi kehadiran saya. Berikut data yang saya daftarkan:\n\n" +
    fields.map(item => item[0] + ": " + String(item[1]).trim()).join("\n") +
    "\nKode tiket: " + ticketId +
    "\n\nSaya akan menunjukkan QR tiket saat hadir. Terima kasih.";
  return "https://wa.me/6285283966520?text=" + encodeURIComponent(message);
}

function ticketPage_(data) {
  const error = data.error ? "<div class='error'>" + htmlEscape_(data.error) + "</div>" : "";
  const qr = data.qrDataUrl || "";
  const waUrl = data.whatsappUrl || "";
  const fileName = htmlEscape_((data.ticketId || "tiket") + "-QR.png");
  const ticket = data.ticketId ? "<div class='ticket'><p class='ok'>Pendaftaran berhasil · Tiket valid</p>" +
    "<h2>" + htmlEscape_(data.name) + "</h2><p class='code'>" + htmlEscape_(data.ticketId) + "</p>" +
    "<img class='qr' src='" + qr + "' alt='QR tiket'>" +
    "<p>Lokasi: " + TICKET_CONFIG.venue + "</p>" +
    "<p>Data pendaftaran sudah tersimpan. Pesan konfirmasi WhatsApp sudah disusun dari data ini—kamu tidak perlu mengisi ulang.</p>" +
    "<div class='actions'><button class='btn primary' type='button' onclick='downloadAndConfirm()'>Unduh QR & konfirmasi ke admin</button></div></div>" : "";
  const scriptValues = "<script>const waTarget=" + JSON.stringify(waUrl) +
    ";const qrSource=" + JSON.stringify(qr) +
    ";const qrFile=" + JSON.stringify(fileName) +
    ";function downloadAndConfirm(){const w=window.open(waTarget,'_blank');const a=document.createElement('a');a.href=qrSource;a.download=qrFile;document.body.appendChild(a);a.click();a.remove();if(!w)setTimeout(()=>window.location.assign(waTarget),400)}</script>";
  const html = "<!doctype html><html lang='id'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
    "<title>Tiket AI untuk Bisnis</title><style>body{margin:0;background:#e9eef5;color:#142b43;font:16px/1.5 system-ui,Arial}.box{max-width:520px;margin:7vh auto;padding:28px;background:#edf2f8;border-radius:24px;box-shadow:12px 12px 28px #b9c4d1,-10px -10px 24px #fff}.logo{color:#159b9a;font-size:12px;font-weight:800;letter-spacing:.12em}.ticket{text-align:center}.ok{color:#12705f;font-weight:800}.code{font-size:24px;font-weight:900;letter-spacing:.06em}.qr{width:min(260px,80%);height:auto;background:white;padding:12px;border-radius:14px}h1{color:#102d4d}p{color:#5e7185}.error{background:#fff0e9;color:#a5402f;padding:14px;border-radius:12px}.actions{display:grid;gap:10px;margin-top:20px}.btn{display:inline-block;padding:13px 16px;border:0;border-radius:11px;background:#2865d8;color:#fff;text-align:center;text-decoration:none;font:700 15px system-ui,Arial;cursor:pointer}.light{background:#e9eef5;color:#102d4d;border:1px solid #dce4ed}.note{font-size:13px}.hidden{display:none}@media print{body{background:#fff}.box{margin:0 auto;box-shadow:none;border:1px solid #ddd}.actions,.note{display:none}}</style>" +
    "<body><main class='box'><div class='logo'>TRAINING EXCLUSIVE</div><h1>" +
    (data.ticketId ? "Tiket pendaftaran" : "Pendaftaran belum berhasil") + "</h1>" + error + ticket +
    "</main>" + scriptValues + "</body></html>";
  return HtmlService.createHtmlOutput(html).setTitle("Tiket — Training Exclusive AI untuk Bisnis");
}

function checkinPage_() {
  return "<!doctype html><html lang='id'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
    "<title>Check-in Peserta</title><script src='https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'></script>" +
    "<style>body{font:16px/1.5 system-ui,Arial;background:#e9eef5;color:#142b43;margin:0;padding:24px}.layout{max-width:980px;margin:4vh auto;display:grid;grid-template-columns:1fr 1fr;gap:20px}.card{background:#edf2f8;padding:24px;border-radius:20px;box-shadow:10px 10px 24px #bcc6d2,-8px -8px 22px white}h1,h2{color:#102d4d;margin-top:0}input,button{font:inherit;padding:12px;border-radius:10px;border:1px solid #d2dce7;width:100%;box-sizing:border-box;margin:7px 0}button{background:#2865d8;color:white;font-weight:800;border:0;cursor:pointer}.hint{font-size:14px;color:#63758a}.result{padding:14px;border-radius:12px;background:#e6ecf3;margin-top:14px}.result.ok{background:#e0f3eb}.result.bad{background:#fff0e9}.name{font-size:24px;font-weight:850;margin:8px 0}.code{font-weight:800;color:#2865d8}.hidden{display:none!important}#reader{width:100%;overflow:hidden;border-radius:12px;margin:12px 0}#reader video{border-radius:12px}.status{font-weight:800}.idle{text-align:center;padding:40px 10px;color:#66798c}@media(max-width:700px){body{padding:14px}.layout{grid-template-columns:1fr;margin:2vh auto}.card{padding:20px}}</style>" +
    "<main class='layout'><section class='card'><h1>Check-in peserta</h1><p>PANITIA: masukkan PIN sekali, lalu scan QR peserta. Sistem langsung mencatat kehadiran.</p>" +
    "<label>PIN panitia<input id='pin' type='password' inputmode='numeric' placeholder='PIN 6 digit' autocomplete='off'></label>" +
    "<button id='start' onclick='startScanner()'>Mulai scan QR</button><div id='reader'></div><p id='scan-message' class='hint'>Kamera akan aktif setelah tombol ditekan.</p></section>" +
    "<section class='card'><h2>Hasil pemindaian</h2><div id='result' class='result'><div class='idle'>Hasil tiket akan muncul di sini setelah QR dipindai.</div></div>" +
    "<button id='next' class='hidden' onclick='scanNext()'>Scan peserta berikutnya</button></section></main>" +
    "<script>let scanner=null;let busy=false;function esc(s){return String(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}function showResult(r){const box=document.getElementById('result');box.className='result '+(r.ok?'ok':'bad');box.innerHTML='<div class=\"status\">'+esc(r.message)+'</div>'+(r.name?'<div class=\"name\">'+esc(r.name)+'</div>':'')+(r.ticketId?'<div class=\"code\">'+esc(r.ticketId)+'</div>':'');document.getElementById('next').classList.remove('hidden');document.getElementById('scan-message').textContent='Hasil pemindaian tampil di panel sebelah.'}function startScanner(){const pin=document.getElementById('pin').value.trim();if(!pin){document.getElementById('scan-message').textContent='Masukkan PIN panitia terlebih dahulu.';return}if(typeof Html5Qrcode==='undefined'){document.getElementById('scan-message').textContent='Pemindai QR belum termuat. Muat ulang halaman dan coba lagi.';return}scanner=new Html5Qrcode('reader');Html5Qrcode.getCameras().then(cameras=>{if(!cameras.length)throw new Error('Kamera tidak ditemukan.');return scanner.start(cameras[0].id,{fps:10,qrbox:{width:230,height:230}},value=>{if(busy)return;busy=true;scanner.pause(true);document.getElementById('scan-message').textContent='Memeriksa tiket…';google.script.run.withSuccessHandler(showResult).withFailureHandler(e=>showResult({ok:false,message:e.message||'Gagal memeriksa tiket.'})).checkInTicket(value,pin)})}).catch(e=>{document.getElementById('scan-message').textContent=e.message||'Kamera tidak dapat dibuka.'})}function scanNext(){busy=false;document.getElementById('next').classList.add('hidden');document.getElementById('scan-message').textContent='Arahkan QR peserta berikutnya ke kamera.';if(scanner){scanner.resume()}else{startScanner()}}</script></html>";
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
