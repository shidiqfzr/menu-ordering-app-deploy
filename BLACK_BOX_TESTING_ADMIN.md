# DOKUMEN PENGUJIAN BLACK-BOX TESTING (LENGKAP)
## PANEL ADMINISTRASI & POS — BUJANG CAFE ADMIN PANEL

---

### Informasi Dokumen
- **Nama Aplikasi**: Bujang Cafe — Admin Panel (POS & Restaurant Management System)
- **URL Aplikasi**: `http://localhost:5174`
- **Metode Pengujian**: Black-Box Testing (Equivalence Partitioning & Boundary Value Analysis) + Static Code Analysis
- **Versi Dokumen**: v2 (Update termasuk fix fitur Kosongkan Meja)
- **Frontend Stack**: React 19, Vite, React Router v7, React-Toastify, Socket.IO Client
- **Backend Stack**: Node.js, Express.js, MongoDB Mongoose, Socket.IO Server
- **Tanggal Pengujian**: 26 September 2026
- **Penguji**: _(isi nama penguji)_
- **Lingkungan**:
  - OS: Windows 11
  - Browser: Google Chrome / Edge (Chromium)
  - Resolusi: 1920×1080 (Desktop POS Screen)

---

### Akun Uji

| Peran | Email | Password | Redirect Default |
|---|---|---|---|
| **Kasir** | `kasir@bujangcafe.com` | `kasir12345` | `/orders` |
| **Manager** | `manager@bujangcafe.com` | `manager12345` | `/dashboard` |

---

## Temuan Static Code Analysis (Bug & Potensi Masalah)

> Temuan ini diperoleh dari analisis mendalam kode admin panel sebelum pengujian manual.

### BUG-A-01 — Admin Login: Redirect Bergantung `result.data?.user?.role` yang Tidak Ada (KRITIKAL)

**Lokasi**: `Login.jsx` baris 48-56

```javascript
if (result.success) {
  const userRole = result.data?.user?.role;  // <- result.data tidak ada!
  if (location.state?.from?.pathname) {
    navigate(location.state.from.pathname, { replace: true });
  } else if (userRole === 'kasir' || userRole === 'kitchen') {
    navigate('/orders', { replace: true });
  } else {
    navigate('/dashboard', { replace: true });  // <- Selalu ke sini
  }
}
```

**Masalah**: `AuthContext.login()` mengembalikan `{ success: true }` saja (baris 104 AuthContext.jsx), **bukan** `{ success: true, data: { user: { role } } }`. Akibatnya `result.data` selalu `undefined`, dan `userRole` selalu `undefined`.

**Dampak**: Semua user (baik kasir maupun manager) selalu di-redirect ke `/dashboard` setelah login berhasil (bukan kasir ke `/orders`). Namun karena ProtectedRoute memblokir kasir dari `/dashboard` dan redirect ke `/orders`, secara efektif kasir tetap sampai ke `/orders` — hanya melalui redirect dua kali (inefficiency, bukan crash).

**Konfirmasi**: Cek di testing apakah kasir langsung ke `/dashboard` (redirect sekali) atau ada flash sebelum ke `/orders` (redirect dua kali).

---

### BUG-A-02 — `handleCancelOrder` Menggunakan `window.confirm` (UX Inkonsisten)

**Lokasi**: `Orders.jsx` baris 229-234

```javascript
const handleCancelOrder = (orderId, invoiceNumber) => {
  if (window.confirm(`Batalkan ${invoiceNumber}?...`)) {  // <- window.confirm, bukan SweetAlert/Toast
    handleStatusChange(orderId, 'Dibatalkan');
  }
};
```

**Masalah**: Fungsi pembatalan pesanan di halaman admin menggunakan `window.confirm()` bawaan browser — berbeda dengan seluruh komponen lain yang menggunakan SweetAlert2 atau React-Toastify. Tampilan `window.confirm` tidak bisa di-style dan tidak konsisten dengan desain UI.

**Dampak**: Low-Medium — fungsional bekerja, namun UX inkonsisten.

---

### BUG-A-03 — Dashboard: `BACKEND_URL` didefinisikan tapi Tidak Digunakan

**Lokasi**: `Dashboard.jsx` baris 23

```javascript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;  // Tidak pernah dipakai
```

