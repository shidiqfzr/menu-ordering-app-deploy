# DOKUMEN ACTIVITY DIAGRAM & SPESIFIKASI ALUR KERJA SISTEM
## SISTEM APLIKASI PEMESANAN MENU & POS RESTORAN (BUJANG CAFE)

---

### Informasi Dokumen
- **Judul Proyek**: Sistem Informasi Pemesanan Menu Digital & Point of Sale (POS) Bujang Cafe
- **Penyusun**: Mahasiswa Tugas Akhir
- **Standar Pemodelan**: Unified Modeling Language (UML 2.5)
- **Tingkat Diagram**: Business Process & System Dynamic Workflow with Swimlanes (Partitioning)
- **Tanggal Rilis**: 27 September 2026
- **Status**: Final Disetujui

---

## 1. PENDAHULUAN

Activity Diagram adalah diagram perilaku (*behavioral diagram*) dalam UML yang menggambarkan alur kerja (*workflow*) berurutan, percabangan keputusan (*decision*), penggabungan alur (*merge*), konkurensi/paralelisme (*fork & join*), serta pembagian tanggung jawab antar entitas sistem menggunakan jalur renang (*swimlanes/partitions*).

Pada sistem **Bujang Cafe POS & Restoran**, pemodelan aktivitas disusun ke dalam **4 Alur Proses Bisnis Utama**:
1. **Activity Diagram 1: Alur Pemesanan Menu & Checkout oleh Pelanggan** (Mendukung Pembayaran Online Stripe & Tunai di Kasir).
2. **Activity Diagram 2: Alur Pemrosesan Pesanan Dapur & Penyajian** (Siklus Status Masak, Sajikan, hingga Update Meja).
3. **Activity Diagram 3: Alur Kasir, Pelunasan Tunai, & Okupansi Meja** (Mencakup Fitur Unggulan *1-Click Kosongkan Meja* & *Undo*).
4. **Activity Diagram 4: Alur Manajemen Katalog Menu & Ketersediaan Stok oleh Manajer** (Integrasi Cloudinary & Penyesuaian Real-time).

---

## 2. NOTASI STANDAR UML 2.5 PADA ACTIVITY DIAGRAM

| Simbol / Notasi | Nama Simbol | Deskripsi & Fungsi |
| :---: | :--- | :--- |
| `((●))` | **Initial Node** | Titik awal dimulainya suatu alur kerja atau skenario aktivitas. |
| `(((●)))` | **Activity Final Node** | Titik akhir pemberhentian seluruh alur kerja dalam diagram. |
| `[Aktivitas]` | **Action / Activity** | Tindakan komputasi atau aktivitas yang dilakukan oleh aktor/sistem. |
| `◇` | **Decision Node** | Titik percabangan yang memiliki satu masukan dan beberapa keluaran berlabel kondisi (*guard condition*). |
| `◇` | **Merge Node** | Titik penggabungan beberapa alur alternatif kembali menjadi satu alur utama. |
| `====` | **Fork Node** | Memecah satu aliran kontrol menjadi dua atau lebih aliran yang berjalan secara simultan (paralel). |
| `====` | **Join Node** | Menyatukan kembali aliran-aliran paralel sebelum melangkah ke aktivitas berikutnya. |
| `|Swimlane|` | **Partition / Swimlane** | Mengelompokkan aktivitas berdasarkan aktor penanggung jawab atau komponen subsistem. |

---

## 3. DIAGRAM 1: ALUR PEMESANAN MENU & CHECKOUT OLEH PELANGGAN

Diagram ini memodelkan proses dari awal tamu memindai QR Code di meja atau membuka web browser, memilih hidangan, menerapkan voucher promo, hingga melakukan pelunasan tagihan baik melalui **Stripe Payment Gateway** maupun **Pembayaran Tunai di Kasir**.

