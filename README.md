# ☕ BUJANG CAFE — DIGITAL MENU ORDERING & RESTAURANT POS SYSTEM

[![Test Suite Status](https://img.shields.io/badge/Test_Suite-55%2F55_Passed_(100%25)-success?style=for-the-badge&logo=jest)](tests/reports/index.html)
[![Stack](https://img.shields.io/badge/Stack-React_18_%7C_Node.js_%7C_Express_%7C_MongoDB-blue?style=for-the-badge&logo=react)](SYSTEM_ARCHITECTURE.md)
[![Real-Time](https://img.shields.io/badge/Real--Time-Socket.IO_v4-orange?style=for-the-badge&logo=socketdotio)](SYSTEM_ARCHITECTURE.md)
[![Payment](https://img.shields.io/badge/Payments-Stripe_Gateway_%7C_Cash-purple?style=for-the-badge&logo=stripe)](SYSTEM_ARCHITECTURE.md)
[![Deployment](https://img.shields.io/badge/Deployment-Vercel_Edge_%7C_MongoDB_Atlas-black?style=for-the-badge&logo=vercel)](SYSTEM_ARCHITECTURE.md)

---

## 📌 Ringkasan Proyek

**Bujang Cafe Digital Menu & POS System** adalah aplikasi pemesanan menu digital dan sistem kasir (*Point of Sale*) terintegrasi yang dirancang khusus untuk efisiensi operasional kafe/restoran modern. Sistem ini menggantikan pemesanan kertas konvensional dengan solusi berbasis **QR Code pada Meja Makan**, sinkronisasi **antrean dapur real-time**, pemantauan **okupansi meja**, serta fleksibilitas pembayaran secara **online (Stripe Gateway)** maupun **tunai di kasir**.

Aplikasi ini dikembangkan sebagai karya **Tugas Akhir** rekayasa perangkat lunak dengan standar dokumentasi UML 2.5 lengkap, pengujian *Black-Box Testing*, dan jaminan keandalan piranti lunak melalui *Automated Testing Pyramid* (100% lulus 55 skenario pengujian).

---

## 🚀 Fitur Unggulan Sistem

### 📱 1. Aplikasi Pelanggan (*Customer Web App*)
- **Deteksi Meja Otomatis via QR Code**: Tamu memindai QR Code di meja akrilik (`/?table=X`); nomor meja otomatis tersimpan pada sesi belanja.
- **Katalog Menu Interaktif**: Navigasi kategori makanan/minuman (Salad, Rolls, Deserts, Sandwich, Cake, Pasta, Noodles, dll.) dengan foto berkualitas tinggi dari CDN.
- **Manajemen Keranjang Belanja**: Menambah porsi, mengurangi, serta mencatat instruksi khusus pesanan (misal: *"Es dipisah, sedikit gula"*).
- **Voucher Diskon Promosi**: Integrasi kode promo (contoh: `MERDEKA` diskon 30% atau `SPECIAL20` diskon 20%) dengan kalkulasi otomatis.
- **Metode Pembayaran Fleksibel**:
  - **Online**: Kartu Debit/Kredit & E-Wallet via Stripe Checkout.
  - **Tunai di Kasir**: Penerbitan invoice kasir berawalan `M-` untuk pelunasan langsung di kasir.
- **Pelacakan Status Pesanan Real-Time**: Status pesanan pelanggan otomatis terbarui tanpa reload: *Menunggu → Dimasak 🍳 → Disajikan 🍽️ → Selesai*.

### 🖥️ 2. Panel Kasir, Dapur & Manajer (*Admin & POS Web App*)
- **Pemberitahuan Suara Real-Time (Socket.IO)**: Audio alert (*ding!*) berbunyi seketika saat pesanan baru masuk dari meja manapun.
- **Manajemen Denah & Okupansi Meja (Floor Management)**:
  - Indikator warna dinamis: **Hijau** (Kosong/Available), **Kuning** (Menunggu/Pending), **Orange** (Dimasak/Cooking), dan **Biru** (Makan/Dining).
  - Penghitung durasi santap tamu (*dining timer*) otomatis.
  - **Fitur 1-Click Kosongkan Meja**: Tombol sapu (`🧹 Kosongkan Meja`) untuk menyelesaikan seluruh transaksi aktif dan mereset status meja secara instan.
  - **Fitur Undo (5 Detik)**: Tombol *"Urungkan"* pada toast notifikasi jika kasir tidak sengaja mengosongkan meja.
  - Generator & Cetak Stand Akrilik QR Code per nomor meja.
- **Kasir & Pelunasan Tunai**:
  - Modal penerimaan uang tunai dengan kalkulasi uang kembalian (*change*) real-time.
  - Pencetakan struk transaksi resmi (*Thermal Receipt*).
- **Layar Antrean Dapur (*Kitchen Display System*)**:
  - Filter antrean masak khusus staf dapur.
  - Satu klik transisi status: *"Mulai Masak"* → *"Siap Disajikan"*.
- **Pengelolaan Katalog Menu (Khusus Manajer)**:
  - Tambah/edit menu dengan unggah foto langsung ke Cloud Storage Cloudinary.
  - **Toggle Ketersediaan Stok**: Sakelar instan untuk menandai bahan makanan dapur habis (*Out of Stock*), otomatis menonaktifkan tombol beli di pelanggan.
  - Keamanan berbasis peran (*RBAC*): Hak akses kasir dibatasi sehingga tidak dapat menghapus menu atau mengakses laporan keuangan manajer.

---

## 🏛️ Arsitektur & Teknologi

| Lapisan Sistem | Teknologi / Framework | Peran & Tanggung Jawab |
| :--- | :--- | :--- |
| **Frontend Klien** | React 18, Vite, React Router, Context API | Antarmuka interaktif responsif pelanggan (*Mobile-First*) |
| **Frontend Admin / POS** | React 19/18, Vite, React-Toastify, React-Icons | Dasbor kasir, denah meja, antrean dapur, dan kelola menu |
| **Backend API** | Node.js, Express.js | REST API Controller, JWT Auth, RBAC Middleware, CORS |
| **Real-Time Engine** | Socket.IO v4 (WebSocket) | Penyiaran instan status pesanan, notifikasi audio, okupansi meja |
| **Basis Data** | MongoDB Atlas, Mongoose ODM | Penyimpanan dokumen pengguna, menu, pesanan, dan transaksi |
| **Payment Gateway** | Stripe API (Node.js SDK) | Pemrosesan transaksi kartu debit/kredit berstandar PCI-DSS |
| **Media Cloud Storage** | Cloudinary CDN, Multer | Kompresi cerdas dan distribusi foto hidangan berkecepatan tinggi |
| **Testing Automation** | Jest, Supertest, Playwright, MongoMemoryServer | Pengujian piramida QA otomatis (Unit, API, E2E) |

---

## 📂 Struktur Direktori Proyek

```plaintext
menu-ordering-app-deploy/
├── admin/                      # Single Page Application Panel Admin, Kasir & Dapur (React + Vite)
│   ├── src/pages/              # Halaman: Tables, Orders, Add, List, Login
│   └── src/components/         # Komponen: Navbar, Sidebar, QRModal
├── backend/                    # REST API Server & Socket.IO Engine (Node.js + Express)
│   ├── config/                 # Koneksi Basis Data MongoDB
│   ├── controllers/            # Logika Bisnis: orderController, userController, foodController, cartController
│   ├── middleware/             # AuthMiddleware (JWT) & RBAC (requireRoles)
│   ├── models/                 # Skema Mongoose: userModel, foodModel, orderModel
│   └── routes/                 # Express Routers: /api/food, /api/user, /api/cart, /api/order
├── frontend/                   # Single Page Application Khusus Pelanggan (React + Vite)
│   ├── src/pages/              # Halaman: Home, Cart, PlaceOrder, Verify, MyOrders
│   └── src/components/         # Komponen: FoodDisplay, Navbar, LoginPopup, Footer
├── tests/                      # Suite Pengujian Otomatis (QA Testing Pyramid)
│   ├── unit/                   # Pengujian Logika Unit (Jest)
│   ├── api/                    # Pengujian Integrasi REST API (Supertest + MongoMemoryServer)
│   ├── e2e/                    # Pengujian End-to-End Browser Nyata (Playwright + Chrome)
│   └── reports/                # Laporan Hasil Uji Interaktif (index.html)
├── scripts/                    # Skrip Master Test Runner (run-all-tests.js)
├── README.md                   # Panduan Utama Dokumentasi Repositori
├── USE_CASE_DIAGRAM.md         # Spesifikasi 28 Use Case & 4 Aktor UML 2.5
├── CLASS_DIAGRAM.md            # Spesifikasi Skema Data & Arsitektur Kelas UML 2.5
├── ACTIVITY_DIAGRAM.md         # Spesifikasi 4 Alur Kerja Dinamis Swimlanes UML 2.5
├── SYSTEM_ARCHITECTURE.md      # Spesifikasi Multi-Tier, Event-Driven & Deployment Cloud
├── BLACK_BOX_TESTING_ADMIN.md  # 84 Skenario Uji Fungsional Manual Panel Staf
├── BLACK_BOX_TESTING_CUSTOMER.md # 54 Skenario Uji Fungsional Manual Pelanggan
└── TESTING_SUMMARY.md          # Ringkasan Matriks Pengujian & Catatan Perbaikan Bug
```

---

## 🛠️ Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat Sistem
- **Node.js**: Versi 18.x atau lebih baru ([Unduh Node.js](https://nodejs.org/))
- **NPM**: Versi 9.x atau lebih baru
- **Google Chrome**: Terpasang di sistem (untuk eksekusi uji E2E Playwright)
- **Koneksi Internet**: Untuk akses MongoDB Atlas, Stripe API, dan CDN Cloudinary

---

### 2. Konfigurasi Variabel Lingkungan (`.env`)

#### A. Backend (`backend/.env`)
Salin atau buat berkas `.env` di dalam folder `backend/`:
```env
PORT=4000
NODE_ENV=development
MONGODB="mongodb+srv://<username>:<password>@cluster0.oam7onx.mongodb.net/food-del"
JWT_SECRET="rahasia_jwt_super_aman"
STRIPE_SECRET_KEY="sk_test_..."
FRONTEND_URL="http://localhost:5173"
ADMIN_URL="http://localhost:5174"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
MANAGER_EMAIL="manager@bujangcafe.com"
MANAGER_PASSWORD="manager12345"
KASIR_EMAIL="kasir@bujangcafe.com"
```

#### B. Frontend Pelanggan (`frontend/.env`)
```env
VITE_API_URL="http://localhost:4000"
```

#### C. Admin & POS Panel (`admin/.env`)
```env
VITE_API_URL="http://localhost:4000"
```

---

### 3. Menjalankan Aplikasi di Lingkungan Lokal

Buka 3 terminal terpisah untuk menjalankan seluruh layanan secara bersamaan:

```bash
# Terminal 1: Jalankan Backend API Server (Port 4000)
cd backend
npm install
npm run server

# Terminal 2: Jalankan Frontend Pelanggan (Port 5173)
cd frontend
npm install
npm run dev

# Terminal 3: Jalankan Admin & POS Panel (Port 5174)
cd admin
npm install
npm run dev
```

Akses aplikasi melalui peramban:
- **Aplikasi Pelanggan**: [http://localhost:5173](http://localhost:5173) (atau dengan simulasi meja: [http://localhost:5173/?table=3](http://localhost:5173/?table=3))
- **Panel Kasir & Admin POS**: [http://localhost:5174](http://localhost:5174)
- **Status API Backend**: [http://localhost:4000](http://localhost:4000)

---

## 👥 Akun Uji Coba Bawaan (*Demo Credentials*)

Untuk memudahkan pengujian fungsionalitas dan demonstrasi peran, gunakan akun staf bawaan berikut pada halaman login Admin POS ([http://localhost:5174/login](http://localhost:5174/login)):

| Peran (*Role*) | Alamat Email | Kata Sandi | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **Manajer Restoran** | `manager@bujangcafe.com` | `manager12345` | Akses penuh (Denah Meja, POS Kasir, Dapur, Tambah/Hapus Menu, Laporan Keuangan) |
| **Kasir POS** | `kasir@bujangcafe.com` | `kasir12345` | Akses Denah Meja, Pelunasan Tunai, Cetak Struk, 1-Click Kosongkan Meja, Toggle Stok Dapur |
| **Pelanggan Umum** | *Registrasi mandiri di aplikasi pelanggan* | Bebas (min. 8 karakter) | Buka menu, tambah keranjang, input voucher, dan checkout pesanan |

---

## 🧪 Pengujian Piranti Lunak (*Automated Testing Suite*)

Repositori ini telah dilengkapi dengan suite pengujian otomatis menyeluruh (*Testing Pyramid*) yang dapat dijalankan langsung dari direktori root:

```bash
# Jalankan SELURUH suite pengujian (Unit + API + E2E) & kompilasi laporan HTML:
npm run test:all
```

Perintah individual per tingkatan uji:
```bash
# 1. Menjalankan Unit Testing saja (Jest - 20 test cases):
npm run test:unit

# 2. Menjalankan API Integration Testing saja (Supertest + In-Memory MongoDB - 22 test cases):
npm run test:api

# 3. Menjalankan End-to-End Testing saja (Playwright Browser - 13 test cases):
npm run test:e2e
```

### 📊 Laporan Hasil Pengujian Interaktif
Setelah eksekusi selesai, buka laporan pengujian visual interaktif pada peramban Anda:
👉 **[tests/reports/index.html](tests/reports/index.html)**

*Statistik Pengujian: **55 Test Cases | 55 Passed (100% Success Rate) | 0 Failed**.*

---

## 📚 Indeks Dokumentasi Rekayasa Perangkat Lunak (Tugas Akhir)

Dokumentasi lengkap analisis, perancangan, dan pengujian sistem disusun dalam berkas-berkas terpisah berstandar akademik berikut:

| No | Dokumen Rekayasa Perangkat Lunak | Tautan Berkas | Deskripsi Singkat |
| :---: | :--- | :--- | :--- |
| 1 | **Arsitektur Sistem & Infrastruktur** | **[SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)** | Pemodelan 4-Tier, alur WebSocket real-time Socket.IO, topologi cloud, dan analisis kualitas (NFR). |
| 2 | **Activity Diagram (UML 2.5)** | **[ACTIVITY_DIAGRAM.md](ACTIVITY_DIAGRAM.md)** | 4 Diagram alir berpartisi swimlanes (Pelanggan, Dapur, Kasir 1-Click Meja, & Manajer). |
| 3 | **Class Diagram (UML 2.5)** | **[CLASS_DIAGRAM.md](CLASS_DIAGRAM.md)** | Struktur kelas entitas domain, relasi komposisi OrderItem, dan arsitektur kelas MVC Express. |
| 4 | **Use Case Diagram (UML 2.5)** | **[USE_CASE_DIAGRAM.md](USE_CASE_DIAGRAM.md)** | Pemodelan 28 use case fungsional, 4 aktor pengguna, relasi `<<include>>` dan `<<extend>>`. |
| 5 | **Black-Box Testing Admin & POS** | **[BLACK_BOX_TESTING_ADMIN.md](BLACK_BOX_TESTING_ADMIN.md)** | 84 skenario uji manual modul kasir, denah meja (termasuk verifikasi Kosongkan Meja), dan menu. |
| 6 | **Black-Box Testing Customer** | **[BLACK_BOX_TESTING_CUSTOMER.md](BLACK_BOX_TESTING_CUSTOMER.md)** | 54 skenario uji manual antarmuka pelanggan (QR scanner, keranjang belanja, diskon voucher, & checkout). |
| 7 | **Ringkasan Pengujian & Solusi Bug** | **[TESTING_SUMMARY.md](TESTING_SUMMARY.md)** | Matriks perbandingan pengujian manual vs otomatis, daftar penemuan bug, dan verifikasi perbaikannya. |

---

## 📄 Lisensi & Hak Cipta
Hak Cipta © 2026 Mahasiswa Tugas Akhir. Seluruh kode sumber dan aset dokumentasi dilindungi untuk keperluan akademis dan pengembangan sistem restoran Bujang Cafe.
