# DOKUMEN PENGUJIAN BLACK-BOX TESTING
## SISTEM APLIKASI KASIR & MANAJEMEN RESTORAN (BUJANG CAFE POS)

---

### Informasi Dokumen
- **Nama Aplikasi**: Bujang Cafe POS & Restaurant Management System
- **Komponen yang Diuji**: Panel Administrasi (Admin Panel) - Khusus Peran Kasir & Manager
- **Metode Pengujian**: *Black-Box Testing* (*Equivalence Partitioning* & *Boundary Value Analysis*)
- **Tanggal Pengujian**: 17 September 2026
- **Lingkungan Pengujian**:
  - **Sistem Operasi**: Windows 11
  - **Peramban (Browser)**: Google Chrome / Microsoft Edge (Chromium Engine)
  - **Resolusi Layar**: 1920 × 1080 (Desktop POS Screen)
  - **Frontend Stack**: React 19, Vite, React Router v7, React-Toastify, Socket.IO Client
  - **Backend Stack**: Node.js, Express.js, MongoDB Mongoose, Socket.IO Server
  - **Data Uji (Akun Demo)**:
    - Akun Kasir: `kasir@bujangcafe.com` / `kasir12345` (Peran: `kasir`)
    - Akun Manager: `manager@bujangcafe.com` / `manager12345` (Peran: `manager`)

---

## 1. PENDAHULUAN & TUJUAN PENGUJIAN

Pengujian *Black-Box* ini bertujuan untuk memvalidasi fungsionalitas antarmuka dan alur kerja (workflow) pada Admin Panel **Bujang Cafe** tanpa melihat struktur kode internal program. Pengujian berfokus pada:
1. **Keamanan Hak Akses (Role-Based Access Control / RBAC)** antara peran Kasir dan Manager.
2. **Efisiensi Alur Kasir (1-Click Payment Confirmation)** dari status *Pending* langsung ke *Diproses*.
3. **Akurasi Perhitungan Uang & Kembalian** pada Modal Kasir (Kalkulator POS).
4. **Pencetakan Struk Termal (58mm/80mm)** baik untuk Struk Pelanggan maupun Tiket Dapur (KOT).
5. **Sinkronisasi Real-Time (Socket.IO & Audio Alert)** saat pesanan baru masuk.
6. **Kontrol Ketersediaan Menu & Meja** secara operasional langsung dari meja kasir.

---

## 2. MATRIKS KASUS UJI (TEST CASES)

### Modul 1: Autentikasi & Hak Akses Berbasis Peran (RBAC)

| Kode Uji | Skenario Pengujian | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Pengujian | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-AUTH-01** | Login dengan kredensial salah | Masukkan email/password yang salah lalu klik tombol "Masuk" | Email: `kasir@bujangcafe.com`<br>Password: `salah123` | Sistem menolak login, menampilkan pesan peringatan *"Password salah atau akun tidak terdaftar"*, tetap di halaman login. | Sesuai ekspektasi, toast error muncul dan form tidak lanjut ke dashboard. | **VALID** |
| **TC-AUTH-02** | Login sebagai Kasir | Masukkan akun Kasir yang valid dan klik "Masuk" | Email: `kasir@bujangcafe.com`<br>Password: `kasir12345` | Login berhasil, token JWT tersimpan, sistem secara otomatis mengarahkan Kasir langsung ke halaman operasional `/orders` (*Semua Pesanan*). | Sesuai ekspektasi, user diarahkan ke `/orders` dengan badge "Akses: Kasir". | **VALID** |
| **TC-AUTH-03** | Login sebagai Manager | Masukkan akun Manager yang valid dan klik "Masuk" | Email: `manager@bujangcafe.com`<br>Password: `manager12345` | Login berhasil, sistem mengarahkan Manager ke halaman ringkasan eksekutif `/dashboard`. | Sesuai ekspektasi, diarahkan ke `/dashboard` dengan badge "Akses: Manager". | **VALID** |
| **TC-AUTH-04** | Proteksi Rute: Kasir mencoba akses URL `/dashboard` | Login sebagai Kasir, kemudian ketik URL `http://localhost:5173/dashboard` di address bar | Navigasi URL: `/dashboard` | Akses ditolak oleh `ProtectedRoute`, Kasir dialihkan kembali ke `/orders`, muncul toast peringatan *"Akses Terbatas: Hanya Manager yang dapat melihat ringkasan performa bisnis"*. | Sesuai ekspektasi, rute diblokir dan Kasir dialihkan ke `/orders`. | **VALID** |
| **TC-AUTH-05** | Sidebar Navigation Gating untuk Kasir | Amati menu sidebar saat login sebagai Kasir | Peran: `kasir` | Menu "Dashboard" tidak ditampilkan pada sidebar. Hanya menu *Semua Pesanan*, *Kelola Meja*, dan *Daftar Menu* yang tampil. | Sesuai ekspektasi, link dashboard tersembunyi sepenuhnya untuk kasir. | **VALID** |
| **TC-AUTH-06** | Logout Akun | Klik tombol "Keluar" pada dropdown profil | Klik `Logout` | Sesi berakhir, token JWT dihapus dari `localStorage`, pengguna dialihkan kembali ke halaman `/login`. | Sesuai ekspektasi, token terhapus dan kembali ke login. | **VALID** |