```mermaid
flowchart TD
    %% ──────────────────────────────────────────────────────────
    %% SWIMLANES (PARTITIONS)
    %% ──────────────────────────────────────────────────────────
    subgraph CUST ["👤 PELANGGAN"]
        Start1((●)) --> A1["Scan QR Meja / Akses URL"]
        A1 --> A2["Jelajahi Menu & Pilih Kategori"]
        A2 --> A3["Klik Tambah Menu ke Keranjang"]
        A3 --> A4["Buka Halaman Keranjang Belanja"]
        A4 --> A5{"Gunakan Kode Promo?"}
        A5 -- Ya --> A6["Input Kode Promo (misal: MERDEKA)"]
        A5 -- Tidak --> A8["Periksa Ringkasan Tagihan & Catatan"]
        A6 --> A7["Klik 'Gunakan Voucher'"]
        A7 --> A8
        A8 --> A9["Pilih Meja & Metode Bayar"]
        A9 --> D1{"Metode Pembayaran?"}
        
        %% Cabang Online
        D1 -- "Online (Stripe)" --> A10["Klik 'Lanjut ke Pembayaran'"]
        A10 --> A11["Dialihkan ke Formulir Checkout Stripe"]
        A11 --> A12["Input Rincian Kartu / E-Wallet & Bayar"]
        
        %% Cabang Tunai
        D1 -- "Tunai di Kasir" --> A13["Pilih Bayar Tunai di Kasir"]
        A13 --> A14["Klik 'Pesan Sekarang'"]
        
        %% Hasil Akhir
        A15["Menerima Struk Digital & Invoice E-XXXX"]
        A16["Menerima Bukti Tiket Kasir & Invoice M-XXXX"]
        A17["Menunggu Makanan Disajikan di Meja"]
        End1(((●)))
        EndFail(((⊗)))
    end

    subgraph FE_CUST ["💻 FRONTEND PELANGGAN (React)"]
        A1 -.-> F1["Deteksi Parameter '?table=X' & Simpan"]
        A3 -.-> F2["Update cartData State & Badge Header"]
        A7 -.-> F3["Hitung Estimasi Diskon di Sisi Klien"]
        A10 -.-> F4["POST /api/order/place (Payload Order)"]
        A14 -.-> F5["POST /api/order/manual (Payload Tunai)"]
        A12 -.-> F6["Redirect ke /verify?success=true/false"]
        F6 --> D2{"Status Sukses?"}
        D2 -- Ya --> F7["Tampilkan Halaman Sukses Pesanan"]
        D2 -- Gagal --> F8["Tampilkan Notifikasi Pembayaran Batal"]
        F7 -.-> A15
        F8 -.-> EndFail
    end

    subgraph BE_SYS ["⚙️ BACKEND API & MONGODB"]
        F4 --> B1["Validasi JWT Token & Data Keranjang"]
        B1 --> B2["Generate Invoice 'E-YYYYMMDD-XXXX'"]
        B2 --> B3["Hitung Line Items & Konversi Valuta"]
        B3 --> B4["Request Sesi Checkout ke Stripe API"]
        
        F5 --> B5["Validasi Data & Nomor Meja"]
        B5 --> B6["Generate Invoice 'M-YYYYMMDD-XXXX'"]
        B6 --> B7["Simpan Dokumen Order (Status: Pending, Paid: false)"]
        B7 --> B8["Kosongkan cartData Pengguna di DB"]
        B8 --> B9["Socket.IO: Emit 'order:created' & 'tables:updated'"]
        B9 -.-> A16
        
        F6 --> B10["POST /api/order/verify"]
        B10 --> D3{"Verifikasi Pembayaran?"}
        D3 -- Sukses --> B11["Update Dokumen Order (Paid: true, Status: Diproses)"]
        B11 --> B12["Socket.IO: Emit 'order:created' & 'tables:updated'"]
        D3 -- Gagal --> B13["Hapus Dokumen Order Sementara"]
    end

    subgraph STRIPE_GW ["💳 PAYMENT GATEWAY (STRIPE)"]
        B4 --> S1["Buat Checkout Session URL"]
        S1 -.-> A11
        A12 --> S2["Otorisasi Transaksi & Potong Saldo"]
        S2 --> S3["Redirect Kembali ke Callback URL Frontend"]
        S3 -.-> F6
    end

    A15 --> A17
    A16 --> A17
    A17 --> End1

    %% Styling
    classDef custStyle fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a5f;
    classDef feStyle fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef beStyle fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#713f12;
    classDef stripeStyle fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#581c87;
    class A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17 custStyle;
    class F1,F2,F3,F4,F5,F6,F7,F8 feStyle;
    class B1,B2,B3,B4,B5,B6,B7,B8,B9,B10,B11,B12,B13 beStyle;
    class S1,S2,S3 stripeStyle;
```

---

### Spesifikasi Alur Kerja: Pemesanan Menu & Checkout