**Masalah**: `BACKEND_URL` didefinisikan sebagai constant namun tidak digunakan di manapun di Dashboard.jsx. Semua API call sudah menggunakan `api` service (`api.get('/api/...')`).

**Dampak**: Low — dead code, tidak ada dampak fungsional. Perlu dibersihkan.

---

### BUG-A-04 — Fitur Kosongkan Meja: SUDAH DIPERBAIKI

**Lokasi**: `Tables.jsx` — diperbaiki pada 26 September 2026

**Perbaikan**: Mengganti `axios.post` (yang tidak diimpor) dengan `api.post` dari service terpusat. Sekarang auth token otomatis disertakan dan error "Gagal mengosongkan meja" tidak lagi muncul.

**Status**: ✅ FIXED — Perlu diverifikasi via manual testing (TC-A-TBL-04 dan TC-A-TBL-05).

---

### INFO — RBAC Backend: `requireRoles` Hanya pada Food Routes

**Lokasi**: `foodRoute.js` baris 8, 11, 20

Hanya route `food/add`, `food/update`, dan `food/remove` yang menggunakan middleware `requireRoles('manager', 'admin')`. Route `food/toggle-availability` hanya membutuhkan `authMiddleware` (kasir boleh toggle). Route `/api/order/status` juga tidak dilindungi `requireRoles` — artinya kasir juga bisa mengubah status pesanan melalui direct API call, namun UI admin sudah membatasi hal ini di frontend.

---

## 1. Modul Autentikasi & RBAC Admin

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-A-AUTH-01** | Login dengan kredensial salah | Buka `/login` → isi email/password salah → klik "Masuk ke Panel Admin" | Email: `salah@test.com`, Pass: `salah123` | Toast error muncul, form tidak lanjut, tetap di halaman login | | |
| **TC-A-AUTH-02** | Login dengan form kosong | Klik submit tanpa isi email/password | (kosong) | Browser HTML5 validation mencegah submit | | |
| **TC-A-AUTH-03** | Login sebagai Kasir | Isi akun Kasir valid → klik "Masuk" | Email: `kasir@bujangcafe.com`, Pass: `kasir12345` | Login berhasil, toast sukses, diarahkan ke `/orders` | | |
| **TC-A-AUTH-04** | Login sebagai Manager | Isi akun Manager valid → klik "Masuk" | Email: `manager@bujangcafe.com`, Pass: `manager12345` | Login berhasil, toast sukses, diarahkan ke `/dashboard` | | |
| **TC-A-AUTH-05** | RBAC: Kasir akses URL `/dashboard` | Login sebagai Kasir → ketik `http://localhost:5174/dashboard` | URL: `/dashboard` | Diblokir oleh ProtectedRoute, redirect ke `/orders` | | |
| **TC-A-AUTH-06** | RBAC: Sidebar tanpa menu Dashboard untuk Kasir | Login sebagai Kasir → amati sidebar | Peran: kasir | Menu "Dashboard" tidak tampil di sidebar, hanya ada Daftar Menu, Semua Pesanan, Meja & QR | | |
| **TC-A-AUTH-07** | RBAC: Sidebar lengkap untuk Manager | Login sebagai Manager → amati sidebar | Peran: manager | Semua menu tampil: Dashboard, Daftar Menu, Semua Pesanan, Meja & QR | | |
| **TC-A-AUTH-08** | Logout Admin | Klik tombol Logout dari dropdown profil/navbar | Klik Logout | Toast info "Anda telah keluar", token dihapus dari localStorage/sessionStorage, redirect ke `/login` | | |
| **TC-A-AUTH-09** | Session persistence (Remember Me) | Login dengan "Ingat sesi saya" centang → tutup browser → buka lagi | Checkbox tercentang | Saat browser dibuka kembali, user masih login (token di localStorage) | | |
| **TC-A-AUTH-10** | Session tanpa Remember Me | Login dengan "Ingat sesi saya" tidak dicentang → tutup tab → buka tab baru | Checkbox kosong | User sudah logout (token hanya di sessionStorage, hilang saat tab/browser ditutup) | | |

---

## 2. Modul Dashboard & Analitik Bisnis (Khusus Manager)