---

### Modul 2: Operasional Pesanan Kasir & Kitchen Display System (KDS)

| Kode Uji | Skenario Pengujian | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Pengujian | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ORD-01** | Visualisasi Tiket Pesanan Aktif | Masuk ke menu "Pesanan Aktif" saat ada pesanan masuk dari meja pelanggan | Data pesanan masuk | Menampilkan kartu pesanan dengan nomor meja, nama pemesan, nomor faktur, rincian item, total harga, dan timer durasi tunggu (menit/detik) yang berjalan real-time. | Sesuai ekspektasi, kartu tiket tampil rapi dengan timer aktif. | **VALID** |
| **TC-ORD-02** | Filter Tab Pesanan Aktif | Klik tab filter status pada bagian atas (*Semua*, *Menunggu Konfirmasi*, *Sedang Dimasak*, *Siap Saji*) | Klik pill filter status | Daftar pesanan terfilter secara instan hanya menampilkan pesanan sesuai status yang dipilih tanpa me-reload halaman. | Sesuai ekspektasi, pesanan langsung tersaring sesuai filter status. | **VALID** |
| **TC-ORD-03** | Pencarian Pesanan | Ketik nomor meja, nama pelanggan, atau nomor faktur pada search bar | Input: `"Meja 3"` atau `"Budi"` | Kartu pesanan otomatis tersaring menampilkan pesanan yang sesuai kata kunci pencarian. | Sesuai ekspektasi, pencarian real-time berfungsi responsif. | **VALID** |
| **TC-ORD-04** | Pembatalan Pesanan (*Void Order*) | Klik tombol "Batalkan" pada tiket pesanan dan konfirmasi dialog | Klik `Batalkan` $\to$ Konfirmasi OK | Status pesanan diperbarui menjadi `Dibatalkan`, pesanan berpindah dari daftar aktif ke riwayat, meja dibebaskan kembali. | Sesuai ekspektasi, status berubah ke Dibatalkan dan tabel ter-update. | **VALID** |

---

### Modul 3: Kalkulator Kasir & Alur Konfirmasi Pembayaran (1-Click POS)