| Atribut Skenario | Keterangan Rinci |
| :--- | :--- |
| **Aktor Utama** | Pelanggan (*Customer*) |
| **Aktor Pendukung** | Payment Gateway Stripe, Server Backend Bujang Cafe |
| **Kondisi Awal (*Pre-condition*)** | Pelanggan berada di meja makan kafe dan memiliki koneksi internet pada perangkat ponsel/laptop. Menu makanan telah aktif di basis data. |
| **Kondisi Akhir (*Post-condition*)** | Dokumen pesanan berhasil dicatat di basis data MongoDB, keranjang belanja dikosongkan, invoice diterbitkan, dan event WebSocket memicu peringatan pesanan baru di panel kasir serta dapur. |

#### Alur Aktivitas Normal (*Happy Path*):
1. **Pindai QR / Pilih Meja**: Pelanggan memindai QR Code akrilik di meja. Sistem frontend membaca parameter query `table` secara otomatis.
2. **Katalog & Keranjang**: Pelanggan memilih hidangan, menentukan porsi, dan memasukkan ke dalam keranjang.
3. **Penerapan Voucher (Opsional)**: Pelanggan memasukkan kode promo (contoh: `MERDEKA` diskon 30% atau `SPECIAL20` diskon 20%). Sistem menghitung total bersih.
4. **Pemilihan Jalur Pembayaran**:
   - **Opsi A (Online via Stripe)**:
     1. Frontend mengirim data ke endpoint `/api/order/place`.
     2. Backend menerbitkan kode invoice `E-YYYYMMDD-XXXX` dan mendaftarkan sesi checkout ke Stripe.
     3. Pelanggan memasukkan detail kartu/e-wallet dan menyelesaikan otorisasi.
     4. Stripe mengarahkan kembali ke halaman `/verify?success=true`.
     5. Backend memperbarui pesanan menjadi lunas (`payment: true`) dan status langsung melompat ke `Diproses`.
     6. WebSocket memancarkan sinyal `order:created` ke seluruh layar staf.
   - **Opsi B (Tunai di Kasir)**:
     1. Pelanggan memilih metode "Tunai di Kasir" dan menekan tombol "Pesan Sekarang".
     2. Frontend mengirim permintaan ke endpoint `/api/order/manual`.
     3. Backend menerbitkan kode invoice `M-YYYYMMDD-XXXX`, menyimpan pesanan dengan status `Pending` dan `payment: false`.
     4. WebSocket memancarkan sinyal `order:created` ke layar kasir dan dapur.
     5. Pelanggan menerima bukti tiket digital untuk dibawa ke kasir.

#### Alur Alternatif & Penanganan Kesalahan (*Alternative Paths*):
- **A1: Saldo Pembayaran Online Tidak Cukup / Dibatalkan**: Stripe mengarahkan ke `/verify?success=false`. Backend menghapus draf order sementara, frontend menampilkan peringatan transaksi dibatalkan, dan item di keranjang dapat dipesan ulang.
- **A2: Kode Promo Tidak Valid / Kedaluwarsa**: Frontend menampilkan notifikasi gagal dan nilai potongan diskon di-reset menjadi Rp 0.

---

## 4. DIAGRAM 2: ALUR PEMROSESAN PESANAN DAPUR & PENYAJIAN (KITCHEN WORKFLOW)

Diagram ini memodelkan siklus operasional staf dapur (*chef/cook*) dalam menerima pesanan, memulai proses memasak, menyelesaikan racikan hidangan, hingga mengantarkan pesanan ke meja pelanggan.

