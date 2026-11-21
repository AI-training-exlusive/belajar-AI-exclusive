# Sistem tiket Training Exclusive AI untuk Bisnis

Backend Google Apps Script ini menyiapkan Google Sheet peserta, menerima pendaftaran dari halaman website, mengirim tiket QR melalui email, mengirim konfirmasi WhatsApp lewat Fonnte, dan mencatat kehadiran saat QR dipindai.

## Yang dilakukan sistem

- Pendaftaran langsung menghasilkan tiket berstatus `VALID`.
- Data peserta masuk ke tab `Tiket Peserta`.
- Tiket berisi kode unik dan QR. QR hanya menyimpan kode tiket, bukan data pribadi.
- Tiket dan QR dikirim ke email peserta.
- Jika properti `FONNTE_TOKEN` tersedia, peserta juga menerima konfirmasi WhatsApp.
- Panitia membuka URL web app, memindai QR, lalu memasukkan PIN check-in.
- Check-in pertama mengubah status menjadi `HADIR`. Pemindaian berikutnya ditolak.

## Pasang di Google Apps Script

1. Buka [script.google.com](https://script.google.com) dengan akun Google pemilik acara dan buat proyek baru.
2. Tempel isi `Code.gs` ke file `Code.gs`.
3. Jalankan `setupTicketSystem` satu kali. Skrip membuat spreadsheet dan PIN check-in. Setujui izin Google, lalu simpan PIN dari **Executions > Logs** dan bagikan hanya kepada panitia.
4. Jalankan `authorizeTicketServices` satu kali dan setujui izin email serta akses layanan QR.
5. Jika memakai Fonnte, tambahkan properti skrip `FONNTE_TOKEN` melalui **Project Settings > Script properties**. Jangan taruh token di kode website atau GitHub.
6. Pilih **Deploy > New deployment > Web app**. Jalankan sebagai akun pemilik. Atur akses ke siapa saja yang memiliki tautan. Halaman check-in tetap meminta PIN panitia.
7. Salin URL deployment yang berakhir `/exec` dan kirim ke pembuat website agar formulir publik diarahkan ke backend ini.

## Nama kolom formulir publik

Halaman website harus mengirim POST dengan nama field berikut:

`name`, `email`, `phone`, `business`, `product`, `city`, `platform`, `participantType`, `infaq`, `question`, `consent`

Nama dan email peserta wajib. Infaq opsional dan tidak memengaruhi tiket.

## Catatan

- Jangan jalankan `setupTicketSystem` lebih dari satu kali. Skrip mencegah pembuatan spreadsheet duplikat.
- Jika pengiriman email gagal, kode tiket tetap tercatat di spreadsheet dengan status email `GAGAL`.
- Jika Fonnte belum diatur, tiket tetap dikirim lewat email; status WhatsApp dicatat sebagai `BELUM DIATUR`.
- QR dibuat dari kode tiket melalui layanan QR publik. QR tidak memuat nama, email, atau nomor WhatsApp.