### Langkah Pre-Test
1. Login sebagai Manager
2. Buka `http://localhost:5174/dashboard`

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-A-DASH-01** | Tampilkan 4 kartu KPI utama | Buka dashboard, amati kartu metrik | Peran: manager | 4 kartu tampil: Total Pendapatan, Jumlah Pesanan Selesai, AOV (rata-rata transaksi), Menu Terlaris | | |
| **TC-A-DASH-02** | Filter periode "Hari Ini" | Klik pill "Hari Ini" | Klik | Data berubah ke transaksi hari ini, grafik dan kartu KPI ter-update | | |
| **TC-A-DASH-03** | Filter periode "7 Hari Terakhir" | Klik pill "7 Hari Terakhir" | Klik | Data 7 hari tampil | | |
| **TC-A-DASH-04** | Filter periode "30 Hari Terakhir" | Klik pill "30 Hari Terakhir" | Klik | Data 30 hari tampil, chart mode berubah ke Area Chart otomatis | | |
| **TC-A-DASH-05** | Filter periode "Bulan Ini" | Klik pill "Bulan Ini" | Klik | Data bulan ini tampil | | |
| **TC-A-DASH-06** | Filter "Semua Data" | Klik pill "Semua Data" | Klik | Semua data historis dimuat | | |
| **TC-A-DASH-07** | Toggle Bar Chart / Area Chart | Klik tombol toggle mode grafik di sudut kanan grafik | Klik toggle | Grafik berganti antara Bar Chart dan Area Chart dengan mulus | | |
| **TC-A-DASH-08** | Hover tooltip pada grafik | Arahkan kursor ke titik/batang pada grafik | Hover | Tooltip interaktif muncul dengan tanggal, pendapatan, dan jumlah pesanan | | |
| **TC-A-DASH-09** | Tampilkan menu terlaris | Scroll ke bagian menu terlaris | — | Daftar menu terlaris dengan jumlah terjual tampil | | |
| **TC-A-DASH-10** | Analisis jam sibuk (Peak Hours) | Scroll ke bagian analisis jam sibuk | — | Distribusi waktu pemesanan tampil (misal: jam 11-14 dan 18-21 aktif) | | |

---

## 3. Modul Manajemen Pesanan (KDS — Kitchen Display System)

### Langkah Pre-Test
1. Login sebagai Kasir atau Manager
2. Buka `http://localhost:5174/orders`
3. Pastikan ada pesanan aktif (buat pesanan dari aplikasi customer)

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-A-ORD-01** | Tampilan tiket pesanan aktif | Buka tab "Pesanan Aktif" | Data pesanan ada | Kartu tiket tampil: nomor meja, nama pemesan, nomor faktur, item menu, total, dan timer waktu tunggu | | |
| **TC-A-ORD-02** | Filter "Menunggu" | Klik pill "Menunggu" | Klik | Hanya tiket berstatus Pending yang tampil | | |
| **TC-A-ORD-03** | Filter "Diproses" | Klik pill "Diproses" | Klik | Hanya tiket berstatus Diproses yang tampil | | |
| **TC-A-ORD-04** | Filter "Sedang Santap" | Klik pill "Sedang Santap" | Klik | Hanya tiket berstatus Disajikan yang tampil | | |
| **TC-A-ORD-05** | Pencarian pesanan by meja | Ketik "Meja 3" di search bar | `Meja 3` | Hanya tiket dari Meja 3 yang tampil | | |
| **TC-A-ORD-06** | Pencarian pesanan by nama pemesan | Ketik nama customer di search | Nama customer | Tiket pesanan dari customer tersebut tampil | | |
| **TC-A-ORD-07** | Expand/collapse menu items pada tiket | Klik tiket untuk buka detail menu item | Klik tiket | Daftar item pesanan (nama menu, qty, harga) tampil saat di-expand | | |
| **TC-A-ORD-08** | "Buka Semua" expand | Klik tombol "Buka Semua" | Klik | Semua tiket di halaman ter-expand sekaligus | | |
| **TC-A-ORD-09** | Update status: Pending → Diproses | Klik tombol "Konfirmasi & Masak →" pada tiket Pending (SUDAH BAYAR) | Klik tombol | Status berubah ke Diproses, toast sukses muncul, tiket berpindah filter | | |
| **TC-A-ORD-10** | Update status: Diproses → Disajikan | Klik "Sajikan ke Meja →" pada tiket Diproses | Klik tombol | Status berubah ke Disajikan, tiket ke filter Sedang Santap | | |
| **TC-A-ORD-11** | Update status: Disajikan → Selesai | Klik "Selesaikan & Kosongkan Meja" pada tiket Disajikan | Klik tombol | Status berubah ke Selesai, tiket pindah ke tab Riwayat Pesanan | | |
| **TC-A-ORD-12** | Batalkan pesanan via window.confirm | Klik tombol "Batalkan" pada tiket → klik OK di dialog | Konfirmasi OK | Status berubah ke Dibatalkan, tiket pindah ke Riwayat | | |
| **TC-A-ORD-13** | Filter Riwayat "Hari Ini" | Beralih ke tab Riwayat → klik "Hari Ini" | Klik | Hanya transaksi hari ini tampil | | |
| **TC-A-ORD-14** | Filter Riwayat berdasarkan rentang tanggal | Isi tanggal mulai dan akhir pada filter tanggal | Tanggal kustom | Data terfilter sesuai rentang tanggal | | |
| **TC-A-ORD-15** | Export Excel (Manager only) | Login sebagai Manager → klik "Export Excel" | Klik | File CSV terunduh ke komputer | | |
| **TC-A-ORD-16** | Export Excel tersembunyi untuk Kasir | Login sebagai Kasir → cek header | Peran: kasir | Tombol "Export Excel" tidak tampil | | |