```mermaid
flowchart TD
    %% ──────────────────────────────────────────────────────────
    %% SWIMLANES (PARTITIONS)
    %% ──────────────────────────────────────────────────────────
    subgraph STAF_DAPUR ["👨‍🍳 STAF DAPUR (KITCHEN / COOK)"]
        Start2((●)) --> K1["Memantau Layar Antrean Dapur"]
        K2["Mendengar Audio Alert & Melihat Tiket Baru Masuk"]
        K1 --> K2
        K2 --> K3["Membaca Tiket Pesanan (Menu, Meja, Catatan Khusus)"]
        K3 --> K4["Menekan Tombol 'Mulai Masak'"]
        K4 --> K5["Menyiapkan Bahan & Memasak Hidangan"]
        K5 --> K6["Hidangan Selesai Dimasak & Diplating"]
        K6 --> K7["Menekan Tombol 'Siap Disajikan'"]
        K7 --> K8["Waiter Mengantarkan Makanan ke Meja Tamu"]
        K8 --> K9["Menekan Tombol 'Konfirmasi Disajikan'"]
        K9 --> End2(((●)))
    end

    subgraph ADMIN_FE ["🖥️ PANEL DAPUR / ADMIN (React)"]
        F_K1["Menerima Event Socket 'order:created'"]
        F_K1 --> F_K2["Putar Suara Notifikasi & Render Tiket Kuning 'Pending'"]
        F_K2 -.-> K2
        K4 -.-> F_K3["Kirim Permintaan Update: Status = 'Diproses'"]
        K7 -.-> F_K4["Ubah Label Tiket Menjadi 'Siap Antar'"]
        K9 -.-> F_K5["Kirim Permintaan Update: Status = 'Disajikan'"]
    end

    subgraph BACKEND_API ["⚙️ BACKEND REST API & SOCKET.IO"]
        F_K3 --> B_K1["POST /api/order/status (status: 'Diproses')"]
        B_K1 --> B_K2["Update Dokumen Order di MongoDB (Status = Diproses)"]
        B_K2 --> B_K3["Socket.IO: Emit 'order:status_updated' & 'tables:updated'"]
        
        F_K5 --> B_K4["POST /api/order/status (status: 'Disajikan')"]
        B_K4 --> B_K5["Update Dokumen Order di MongoDB (Status = Disajikan)"]
        B_K5 --> B_K6["Update Durasi Okupansi Meja (Status Meja: 'dining')"]
        B_K6 --> B_K7["Socket.IO: Emit 'order:status_updated' & 'tables:updated'"]
    end

    subgraph PELANGGAN_VIEW ["📱 TAMPILAN STATUS PELANGGAN"]
        B_K3 -.-> P1["Status Pesanan Berubah: 'Sedang Dimasak' 🍳"]
        B_K7 -.-> P2["Status Pesanan Berubah: 'Makanan Disajikan' 🍽️"]
        P2 --> P3["Pelanggan Menikmati Santapan"]
    end

    %% Styling
    classDef kitchenStyle fill:#fff7ed,stroke:#ea580c,stroke-width:2px,color:#7c2d12;
    classDef feStyle fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef beStyle fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#713f12;
    classDef custView fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a5f;
    class K1,K2,K3,K4,K5,K6,K7,K8,K9 kitchenStyle;
    class F_K1,F_K2,F_K3,F_K4,F_K5 feStyle;
    class B_K1,B_K2,B_K3,B_K4,B_K5,B_K6,B_K7 beStyle;
    class P1,P2,P3 custView;
```

---

### Spesifikasi Alur Kerja: Pemrosesan Dapur & Penyajian

| Atribut Skenario | Keterangan Rinci |
| :--- | :--- |
| **Aktor Utama** | Staf Dapur (*Chef/Cook*) & Waiter |
| **Aktor Pendukung** | Sistem Real-Time Socket.IO, Pelanggan |
| **Kondisi Awal (*Pre-condition*)** | Pesanan telah masuk ke sistem baik melalui transaksi online maupun pesanan tunai dari meja. |
| **Kondisi Akhir (*Post-condition*)** | Status pesanan di database bertransisi dari `Pending` → `Diproses` → `Disajikan`. Meja makan tercatat aktif terisi (*Dining State*). |

#### Alur Aktivitas Normal (*Happy Path*):
1. **Deteksi Pesanan Masuk**: Socket.IO memancarkan event `order:created`. Layar antrean dapur otomatis berdering dan menampilkan kartu pesanan baru berwarna kuning.
2. **Review Rincian**: Koki membaca nomor meja, daftar menu yang dipesan, serta catatan khusus (misal: "Pedas sedikit, es dipisah").
3. **Mulai Memasak**: Koki menekan tombol "Mulai Masak". Sistem backend memperbarui status order menjadi `Diproses` dan otomatis menyiarkan status terkini ke gawai pelanggan.
4. **Penyelesaian & Plating**: Makanan selesai diracik dan ditata di nampan saji.
5. **Pengantaran ke Meja**: Waiter mengantarkan hidangan ke nomor meja tamu dan staf menekan "Konfirmasi Disajikan".
6. **Sinkronisasi Denah Meja**: Backend mengubah status order menjadi `Disajikan`. Pada denah kasir, meja bertransisi ke status `dining` (sedang makan) dan pengukur waktu makan (*dining timer*) mulai dihitung.

---