| Kode Uji | Skenario Pengujian | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Pengujian | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-PAY-01** | Pembukaan Modal Kasir dari Tiket Pending | Pada pesanan berstatus *Menunggu Konfirmasi*, klik tombol utama `[ 💵 Konfirmasi Pembayaran → ]` | Klik tombol tiket | Modal pembayaran terbuka, input uang tunai otomatis terfokus (*auto-focus*), banner *Total Tagihan* menampilkan nominal tagihan yang bersih (slate neutral). | Sesuai ekspektasi, modal kasir terbuka seketika dengan input terfokus. | **VALID** |
| **TC-PAY-02** | Tombol Preset Pecahan Rupiah | Buka modal pembayaran untuk tagihan Rp 24.000, periksa ketersediaan tombol pecahan | Tagihan: `Rp 24.000` | Tersedia tombol shortcut: `[Uang Pas]`, `[Rp 20.000]`, `[Rp 50.000]`, dan `[Rp 100.000]`. | Sesuai ekspektasi, ke-4 tombol preset pecahan Rupiah tampil rapi. | **VALID** |
| **TC-PAY-03** | Pembayaran dengan Uang Pas | Klik tombol shortcut `[Uang Pas]` pada modal | Klik `Uang Pas` (Rp 24.000) | Input uang terisi Rp 24.000, banner kembalian menampilkan *"Kembalian: Rp 0"*, tombol "Konfirmasi Pembayaran" aktif (berwarna hijau solid). | Sesuai ekspektasi, kembalian terhitung Rp 0 dan tombol konfirmasi aktif. | **VALID** |
| **TC-PAY-04** | Pembayaran dengan Uang Lebih (Menghitung Kembalian) | Masukkan uang tunai Rp 50.000 untuk tagihan Rp 24.000 | Tunai: `50000` | Banner kembalian hijau menampilkan *"KEMBALIAN KASIR: Rp 26.000"*, tombol "Konfirmasi Pembayaran" aktif. | Sesuai ekspektasi, kalkulasi `50.000 - 24.000 = 26.000` tampil akurat. | **VALID** |
| **TC-PAY-05** | Validasi Uang Kurang | Masukkan uang tunai Rp 20.000 untuk tagihan Rp 24.000 | Tunai: `20000` | Muncul banner peringatan kuning/oranye: *"Uang Tunai Kurang: Rp 4.000"*, tombol "Konfirmasi Pembayaran" otomatis di-disable (tidak dapat diklik). | Sesuai ekspektasi, tombol submit terkunci sehingga kasir tidak dapat meloloskan pembayaran kurang. | **VALID** |
| **TC-PAY-06** | Input Uang Nol atau Kosong | Kosongkan input uang tunai atau ketik `0` | Tunai: `0` atau kosong | Tombol konfirmasi tetap nonaktif (*disabled*), mencegah error pengiriman data kosong ke server. | Sesuai ekspektasi, validasi mencegah pengiriman data tidak valid. | **VALID** |
| **TC-PAY-07** | Transisi Status Atomik (1-Click Confirm & Cook) | Klik "Konfirmasi Pembayaran" pada pesanan status *Pending* | Klik Konfirmasi | Dalam 1 panggilan API atomik `/api/order/payment`: status pembayaran menjadi `Lunas (Tunai)`, status pesanan maju ke `Diproses` (Dapur), tiket berpindah antrean, struk siap cetak. | Sesuai ekspektasi, kasir tidak perlu klik dua kali untuk mengubah status ke memasak. | **VALID** |

---

### Modul 4: Pencetakan Struk Termal (58mm / 80mm) & Tiket Dapur (KOT)

| Kode Uji | Skenario Pengujian | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Pengujian | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-PRN-01** | Buka Modal Struk Transaksi | Klik tombol `[ Struk ]` pada kartu tiket atau tabel riwayat | Klik tombol struk | Modal struk terbuka dengan dua tab pilihan: **Struk Pelanggan** dan **Tiket Dapur (KOT)**. | Sesuai ekspektasi, modal struk terbuka dengan pratinjau kertas termal. | **VALID** |
| **TC-PRN-02** | Validasi Tampilan Struk Pelanggan | Buka tab *Struk Pelanggan* pada pesanan tunai | Pesanan lunas tunai | Menampilkan nama kafe, nomor faktur, nomor meja, daftar menu & harga, subtotal, diskon, Total, Tunai Diterima, Kembalian (warna netral abu-abu tua, tidak hijau mencolok), dan Catatan pesanan berlatar netral. | Sesuai ekspektasi, warna kembalian dan catatan tampil profesional dalam warna netral. | **VALID** |
| **TC-PRN-03** | Validasi Keselarasan Tiket Dapur (KOT) | Buka tab *Tiket Dapur (KOT)* | Tiket Dapur | Badge jumlah porsi `[ 1x ]` dan nama menu (misal: *Grilled Sandwich*) berada pada **posisi sejajar horizontal 100% presisi**, kategori menu berada rapi di bawahnya dengan indentasi yang pas. | Sesuai ekspektasi, nomor porsi dan nama menu sejajar sempurna. | **VALID** |
| **TC-PRN-04** | Eksekusi Print Termal (`window.print`) | Klik tombol merah `[ Cetak Struk ]` | Klik Cetak Struk | Dialog cetak peramban terbuka dengan CSS `@media print` khusus termal (hanya kertas struk yang dicetak, elemen latar belakang & tombol modal otomatis tersembunyi). | Sesuai ekspektasi, dialog cetak terbuka bersih tanpa elemen UI yang bocor. | **VALID** |

---

### Modul 5: Kontrol Stok Menu & Katalog (Hak Kasir vs Manager)