---

## 4. Modul Kalkulator Kasir & Konfirmasi Pembayaran

### Langkah Pre-Test
1. Ada pesanan berstatus "Pending" di halaman /orders

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-A-PAY-01** | Buka modal dari tiket Pending | Klik tombol "💵 Konfirmasi Pembayaran →" | Klik tombol | Modal kasir terbuka, input uang tunai auto-focus, total tagihan tampil | | |
| **TC-A-PAY-02** | Tombol preset denominasi Rupiah | Periksa tombol di modal untuk tagihan Rp 24.000 | Tagihan: Rp 24.000 | Tersedia: Uang Pas, Rp 20.000, Rp 50.000, Rp 100.000 | | |
| **TC-A-PAY-03** | Klik "Uang Pas" | Klik tombol shortcut "Uang Pas" | Klik Uang Pas | Input terisi sejumlah tagihan, kembalian = Rp 0, tombol konfirmasi aktif (hijau) | | |
| **TC-A-PAY-04** | Pembayaran lebih dari tagihan | Masukkan uang tunai > tagihan (misal: Rp 50.000 untuk tagihan Rp 24.000) | Tunai: 50000 | Kembalian terhitung: Rp 26.000, tombol konfirmasi aktif | | |
| **TC-A-PAY-05** | Pembayaran kurang dari tagihan | Masukkan uang tunai < tagihan (misal: Rp 20.000 untuk Rp 24.000) | Tunai: 20000 | Peringatan "Uang kurang Rp 4.000", tombol konfirmasi disabled | | |
| **TC-A-PAY-06** | Input uang = 0 atau kosong | Kosongkan input atau masukkan 0 | Tunai: 0 atau kosong | Tombol konfirmasi tetap disabled | | |
| **TC-A-PAY-07** | Konfirmasi pembayaran valid (1-Click POS) | Masukkan uang cukup → klik "Konfirmasi Pembayaran" | Tunai: >= tagihan | Status pesanan → Diproses, pembayaran = Lunas, toast sukses. Pesanan otomatis ke dapur | | |
| **TC-A-PAY-08** | Auto-print struk setelah konfirmasi | Pastikan checkbox "Cetak Struk" aktif → konfirmasi | Checkbox aktif | Modal struk langsung terbuka setelah pembayaran dikonfirmasi | | |
| **TC-A-PAY-09** | Tutup modal tanpa konfirmasi | Klik X atau area luar modal | Klik X / backdrop | Modal tertutup, tidak ada perubahan status pesanan | | |

---

## 5. Modul Pencetakan Struk & Tiket Dapur (KOT)