## 5. DIAGRAM 3: ALUR KASIR, PELUNASAN TUNAI, & OKUPANSI MEJA (1-CLICK KOSONGKAN MEJA)

Diagram ini memodelkan fungsi inti kasir dalam mengelola pembayaran tunai, mencetak invoice struk, memantau denah meja restoran, serta mengeksekusi fitur unggulan **1-Click Kosongkan Meja** dengan pengamanan pembatalan (*Undo*).

```mermaid
flowchart TD
    %% ──────────────────────────────────────────────────────────
    %% SWIMLANES (PARTITIONS)
    %% ──────────────────────────────────────────────────────────
    subgraph KASIR ["💁 KASIR RESTORAN"]
        Start3((●)) --> C1["Buka Menu 'Denah Meja' / 'Pesanan'"]
        C1 --> C2{"Pilih Aksi Operasional"}
        
        %% Cabang Pelunasan Tunai
        C2 -- "Pelunasan Pembayaran Tunai" --> C3["Buka Tiket Pesanan Belum Lunas (Invoice M-XXXX)"]
        C3 --> C4["Input Jumlah Uang Diterima dari Pelanggan"]
        C4 --> C5["Sistem Menghitung Uang Kembalian"]
        C5 --> C6["Klik 'Konfirmasi Pembayaran Lunas'"]
        C6 --> C7["Cetak Struk Resmi Kasir (Thermal Receipt)"]
        C7 --> C8["Serahkan Struk & Kembalian ke Tamu"]
        
        %% Cabang 1-Click Kosongkan Meja
        C2 -- "Tamu Selesai Makan & Meninggalkan Kafe" --> C9["Lihat Kartu Meja Berstatus 'Makan (Disajikan)'"]
        C9 --> C10["Klik Tombol '🧹 Kosongkan Meja'"]
        C10 --> C11{"Apakah Salah Klik?"}
        C11 -- "Ya (Dalam 5 Detik)" --> C12["Klik Tombol 'Urungkan (Undo)' pada Toast"]
        C11 -- "Tidak" --> C13["Meja Bersih & Tersedia untuk Tamu Berikutnya"]
        C12 --> C14["Status Meja Kembali ke 'Makan'"]
        C13 --> End3(((●)))
        C14 --> End3
    end

    subgraph ADMIN_UI ["💻 APLIKASI WEB ADMIN / POS"]
        C4 -.-> U1["Validasi Real-time: Nominal Uang >= Total Tagihan"]
        C6 -.-> U2["POST /api/order/payment (Lunas, Cash, Kembalian)"]
        U2 --> U3["Ubah Badge Status Tiket Menjadi 'Lunas (Hijau)'"]
        U3 -.-> C7
        
        C10 -.-> U4["Kumpulkan Seluruh OrderId Meja Tersebut"]
        U4 --> U5["Kirim POST /api/order/status massal: 'Selesai'"]
        U5 --> U6["Set Local State Meja: 'available' & Simpan Timestamp"]
        U6 --> U7["Tampilkan Toast Interaktif dengan Tombol 'Urungkan' (5 Detik)"]
        U7 -.-> C11
        
        C12 -.-> U8["Eksekusi handleUndoClear: Kembalikan Status 'Disajikan'"]
    end

    subgraph BACKEND_POS ["⚙️ BACKEND CONTROLLER & DATABASE"]
        U2 --> B_P1["Update Dokumen Order: payment=true, status='Diproses'"]
        B_P1 --> B_P2["Socket.IO: Emit 'order:payment_updated' & 'tables:updated'"]
        
        U5 --> B_P3["Update Seluruh Dokumen Terkait: status='Selesai'"]
        B_P3 --> B_P4["Pindahkan Pesanan dari Aktif ke Riwayat Transaksi"]
        B_P4 --> B_P5["Socket.IO: Emit 'order:status_updated' & 'tables:updated'"]
        
        U8 --> B_P6["Rollback Order ke Status 'Disajikan'"]
        B_P6 --> B_P7["Socket.IO: Emit 'tables:updated'"]
    end

    %% Styling
    classDef kasirStyle fill:#fdf2f8,stroke:#db2777,stroke-width:2px,color:#831843;
    classDef uiStyle fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef bePosStyle fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#713f12;
    class C1,C2,C3,C4,C5,C6,C7,C8,C9,C10,C11,C12,C13,C14 kasirStyle;
    class U1,U2,U3,U4,U5,U6,U7,U8 uiStyle;
    class B_P1,B_P2,B_P3,B_P4,B_P5,B_P6,B_P7 bePosStyle;
```