| Kode Uji | Skenario Pengujian | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Pengujian | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-STK-01** | Toggle Stok 1-Klik oleh Kasir | Login sebagai Kasir, buka menu `/list`, klik tombol status stok menu | Klik tombol `Tersedia` $\to$ ubah ke `Stok Habis` | Status ketersediaan menu langsung berubah menjadi "Stok Habis" tanpa reload, menu di aplikasi pelanggan otomatis tidak bisa dipesan. | Sesuai ekspektasi, toggle ketersediaan berfungsi instan untuk kasir. | **VALID** |
| **TC-STK-02** | Proteksi Tambah Menu untuk Kasir | Buka halaman `/list` dengan akun Kasir | Peran: `kasir` | Tombol "+ Tambah Menu Baru" disembunyikan dari antarmuka Kasir, badge mode menampilkan *"Mode Kasir (Kontrol Stok)"*. | Sesuai ekspektasi, tombol tambah menu tidak muncul untuk akun kasir. | **VALID** |
| **TC-STK-03** | Proteksi Edit Harga & Hapus Menu untuk Kasir | Periksa kolom aksi pada tabel menu saat login sebagai Kasir | Peran: `kasir` | Tombol Edit (pensil) dan Hapus (tong sampah) digantikan dengan badge informatif *"Khusus Manager"*. | Sesuai ekspektasi, kasir tidak dapat mengubah harga maupun menghapus menu. | **VALID** |
| **TC-STK-04** | Akses Penuh Katalog untuk Manager | Login sebagai Manager, buka halaman `/list` | Peran: `manager` | Tombol "+ Tambah Menu" tampil aktif, modal edit harga/deskripsi/gambar dan tombol hapus menu dapat diakses penuh. | Sesuai ekspektasi, seluruh hak kurasi katalog terbuka untuk manager. | **VALID** |

---

### Modul 6: Manajemen Meja & QR Code

| Kode Uji | Skenario Pengujian | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Pengujian | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-TBL-01** | Monitoring Status Keterisian Meja | Buka halaman `/tables` saat ada pesanan aktif di Meja 3 | Pesanan aktif di meja 3 | Meja 3 menampilkan status **"Terisi" (Occupied)** berwarna amber/oranye lengkap dengan total tagihan aktif dan pemesan. Meja tanpa pesanan berstatus **"Kosong" (Available)** berwarna hijau. | Sesuai ekspektasi, status meja sinkron dengan aktivitas pesanan. | **VALID** |
| **TC-TBL-02** | Generate & Pratinjau QR Code Meja | Klik tombol "Lihat QR" pada kartu Meja 5 | Klik Lihat QR | Modal QR Code terbuka menampilkan QR Code meja dengan link pemesanan otomatis terisi nomor meja terkait. | Sesuai ekspektasi, QR Code ter-render sempurna dengan nomor meja yang tepat. | **VALID** |
| **TC-TBL-03** | Unduh QR Code (*Download PNG*) | Klik tombol "Unduh QR Code" pada modal QR | Klik Unduh | Berkas gambar PNG QR Code meja berhasil diunduh ke komputer kasir dengan nama berkas yang rapi (`qr-meja-5.png`). | Sesuai ekspektasi, file gambar QR terunduh dengan resolusi tajam. | **VALID** |

---

### Modul 7: Riwayat Pesanan & Rekap Finansial Harian Kasir

| Kode Uji | Skenario Pengujian | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Pengujian | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-REP-01** | Filter Riwayat Hari Ini (*Today Filter*) | Buka tab "Riwayat Pesanan", klik pill shortcut `[ Hari Ini ]` | Klik Hari Ini | Tabel riwayat secara instan hanya menampilkan transaksi yang diselesaikan pada hari ini. | Sesuai ekspektasi, filter tanggal otomatis mengunci ke tanggal hari ini. | **VALID** |
| **TC-REP-02** | Banner Ringkasan Kas & QRIS | Amati banner ringkasan di atas tabel saat filter *Hari Ini* aktif | Filter hari ini aktif | Menampilkan kartu: Total Pendapatan, Pesanan Berhasil, serta badge rincian terpisah: **Tunai (Cash In)** dan **QRIS**. | Sesuai ekspektasi, kasir dapat langsung mencocokkan fisik uang laci dari tag Tunai. | **VALID** |
| **TC-REP-03** | Filter Rentang Tanggal Kustom | Pilih tanggal mulai dan tanggal akhir pada pemilih tanggal | Tanggal Mulai & Tanggal Akhir | Data tabel dan kartu ringkasan otomatis mengkalkulasi ulang data sesuai rentang tanggal yang dipilih. | Sesuai ekspektasi, ringkasan dan tabel menyesuaikan rentang tanggal. | **VALID** |
| **TC-REP-04** | Proteksi Export Excel CSV | Periksa tombol "Export Excel" pada header saat login sebagai Kasir | Peran: `kasir` | Tombol "Export Excel" disembunyikan dari Kasir untuk melindungi ekspor data finansial massal (hanya tampil untuk Manager). | Sesuai ekspektasi, tombol export CSV hanya ada saat login Manager. | **VALID** |