### Langkah Pre-Test
1. Ada pesanan yang sudah dibayar
2. Klik tombol "Struk" pada tiket pesanan tersebut

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-A-PRN-01** | Buka modal struk | Klik tombol "Struk" pada tiket pesanan | Klik | Modal struk terbuka dengan 2 tab: "Struk Pelanggan" dan "Tiket Dapur (KOT)" | | |
| **TC-A-PRN-02** | Validasi isi Struk Pelanggan | Buka tab "Struk Pelanggan" | Tab aktif | Tampil: Nama kafe, No. Faktur, No. Meja, Waktu, daftar menu + harga, Subtotal, Diskon, Total, Tunai Diterima, Kembalian, Catatan | | |
| **TC-A-PRN-03** | Validasi Tiket Dapur (KOT) | Buka tab "Tiket Dapur (KOT)" | Tab aktif | Badge jumlah `[ 1x ]` dan nama menu sejajar rapi, kategori tampil di bawahnya | | |
| **TC-A-PRN-04** | Klik Cetak Struk | Klik tombol "Cetak Struk" merah | Klik | Dialog print browser terbuka, hanya area struk yang tampil (elemen modal tersembunyi via @media print) | | |
| **TC-A-PRN-05** | Tutup modal struk | Klik X atau area luar | Klik | Modal tertutup | | |

---

## 6. Modul Daftar Menu (CRUD Menu)

### Langkah Pre-Test
1. Buka `http://localhost:5174/list`

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-A-LIST-01** | Tampilkan daftar menu | Buka halaman /list | — | Tabel/grid menu tampil dengan gambar, nama, kategori, harga, status stok | | |
| **TC-A-LIST-02** | Pencarian menu by nama | Ketik nama menu di search bar | `ayam` | Hanya menu yang mengandung kata "ayam" ditampilkan | | |
| **TC-A-LIST-03** | Filter by kategori | Pilih kategori dari dropdown/filter | Kategori tertentu | Hanya menu dari kategori tersebut tampil | | |
| **TC-A-LIST-04** | Filter stok | Pilih "Stok Habis" dari filter | Filter stok habis | Hanya menu dengan status Stok Habis tampil | | |
| **TC-A-LIST-05** | Toggle stok (Kasir) — Tersedia ke Stok Habis | Login sebagai Kasir → klik toggle stok pada menu | Klik toggle | Status berubah menjadi "Stok Habis" secara instan (optimistic update), toast sukses | | |
| **TC-A-LIST-06** | Toggle stok (Kasir) — Stok Habis ke Tersedia | Login sebagai Kasir → klik toggle pada menu Stok Habis | Klik toggle | Status kembali "Tersedia", toast sukses | | |
| **TC-A-LIST-07** | Tombol Add/Edit/Delete tersembunyi untuk Kasir | Login sebagai Kasir → cek tampilan | Peran: kasir | Tombol "Tambah Menu", edit, dan delete tidak tampil (atau tampil badge "Khusus Manager") | | |
| **TC-A-LIST-08** | Tambah menu baru (Manager) | Login sebagai Manager → klik "+ Tambah Menu Baru" → isi form → upload gambar → klik "Simpan" | Form baru + gambar | Menu baru tersimpan di database, muncul di daftar, tersedia di customer app | | |
| **TC-A-LIST-09** | Tambah menu tanpa gambar | Isi form tambah menu tanpa upload gambar | (No image) | Validasi mencegah submit atau backend menolak | | |
| **TC-A-LIST-10** | Edit menu (Manager) | Klik ikon Edit → ubah harga → klik "Perbarui" | Harga baru | Harga ter-update di database, muncul di daftar dengan harga baru | | |
| **TC-A-LIST-11** | Hapus menu (Manager) | Klik ikon Hapus → konfirmasi dialog → klik OK | Konfirmasi | Menu terhapus dari database dan hilang dari daftar | | |
| **TC-A-LIST-12** | Kasir tidak bisa Add/Edit/Delete via direct URL | Login sebagai Kasir → buka `/list?action=add` | URL query | Modal Add tidak terbuka untuk Kasir (terdapat guard `isManager` di code) | | |

---

## 7. Modul Manajemen Meja & QR Code