---

### Spesifikasi Alur Kerja: Kasir & Siklus Meja (*Table Lifecycle*)

| Atribut Skenario | Keterangan Rinci |
| :--- | :--- |
| **Aktor Utama** | Kasir (*Cashier*) |
| **Aktor Pendukung** | Sistem POS Bujang Cafe, Database MongoDB |
| **Kondisi Awal (*Pre-condition*)** | Kasir terautentikasi dan login ke panel POS. Pelanggan telah memiliki pesanan tunai aktif atau telah selesai makan di meja. |
| **Kondisi Akhir (*Post-condition*)** | Status pembayaran pesanan terverifikasi lunas, struk tercetak, dan meja berhasil dikosongkan (`status: available`) sehingga siap digunakan tamu berikutnya. |

#### Alur Aktivitas Normal (*Happy Path*):
1. **Pelunasan Tunai di Meja Kasir**:
   - Pelanggan mendatangi meja kasir menyebutkan nomor meja atau memperlihatkan kode invoice `M-YYYYMMDD-XXXX`.
   - Kasir membuka modal pembayaran, memasukkan nominal uang tunai yang diserahkan pelanggan.
   - Sistem secara otomatis menghitung selisih uang kembalian (*change*).
   - Kasir menekan tombol "Konfirmasi Pembayaran Lunas".
   - Backend memperbarui `payment = true` dan mengalihkan status order yang sebelumnya `Pending` menjadi `Diproses`.
   - Struk tagihan tercetak via printer thermal.
2. **Operasional 1-Click Kosongkan Meja**:
   - Ketika tamu telah selesai makan dan meninggalkan meja, kasir membuka tab **Manajemen Meja**.
   - Kartu meja menampilkan durasi santap tamu dan status `Makan (Disajikan)`.
   - Kasir mengklik tombol **"🧹 Kosongkan Meja"**.
   - Sistem frontend mengumpulkan seluruh ID pesanan aktif pada meja tersebut dan menembak endpoint `/api/order/status` dengan status `Selesai`.
   - Dokumen pesanan otomatis diarsipkan ke tab Riwayat Pesanan dan status kartu meja seketika berubah menjadi hijau (`Kosong/Available`).
   - Sistem menampilkan toast konfirmasi selama 5 detik: *"Meja X dikosongkan & status selesai 🧹"* disertai tombol interaktif **"Urungkan"**.

#### Alur Alternatif: Pembatalan Pengosongan Meja (*Undo Clear Table*):
- Jika kasir tidak sengaja menekan tombol "Kosongkan Meja" padahal tamu masih berada di meja, kasir memiliki batas waktu 5 detik untuk menekan tombol **"Urungkan"** pada toast notifikasi.
- Sistem mengeksekusi fungsi `handleUndoClear`: memulihkan status pesanan kembali menjadi `Disajikan` di database, membatalkan penanda timestamp lokal, dan mengembalikan kartu meja ke kondisi `Makan (Dining)`.

---

## 6. DIAGRAM 4: ALUR MANAJEMEN KATALOG MENU & STOK OLEH MANAJER

Diagram ini memodelkan hak akses eksklusif **Manajer / Administrator** dalam menambah hidangan baru, memperbarui informasi harga/kategori, mengunggah foto produk ke server awan **Cloudinary**, serta mengubah ketersediaan menu (*stock toggle*).