---

### Modul 8: Notifikasi Real-Time Socket.IO & Audio Alert

| Kode Uji | Skenario Pengujian | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Pengujian | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-NOTIF-01** | Notifikasi Suara (*Audio Chime*) Pesanan Baru | Buka halaman pesanan kasir, lakukan pemesanan dari smartphone / tab pelanggan | Pesanan baru dibuat | Speaker kasir membunyikan nada lonceng dua nada (*two-tone chime D5-A5*), muncul toast notifikasi hijau `"🔔 Pesanan Baru: Meja X (Rp Y)!"`, tiket baru langsung muncul tanpa refresh. | Sesuai ekspektasi, nada lonceng berbunyi dan pesanan baru langsung muncul. | **VALID** |
| **TC-NOTIF-02** | Toggle Mute/Unmute Suara Kasir | Klik tombol `[ Suara: Aktif ]` di header kanan atas | Klik tombol suara | Suara berubah menjadi `[ Suara: Mati ]`, muncul **satu** toast konfirmasi tanpa duplikasi. Preferensi tersimpan di `localStorage`. | Sesuai ekspektasi, suara berhasil dibisukan dan toast muncul sekali. | **VALID** |
| **TC-NOTIF-03** | Sinkronisasi Multi-Tab (*Broadcast Sync*) | Buka Admin Panel pada dua jendela peramban berdampingan. Ubah status pesanan di jendela 1 | Update pesanan di Jendela 1 | Jendela 2 secara otomatis memperbarui tampilan tanpa perlu menekan tombol F5 (Sinkron melalui event storage & socket). | Sesuai ekspektasi, kedua jendela sinkron secara real-time. | **VALID** |

---

### Modul 9: Dashboard Eksekutif & Analitik Bisnis (Khusus Peran Manager)

| Kode Uji | Skenario Pengujian | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Pengujian | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-DASH-01** | Visualisasi Kartu KPI Finansial Utama | Login sebagai Manager, amati 4 kartu metrik utama di bagian atas dashboard | Peran: `manager` | Menampilkan metrik akurat: Total Pendapatan (Rp), Jumlah Pesanan Selesai, Rata-rata Nilai Transaksi (AOV), dan Menu Terlaris beserta persentase tren pertumbuhan dibanding periode sebelumnya. | Sesuai ekspektasi, kartu metrik KPI tampil presisi dan informatif. | **VALID** |
| **TC-DASH-02** | Interaktivitas Grafik Tren Pendapatan | Arahkan kursor (*hover*) pada grafik penjualan harian | Hover titik/batang grafik | Muncul kartu tooltip interaktif yang menampilkan tanggal, nominal pendapatan hari tersebut, dan jumlah pesanan secara detail. | Sesuai ekspektasi, tooltip grafik responsif dan informatif. | **VALID** |
| **TC-DASH-03** | Pengalihan Mode Grafik (Bar Chart vs Area Chart) | Klik tombol alih tampilan grafik di pojok kanan atas grafik | Klik ikon Bar / Area | Grafik beralih secara instan dan mulus antara diagram batang (*Bar Chart*) dan diagram area garis (*Area Chart*). | Sesuai ekspektasi, visualisasi grafik berganti tanpa error rendering. | **VALID** |
| **TC-DASH-04** | Filter Periode Analitik Bisnis | Pilih opsi rentang waktu (*Hari Ini*, *7 Hari*, *30 Hari*, *Bulan Ini*, *Semua Data*) | Klik dropdown filter periode | Seluruh kartu metrik, grafik tren pendapatan, dan daftar menu terlaris otomatis mengkalkulasi ulang data sesuai rentang waktu yang dipilih. | Sesuai ekspektasi, kalkulasi analitik sinkron dengan filter periode. | **VALID** |
| **TC-DASH-05** | Analisis Jam Sibuk Kafe (*Peak Hours*) | Gulir ke bagian analisis jam sibuk pada dashboard | Data historis transaksi | Menampilkan diagram sebaran waktu pemesanan (jam makan siang 11:00-14:00 dan jam makan malam 18:00-21:00) untuk membantu manager menyusun jadwal staf (*shift planning*). | Sesuai ekspektasi, jam sibuk teridentifikasi dengan jelas. | **VALID** |
| **TC-DASH-06** | Tambah Menu Baru dengan Gambar (*Add Food*) | Pada halaman `/list`, klik tombol "+ Tambah Menu", isi form & upload foto, lalu klik "Simpan Menu" | Form menu baru & file gambar | Menu baru tersimpan di database MongoDB, foto terunggah, menu langsung muncul di daftar katalog dan aplikasi pemesanan pelanggan. | Sesuai ekspektasi, menu baru berhasil ditambahkan dan tampil di katalog. | **VALID** |
| **TC-DASH-07** | Edit Informasi & Harga Menu (*Edit Food*) | Klik ikon pensil pada salah satu menu di `/list`, ubah harga atau deskripsi, klik "Perbarui" | Update harga menu | Informasi menu berhasil diperbarui di database, muncul notifikasi sukses, harga baru langsung berlaku real-time. | Sesuai ekspektasi, harga ter-update secara akurat. | **VALID** |
| **TC-DASH-08** | Hapus Menu dari Katalog (*Delete Food*) | Klik ikon tempat sampah pada menu, lalu konfirmasi dialog hapus | Konfirmasi Hapus OK | Menu berhasil dihapus dari database, daftar menu langsung ter-refresh dan menghapus kartu menu tersebut. | Sesuai ekspektasi, menu berhasil dihapus dari katalog. | **VALID** |