### Langkah Pre-Test
1. Login (Kasir atau Manager)
2. Buka `http://localhost:5174/tables`

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-A-TBL-01** | Tampilkan status semua meja | Buka /tables | — | Kartu meja tampil dengan status (Kosong/Menunggu/Sedang Dimasak/Makan) dan warna berbeda | | |
| **TC-A-TBL-02** | Filter tab "Tersedia" | Klik tab "Tersedia" | Klik | Hanya meja berstatus Available/Kosong yang tampil | | |
| **TC-A-TBL-03** | Filter tab "Sedang Dimasak" | Klik tab "Sedang Dimasak" | Klik | Hanya meja yang pesanannya sedang dimasak yang tampil | | |
| **TC-A-TBL-04** | Pencarian meja by nomor | Ketik nomor meja di search | `3` | Hanya kartu Meja 3 yang tampil | | |
| **TC-A-TBL-05** | Tampilkan info pesanan aktif pada meja | Ada pesanan aktif di Meja 3 → lihat kartu | — | Kartu Meja 3 menampilkan status "Terisi", nama pemesan, total tagihan | | |
| **TC-A-TBL-06** | Buka QR Code meja | Klik tombol "QR Meja" pada kartu | Klik | Modal QR Code terbuka dengan QR yang bisa dipindai, link mengarah ke `/?table=N` | | |
| **TC-A-TBL-07** | Unduh QR Code PNG | Klik tombol "Unduh QR" di modal | Klik | File PNG QR Code terunduh dengan nama berkas sesuai nomor meja | | |
| **TC-A-TBL-08** | Sesuaikan jumlah meja (+) | Klik tombol "+" untuk menambah kapasitas meja | Klik + | Jumlah meja bertambah, kartu meja baru muncul | | |
| **TC-A-TBL-09** | Sesuaikan jumlah meja (-) | Klik tombol "-" untuk mengurangi kapasitas | Klik - | Jumlah meja berkurang (minimal 1) | | |

---

## 8. Modul Kosongkan Meja (Fitur yang Baru Diperbaiki)

> **Catatan**: Bug ini sudah diperbaiki — `axios.post` diganti `api.post` agar auth token otomatis disertakan.

### Langkah Pre-Test
1. Buat pesanan via customer app pada Meja tertentu
2. Dari admin /orders, ubah status ke "Disajikan"
3. Buka /tables — pastikan meja tersebut berstatus "Dining/Makan"

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-A-CLEAR-01** | Kosongkan Meja berhasil (Happy Path) | Temukan meja berstatus "Makan" → klik tombol "🧹 Kosongkan Meja" | Klik | TIDAK ADA error. Toast sukses "Meja X dikosongkan & status selesai 🧹" muncul dengan tombol "Urungkan" | | |
| **TC-A-CLEAR-02** | Status pesanan di database berubah ke Selesai | Setelah Kosongkan Meja → cek di /orders tab Riwayat | — | Pesanan muncul di Riwayat dengan status "Selesai" | | |
| **TC-A-CLEAR-03** | Status meja berubah ke Available | Setelah Kosongkan Meja → lihat kartu meja | — | Kartu meja berubah ke status "Kosong/Available" (hijau) | | |
| **TC-A-CLEAR-04** | Tombol Urungkan berfungsi dalam 5 detik | Klik "Urungkan" saat toast masih tampil | Klik dalam 5 detik | Status pesanan dikembalikan ke "Disajikan", meja kembali ke status "Makan" | | |
| **TC-A-CLEAR-05** | Kosongkan Meja dengan multiple pesanan aktif | Meja yang memiliki lebih dari 1 pesanan Disajikan → klik Kosongkan | Multi-order | Semua pesanan Disajikan di meja itu berubah ke "Selesai" sekaligus | | |
| **TC-A-CLEAR-06** | Tombol Kosongkan Meja tidak muncul di meja Available | Lihat meja berstatus "Kosong" | — | Tombol "Kosongkan Meja" tidak ada, hanya ada tombol "QR Meja" | | |
| **TC-A-CLEAR-07** | Tombol Kosongkan Meja tidak muncul di meja Pending/Cooking | Lihat meja berstatus "Menunggu" atau "Sedang Dimasak" | — | Tombol "Kosongkan Meja" tidak ada (hanya untuk status Dining) | | |

---

## 9. Modul Notifikasi Real-Time (Socket.IO)

