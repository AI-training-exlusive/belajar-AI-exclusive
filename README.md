# Training Exclusive AI untuk Bisnis

Website pendaftaran acara bersama Mang Tab, Konsultan Bisnis. Halaman pendaftaran mengirim data ke Google Apps Script dan Google Sheets. Setelah mendaftar, peserta melihat tiket QR dan bisa mengunduh QR atau menyimpan tiket sebagai PDF.

## Alur peserta

1. Peserta mengisi nama, nomor WhatsApp, dan data usaha; email tidak diperlukan.
2. Setelah dikirim, tiket langsung berstatus valid dan QR tampil pada halaman tiket.
3. Peserta mengunduh QR sebagai PNG atau memilih cetak/simpan sebagai PDF.
4. Saat acara, panitia membuka URL web app, memindai QR, dan memasukkan PIN check-in. Kehadiran tercatat satu kali di Google Sheets.

## Backend

Kode Google Apps Script dan panduan instalasi ada di folder `ticket-system/`. `daftar.html` mengirim field `name`, `phone`, `business`, `product`, `city`, `platform`, `participantType`, `infaq`, `question`, dan `consent` ke deployment web app. Tiket ditampilkan setelah data tersimpan; peserta mengunduhnya langsung dari halaman tiket.

## Infaq

Pendaftaran gratis. Infaq hanya untuk kopi jamaah, bersifat sukarela, dan tidak memengaruhi penerbitan tiket atau check-in.
