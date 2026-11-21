# Training Exclusive AI untuk Bisnis

Website pendaftaran acara bersama Mang Tab, Konsultan Bisnis. Halaman pendaftaran mengirim data ke Google Apps Script, menyimpan peserta ke Google Sheets, membuat kode tiket dan QR, lalu mengirim tiket ke email peserta.

## Alur peserta

1. Peserta mengisi nama, email, nomor WhatsApp, dan data usaha.
2. Setelah dikirim, tiket langsung berstatus valid dan QR ditampilkan serta dikirim ke email.
3. Jika `FONNTE_TOKEN` sudah diatur di Apps Script, peserta menerima pesan WhatsApp otomatis.
4. Saat acara, panitia membuka URL web app, memindai QR, dan memasukkan PIN check-in. Kehadiran tercatat satu kali di Google Sheets.

## Backend

Kode Google Apps Script dan panduan instalasi ada di folder `ticket-system/`. `daftar.html` mengirim field `name`, `email`, `phone`, `business`, `product`, `city`, `platform`, `participantType`, `infaq`, `question`, dan `consent` ke deployment web app.

Token Fonnte disimpan di **Project Settings > Script properties** dengan nama `FONNTE_TOKEN`. Jangan taruh token di HTML atau GitHub.

## Infaq

Pendaftaran gratis. Infaq hanya untuk kopi jamaah, bersifat sukarela, dan tidak memengaruhi penerbitan tiket atau check-in.
