# Training Exclusive AI untuk Bisnis

Website pendaftaran acara bersama Mang Tab, Konsultan Bisnis. Halaman pendaftaran mengirim data ke Google Apps Script dan Google Sheets. Setelah mendaftar, peserta melihat tiket QR dan bisa mengunduh QR atau menyimpan tiket sebagai PDF.

## Alur peserta

1. Peserta mengisi nama, nomor WhatsApp, dan data usaha; email tidak diperlukan.
2. Setelah dikirim, data peserta masuk ke Google Sheets dan tiket QR tampil pada halaman tiket.
3. Peserta mengunduh tiket/QR; tombol utama membuka WhatsApp dengan pesan konfirmasi yang sudah berisi data pendaftaran dan kode tiket.
4. Peserta menekan Kirim di WhatsApp. Tidak perlu mengisi data lagi. Saat acara, panitia memindai QR dan mencatat kehadiran satu kali.

## Backend

Kode Google Apps Script dan panduan instalasi ada di folder `ticket-system/`. `daftar.html` mengirim field `name`, `phone`, `business`, `product`, `city`, `platform`, `participantType`, `infaq`, `question`, dan `consent` ke deployment web app. Tiket ditampilkan setelah data tersimpan; tombol konfirmasi WhatsApp memakai data formulir dan kode tiket, lalu peserta menekan Kirim.

## Infaq

Pendaftaran gratis. Infaq hanya untuk kopi jamaah, bersifat sukarela, dan tidak memengaruhi penerbitan tiket atau check-in.
