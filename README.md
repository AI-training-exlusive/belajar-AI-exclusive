# Training Exclusive AI untuk Bisnis

Website pendaftaran acara bersama Mang Tab, Konsultan Bisnis. Penyelenggara: masjidmuzaki.com dan Masjid Sejuta Pemuda. Halaman pendaftaran mengirim data ke Google Apps Script dan Google Sheets. Setelah mendaftar, peserta melihat tiket QR dan bisa mengunduh QR atau menyimpan tiket sebagai PDF.

## Alur peserta

1. Peserta mengisi nama, nomor WhatsApp, dan data usaha; email tidak diperlukan.
2. Setelah dikirim, data peserta masuk ke Google Sheets dan tiket QR tampil pada halaman tiket.
3. Peserta mengunduh tiket/QR; tombol utama membuka WhatsApp dengan pesan konfirmasi yang sudah berisi data pendaftaran dan kode tiket.
4. Peserta menekan Kirim di WhatsApp. Tidak perlu mengisi data lagi. Saat acara, panitia memindai QR dan mencatat kehadiran satu kali.

## Backend

Kode Google Apps Script dan panduan instalasi ada di folder `ticket-system/`. `daftar.html` mengirim field `name`, `phone`, `business`, `product`, `city`, `platform`, `participantType`, `infaq`, `question`, dan `consent` ke deployment web app. Tiket ditampilkan setelah data tersimpan; tombol konfirmasi WhatsApp memakai data formulir dan kode tiket, lalu peserta menekan Kirim.

## Infaq

Pendaftaran gratis. Infaq hanya untuk kopi jamaah, bersifat sukarela, dan tidak memengaruhi penerbitan tiket atau check-in.

## Mode halaman dan batch berikutnya

`index.html` otomatis berganti tampilan berdasarkan tanggal di `window.EVENT`: sebelum acara (daftar + hitung mundur), hari H (info masuk), dan setelah acara (tombol "kabari batch berikutnya" ke WhatsApp admin). Pratinjau mode tertentu: `index.html?mode=before`, `?mode=dday`, atau `?mode=after`.

Untuk membuka batch baru, ubah tanggal di tiga tempat:

1. `window.EVENT` di `index.html`
2. `window.REG_CLOSE_AT` di `daftar.html`
3. `TICKET_CONFIG.closeAt` di `ticket-system/Code.gs` (lalu deploy ulang Apps Script)

Teks tanggal yang tampil (mis. "Senin, 21 Des 2026") juga perlu diganti manual.
