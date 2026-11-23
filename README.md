# Training Exclusive AI untuk Bisnis

Website pendaftaran acara bersama Mang Tab, Konsultan Bisnis. Penyelenggara: masjidmuzaki.com dan Masjid Sejuta Pemuda. Halaman pendaftaran mengirim data ke Google Apps Script dan Google Sheets. Setelah mendaftar, peserta melihat tiket QR dan bisa mengunduh QR atau menyimpan tiket sebagai PDF.

## Alur peserta

1. Peserta mengisi nama, nomor WhatsApp, dan data usaha; email tidak diperlukan.
2. Setelah dikirim, data peserta masuk ke Google Sheets dan tiket QR tampil pada halaman tiket.
3. Peserta mengunduh tiket/QR; tombol utama membuka WhatsApp dengan pesan konfirmasi yang sudah berisi data pendaftaran dan kode tiket.
4. Peserta menekan Kirim di WhatsApp. Tidak perlu mengisi data lagi. Saat acara, panitia memindai QR dan mencatat kehadiran satu kali.

## Backend

Kode Google Apps Script dan panduan instalasi ada di folder `ticket-system/`. `daftar.html` mengirim field `name`, `phone`, `business`, `product`, `city`, `platform`, `participantType`, `infaq`, `question`, dan `consent` ke deployment web app. Tiket ditampilkan setelah data tersimpan; tombol konfirmasi WhatsApp memakai data formulir dan kode tiket, lalu peserta menekan Kirim.

## Biaya pendaftaran

Biaya pendaftaran Rp20.000 untuk kopi jamaah, dibayar lewat QRIS (`assets/qris-kopi-jamaah.png`). Pembayaran tidak wajib; field `infaq` (nama teknis) berisi "Tidak bayar" atau "Rp20.000 via QRIS (bukti diupload)". Kata "infaq" tidak ditampilkan di halaman. Sistem tidak memeriksa pembayaran secara otomatis: peserta mengirim bukti bayar di chat WhatsApp konfirmasi, lalu admin mencocokkannya. Tiket tetap terbit saat formulir dikirim.

## Mode halaman dan batch berikutnya

`index.html` otomatis berganti tampilan berdasarkan tanggal di `window.EVENT`: sebelum acara (daftar + hitung mundur), hari H (info masuk), dan setelah acara (tombol "kabari batch berikutnya" ke WhatsApp admin). Pratinjau mode tertentu: `index.html?mode=before`, `?mode=dday`, atau `?mode=after`.

Untuk membuka batch baru, ubah tanggal di tiga tempat:

1. `window.EVENT` di `index.html`
2. `window.REG_CLOSE_AT` di `daftar.html`
3. `TICKET_CONFIG.closeAt` di `ticket-system/Code.gs` (lalu deploy ulang Apps Script)

Teks tanggal yang tampil (mis. "Sabtu, 19 Des 2026") juga perlu diganti manual.