### Langkah Pre-Test
1. Buka admin panel di satu tab browser
2. Buka customer app di tab lain (atau device lain)

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-A-SOCK-01** | Pesanan baru muncul real-time di admin | Customer buat pesanan baru → amati admin /orders | Pesanan baru dari customer | Tiket pesanan baru muncul langsung tanpa refresh, audio chime berbunyi (jika suara aktif), toast info muncul | | |
| **TC-A-SOCK-02** | Update status pesanan dari admin terlihat di customer | Admin ubah status pesanan → amati customer /myorders | Admin update status | Status badge di kartu pesanan customer berubah otomatis | | |
| **TC-A-SOCK-03** | Update status meja dari admin ke peta meja | Admin konfirmasi pembayaran → lihat /tables | Admin action | Status meja di /tables berubah otomatis (Pending → Available jika tidak ada pesanan lain) | | |
| **TC-A-SOCK-04** | Toggle mute/unmute suara kasir | Klik tombol "Suara: Aktif" di header /orders | Klik | Suara berubah ke "Suara: Mati", toast konfirmasi muncul sekali, preferensi tersimpan di localStorage | | |
| **TC-A-SOCK-05** | Sinkronisasi multi-tab admin | Buka /orders di 2 tab → ubah status di tab 1 | Admin action di tab 1 | Tab 2 otomatis refresh dan menampilkan perubahan | | |
| **TC-A-SOCK-06** | Badge pesanan aktif di sidebar real-time | Dari customer, buat pesanan baru | Pesanan baru | Badge angka di sidebar menu "Semua Pesanan" bertambah secara real-time | | |

---

## Ringkasan Hasil Pengujian Admin Panel

| Modul | Jumlah TC | Valid | Gagal/Bug | Keterangan |
|---|:---:|:---:|:---:|---|
| **1. Autentikasi & RBAC** | 10 | | | |
| **2. Dashboard & Analitik** | 10 | | | |
| **3. Manajemen Pesanan (KDS)** | 16 | | | |
| **4. Kalkulator Kasir & Pembayaran** | 9 | | | |
| **5. Cetak Struk & KOT** | 5 | | | |
| **6. Daftar Menu (CRUD)** | 12 | | | |
| **7. Manajemen Meja & QR** | 9 | | | |
| **8. Kosongkan Meja (Fix)** | 7 | | | |
| **9. Real-Time Socket.IO** | 6 | | | |
| **TOTAL** | **84** | | | |

---

## Daftar Bug Temuan Static Code Analysis

| ID Bug | File | Tingkat | Deskripsi | Status |
|---|---|:---:|---|:---:|
| BUG-A-01 | `Login.jsx` L48-56 | Medium | `result.data?.user?.role` selalu undefined — kasir mungkin redirect ke /dashboard dulu sebelum ke /orders | Perlu konfirmasi |
| BUG-A-02 | `Orders.jsx` L229-234 | Low | `handleCancelOrder` menggunakan `window.confirm()` — inkonsisten dengan UI (seharusnya SweetAlert) | Open |
| BUG-A-03 | `Dashboard.jsx` L23 | Low | `BACKEND_URL` didefinisikan tapi tidak digunakan — dead code | Open |
| BUG-A-04 | `Tables.jsx` | — | Kosongkan Meja menggunakan `axios` yang tidak diimport | ✅ FIXED |

---

## Perbandingan Versi Testing Dokumen Admin

| Modul | Pengujian Awal (Sebelum Perbaikan) | Versi Konsolidasi Lengkap (Tugas Akhir) |
|---|:---:|:---:|
| Autentikasi & RBAC | 6 TC | 10 TC (+4) |
| Manajemen Pesanan | 4 TC | 16 TC (+12) |
| Kasir & Pembayaran | 7 TC | 9 TC (+2) |
| Cetak Struk | 4 TC | 5 TC (+1) |
| Daftar Menu | 4 TC | 12 TC (+8) |
| Manajemen Meja & QR | 3 TC | 9 TC (+6) |
| **Kosongkan Meja (NEW)** | — | 7 TC (baru) |
| Dashboard | 8 TC | 10 TC (+2) |
| Real-Time Socket | 3 TC | 6 TC (+3) |
| **TOTAL** | **43 TC** | **84 TC (+41)** |
