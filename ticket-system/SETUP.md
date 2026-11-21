# Sistem tiket Training Exclusive AI untuk Bisnis

Backend Google Apps Script ini menyiapkan Google Sheet peserta, menerima pendaftaran dari halaman website, menampilkan tiket QR yang bisa diunduh peserta, dan mencatat kehadiran saat QR dipindai.

## Yang dilakukan sistem

- Pendaftaran langsung menghasilkan tiket berstatus `VALID`.
- Data peserta masuk ke tab `Tiket Peserta`.
- Tiket berisi kode unik dan QR. QR hanya menyimpan kode tiket, bukan data pribadi.
- Email dan Fonnte tidak diperlukan untuk menerbitkan tiket.
- Setelah submit, halaman menampilkan kode tiket dan QR. Peserta bisa mengunduh gambar QR atau mencetak halaman sebagai PDF.
- Panitia membuka URL web app, memindai QR, lalu memasukkan PIN check-in.
- Check-in pertama mengubah status menjadi `HADIR`. Pemindaian berikutnya ditolak.

## Pasang di Google Apps Script

1. Buka [script.google.com](https://script.google.com) dengan akun Google pemilik acara dan buat proyek baru.
2. Tempel isi `Code.gs` ke file `Code.gs`.
3. Jalankan `setupTicketSystem` satu kali. Skrip membuat spreadsheet dan PIN check-in. Setujui izin Google, lalu simpan PIN dari **Executions > Logs** dan bagikan hanya kepada panitia.
4. Jalankan `authorizeTicketServices` satu kali dan setujui akses layanan QR.
5. Pilih **Deploy > Manage deployments**, edit deployment web app, lalu terbitkan versi terbaru. Jalankan sebagai akun pemilik dan atur akses ke siapa saja yang memiliki tautan. Halaman check-in tetap meminta PIN panitia.

## Nama kolom formulir publik

Halaman website harus mengirim POST dengan nama field berikut:

`name`, `phone`, `business`, `product`, `city`, `platform`, `participantType`, `infaq`, `question`, `consent`

Nama dan nomor WhatsApp peserta wajib. Email tidak diperlukan. Infaq opsional dan tidak memengaruhi tiket.

## Catatan

- Jangan jalankan `setupTicketSystem` lebih dari satu kali. Skrip mencegah pembuatan spreadsheet duplikat.
- Setelah data tercatat, kode tiket dan QR ditampilkan di halaman hasil. Peserta bisa mengunduh QR PNG atau menggunakan cetak browser untuk menyimpan tiket sebagai PDF.
- QR dibuat dari kode tiket melalui layanan QR publik. QR tidak memuat nama atau nomor WhatsApp.
