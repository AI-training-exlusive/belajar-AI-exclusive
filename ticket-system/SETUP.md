# Sistem tiket Training Exclusive AI untuk Bisnis

Backend Google Apps Script ini memakai spreadsheet tujuan yang sudah ada, menerima pendaftaran dari halaman website, menampilkan tiket QR yang bisa diunduh peserta, dan mencatat kehadiran saat QR dipindai.

## Yang dilakukan sistem

- Pendaftaran langsung menghasilkan tiket berstatus `VALID`.
- Data peserta masuk ke tab `Tiket Peserta`.
- Tiket berisi kode unik dan QR. QR hanya menyimpan kode tiket, bukan data pribadi.
- Email dan Fonnte tidak diperlukan untuk menerbitkan tiket.
- Setelah submit, halaman menampilkan kode tiket dan QR. Tombol yang tersedia hanya **Unduh QR & konfirmasi ke admin**.
- Tombol utama mengunduh QR lalu membuka WhatsApp dengan pesan konfirmasi sopan yang sudah terisi data formulir dan kode tiket. Peserta cukup menekan Kirim; browser tidak mengirim pesan WhatsApp otomatis tanpa tindakan itu.
- Panitia membuka URL web app, memasukkan PIN sekali, lalu memindai QR. Kehadiran tercatat otomatis dan nama serta kode tiket tampil di panel sebelah.
- Check-in pertama mengubah status menjadi `HADIR`. Pemindaian berikutnya ditolak, dan hasilnya terlihat di panel samping.

## Pasang di Google Apps Script

1. Buka proyek Apps Script yang terhubung ke URL web app `/exec`.
2. Tempel versi terbaru `Code.gs` ke proyek itu dan simpan. ID spreadsheet tujuan sudah ditetapkan di kode; skrip memakai tab `Tiket Peserta` yang sudah ada dan tidak membuat spreadsheet baru.
3. Jalankan `setupTicketSystem`. Fungsi ini menghubungkan Script Properties ke spreadsheet tujuan, mempertahankan PIN panitia yang sudah ada, lalu menampilkan URL sheet dan PIN di log. Jangan jalankan fungsi ini dari proyek Apps Script lain.
4. Jika diminta, jalankan `authorizeTicketServices` dan setujui akses QR.
5. Pilih **Deploy > Manage deployments**, edit deployment web app, lalu terbitkan versi terbaru. Jalankan sebagai akun pemilik dan atur akses ke siapa saja yang memiliki tautan.

## Nama kolom formulir publik

Halaman website harus mengirim POST dengan nama field berikut:

`name`, `phone`, `business`, `product`, `city`, `platform`, `participantType`, `infaq`, `question`, `consent`

Nama dan nomor WhatsApp peserta wajib. Email tidak diperlukan. Infaq opsional dan tidak memengaruhi tiket.

## Catatan

- Jangan jalankan `setupTicketSystem` lebih dari satu kali. Skrip mencegah pembuatan spreadsheet duplikat.
- Setelah data tercatat, kode tiket dan QR ditampilkan di halaman hasil. Tombol **Unduh QR & konfirmasi ke admin** mengunduh QR dan membuka WhatsApp dengan data yang sudah terisi; peserta menekan Kirim untuk menyampaikan konfirmasi ke admin.
- QR dibuat dari kode tiket melalui layanan QR publik. QR tidak memuat nama atau nomor WhatsApp.