```mermaid
flowchart TD
    %% ──────────────────────────────────────────────────────────
    %% SWIMLANES (PARTITIONS)
    %% ──────────────────────────────────────────────────────────
    subgraph MANAGER ["👔 MANAJER RESTORAN"]
        Start4((●)) --> M1["Login dengan Akun Peran 'Manager'"]
        M1 --> M2["Buka Halaman 'Kelola Menu' (/add atau /list)"]
        M2 --> M3{"Pilih Operasi Menu"}
        
        %% Cabang Tambah Menu
        M3 -- "Tambah Hidangan Baru" --> M4["Isi Formulir (Nama, Deskripsi, Harga, Kategori)"]
        M4 --> M5["Pilih Berkas Foto Makanan (JPG/PNG/WebP)"]
        M5 --> M6["Klik Tombol 'Simpan Menu'"]
        M6 --> M7["Melihat Kartu Menu Baru di Katalog"]
        
        %% Cabang Ubah Ketersediaan Stok
        M3 -- "Bahan Makanan Dapur Habis" --> M8["Cari Menu pada Daftar Hidangan"]
        M8 --> M9["Klik Tombol Toggle 'Ketersediaan Menu'"]
        M9 --> M10["Label Berubah: 'Stok Habis' (Merah)"]
        
        %% Cabang Hapus Menu
        M3 -- "Hapus Menu Permanen" --> M11["Klik Ikon Hapus (Trash)"]
        M11 --> M12["Konfirmasi Dialog Peringatan Hapus"]
        M12 --> M13["Menu Terhapus dari Daftar"]
        
        M7 --> End4(((●)))
        M10 --> End4
        M13 --> End4
    end

    subgraph ADMIN_PANEL ["💻 ADMIN PANEL FRONTEND"]
        M5 -.-> A_M1["Validasi Ukuran Gambar (< 5MB) & Format"]
        M6 -.-> A_M2["Bungkus Data ke dalam multipart/form-data"]
        A_M2 --> A_M3["POST /api/food/add (Headers: Bearer Token)"]
        
        M9 -.-> A_M4["POST /api/food/toggle-availability (foodId)"]
        M12 -.-> A_M5["POST /api/food/remove (foodId)"]
    end

    subgraph BACKEND_GATEWAY ["⚙️ BACKEND API & MIDDLEWARE"]
        A_M3 --> B_M1["AuthMiddleware & requireRoles('manager')"]
        B_M1 --> D_M1{"Izin Akses Sah?"}
        D_M1 -- Tidak --> B_M2["Tolak: 403 Forbidden (Hanya Manajer)"]
        D_M1 -- Sah --> B_M3["Multer Parser: Ekstrak Berkas Gambar"]
        B_M3 --> B_M4["Kirim Buffer Gambar ke Cloudinary API"]
        
        A_M4 --> B_M5["AuthMiddleware & requireRoles('manager', 'kasir')"]
        B_M5 --> B_M6["Update Field 'available = !available' di MongoDB"]
        
        A_M5 --> B_M7["AuthMiddleware & requireRoles('manager')"]
        B_M7 --> B_M8["Hapus Dokumen Food dari MongoDB"]
    end

    subgraph CLOUD_STORAGE ["☁️ CLOUDINARY CLOUD STORAGE"]
        B_M4 --> C_M1["Optimasi Format Otomatis & Kompresi Awan"]
        C_M1 --> C_M2["Generate Secure Image URL (https://res.cloudinary...)"]
        C_M2 -.-> B_M9["Kembalikan URL Gambar ke Backend"]
    end

    subgraph DATABASE ["🗄️ MONGODB ATLAS"]
        B_M9 --> DB1["Insert Dokumen Baru ke Koleksi 'foods'"]
        DB1 -.-> A_M6["Response: { success: true, message: 'Food Added' }"]
        A_M6 -.-> M7
        
        B_M6 --> DB2["Simpan Perubahan Status Ketersediaan"]
        DB2 -.-> A_M7["Response: { success: true, available: false }"]
        A_M7 -.-> M10
        
        B_M8 --> DB3["Hapus Rekaman Makanan"]
        DB3 -.-> A_M8["Response: { success: true, message: 'Food Removed' }"]
        A_M8 -.-> M13
    end

    %% Styling
    classDef mgrStyle fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b;
    classDef feStyle fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef beStyle fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#713f12;
    classDef cloudStyle fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a5f;
    classDef dbStyle fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#581c87;
    class M1,M2,M3,M4,M5,M6,M7,M8,M9,M10,M11,M12,M13 mgrStyle;
    class A_M1,A_M2,A_M3,A_M4,A_M5,A_M6,A_M7,A_M8 feStyle;
    class B_M1,B_M2,B_M3,B_M4,B_M5,B_M6,B_M7,B_M8,B_M9 beStyle;
    class C_M1,C_M2 cloudStyle;
    class DB1,DB2,DB3 dbStyle;
```

---

### Spesifikasi Alur Kerja: Manajemen Menu & Stok Makanan

| Atribut Skenario | Keterangan Rinci |
| :--- | :--- |
| **Aktor Utama** | Manajer Restoran (*Restaurant Manager*) |
| **Aktor Pendukung** | Penyedia Cloudinary Storage, Database MongoDB |
| **Kondisi Awal (*Pre-condition*)** | Manajer telah login dengan kredensial sah dan mengantongi token JWT dengan hak akses `role: 'manager'`. |
| **Kondisi Akhir (*Post-condition*)** | Data katalog menu bertambah/berubah di MongoDB, aset gambar tersimpan di CDN Cloudinary, dan pelanggan langsung melihat perubahan ketersediaan menu secara real-time. |