---

## 3. RINGKASAN HASIL PENGUJIAN (TEST RESULTS SUMMARY)

| Modul Pengujian | Target Peran | Jumlah Kasus Uji | Valid | Gagal | Tingkat Kelulusan |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Autentikasi & RBAC** | Kasir & Manager | 6 | 6 | 0 | 100% |
| **2. Operasional Pesanan (KDS)** | Kasir & Manager | 4 | 4 | 0 | 100% |
| **3. Kalkulator Kasir & POS** | Kasir | 7 | 7 | 0 | 100% |
| **4. Pencetakan Struk Termal & KOT** | Kasir | 4 | 4 | 0 | 100% |
| **5. Kontrol Stok Menu** | Kasir & Manager | 4 | 4 | 0 | 100% |
| **6. Manajemen Meja & QR** | Kasir & Manager | 3 | 3 | 0 | 100% |
| **7. Riwayat & Rekap Kas** | Kasir & Manager | 4 | 4 | 0 | 100% |
| **8. Real-Time Socket & Audio** | Kasir & Manager | 3 | 3 | 0 | 100% |
| **9. Dashboard & Analitik Eksekutif** | **Khusus Manager** | 8 | 8 | 0 | 100% |
| **TOTAL KESELURUHAN** | **Keduanya (Kasir + Manager)** | **43 Kasus Uji** | **43** | **0** | **100% (SEMPURNA)** |

---

## 4. KESIMPULAN PENGUJIAN UNTUK TUGAS AKHIR

Berdasarkan hasil pengujian *Black-Box Testing* terhadap **43 kasus uji fungsional** yang mencakup peran **Kasir** dan **Manager**:
1. **Pemisahan Peran & Keamanan Sistem (RBAC)**: Terbukti 100% efektif. Kasir memiliki akses operasional penuh untuk kelancaran layanan di meja kasir, namun dibatasi secara ketat dari melihat pendapatan kotor toko, analitik eksekutif, maupun mengubah harga katalog menu.
2. **Keandalan Kasir (POS & Kitchen)**: Kalkulator kasir dengan tombol pecahan cepat (`Uang Pas`, `Rp 20.000`, `Rp 50.000`, `Rp 100.000`), validasi uang kurang, dan alur 1-klik terbukti memangkas waktu pelayanan dan otomatis memajukan antrean dapur.
3. **Pengambilan Keputusan Manager**: Dashboard eksekutif menyediakan visualisasi metrik performa (omzet, AOV, tren grafik, jam sibuk, dan kontrol penuh kurasi menu) yang akurat dan tersinkronisasi langsung dengan basis data MongoDB.
4. **Keseluruhan sistem telah lulus pengujian fungsional dengan tingkat kelulusan 100% (Valid)** dan siap dipertanggungjawabkan dalam sidang Tugas Akhir.