#### Alur Aktivitas Normal (*Happy Path*):
1. **Penambahan Menu Baru**:
   - Manajer membuka halaman "Tambah Menu", melengkapi nama hidangan, deskripsi, harga porsi, kategori (Salad, Pasta, Cakes, dll.), dan mengunggah berkas foto.
   - Backend memverifikasi tanda tangan JWT dan hak izin peran melalui `requireRoles('manager')`.
   - File gambar diunggah ke CDN Cloudinary untuk menghasilkan URL publik yang terenkripsi aman (*HTTPS*).
   - Backend menyimpan rekaman dokumen hidangan ke koleksi `foods` di MongoDB dengan atribut `available = true`.
   - Katalog menu di aplikasi pelanggan langsung menampilkan hidangan baru tersebut.
2. **Pengalihan Status Ketersediaan (Stok Habis / Ready)**:
   - Ketika bahan makanan tertentu di dapur habis, staf kasir atau manajer menekan tombol toggle ketersediaan pada daftar menu.
   - Backend mengeksekusi `/api/food/toggle-availability` dan membalik nilai boolean `available`.
   - Di aplikasi pelanggan, tombol "Tambah ke Keranjang" untuk menu tersebut otomatis dinonaktifkan dan diganti dengan lencana *"Stok Habis"*, mencegah pelanggan memesan menu yang tidak dapat disajikan.

---

## 7. MATRIKS KETERHUBUNGAN DOKUMEN TUGAS AKHIR

Dokumen Activity Diagram ini menyatu secara komprehensif dengan seluruh pilar dokumentasi rekayasa perangkat lunak sistem Bujang Cafe:

| Dokumen | Format & Tautan Berkas | Fokus Pemodelan / Pengujian |
| :--- | :--- | :--- |
| **Activity Diagram** | **[ACTIVITY_DIAGRAM.md](file:///d:/College/Tugas%20Sopiansyah/Tugas%20Akhir/menu-ordering-app-deploy/ACTIVITY_DIAGRAM.md)** | **Alur kerja dinamis sistem (Dynamic Workflow)**, percabangan keputusan, partisi swimlanes antar aktor, dan penanganan kondisi gagal. |
| **Class Diagram** | **[CLASS_DIAGRAM.md](file:///d:/College/Tugas%20Sopiansyah/Tugas%20Akhir/menu-ordering-app-deploy/CLASS_DIAGRAM.md)** | **Struktur statis sistem (Static Structure)**, relasi kelas, komposisi `Order` ke `OrderItem`, dan arsitektur berlapis MVC Express.js. |
| **Use Case Diagram** | **[USE_CASE_DIAGRAM.md](file:///d:/College/Tugas%20Sopiansyah/Tugas%20Akhir/menu-ordering-app-deploy/USE_CASE_DIAGRAM.md)** | **Perspektif fungsional aktor (Functional View)**, mendefinisikan 28 use case dengan relasi `<<include>>` dan `<<extend>>`. |
| **Black Box Testing Admin** | **[BLACK_BOX_TESTING_ADMIN.md](file:///d:/College/Tugas%20Sopiansyah/Tugas%20Akhir/menu-ordering-app-deploy/BLACK_BOX_TESTING_ADMIN.md)** | **Pengujian fungsional manual panel staf** (84 test cases mencakup fitur Kosongkan Meja, Kasir, Dapur, & Manajer). |
| **Black Box Testing Customer** | **[BLACK_BOX_TESTING_CUSTOMER.md](file:///d:/College/Tugas%20Sopiansyah/Tugas%20Akhir/menu-ordering-app-deploy/BLACK_BOX_TESTING_CUSTOMER.md)** | **Pengujian fungsional manual pelanggan** (54 test cases mencakup QR, Keranjang, Voucher, & Pembayaran). |
| **Laporan Uji Otomatis** | **[tests/reports/index.html](file:///d:/College/Tugas%20Sopiansyah/Tugas%20Akhir/menu-ordering-app-deploy/tests/reports/index.html)** | **Bukti empiris pengujian otomatis** (Jest Unit + Supertest API + Playwright E2E, 55/55 passed, 100%). |
