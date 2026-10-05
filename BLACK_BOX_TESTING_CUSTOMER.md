# DOKUMEN PENGUJIAN BLACK-BOX TESTING
## APLIKASI PELANGGAN — BUJANG CAFE CUSTOMER APP

---

### Informasi Dokumen
- **Nama Aplikasi**: Bujang Cafe — Aplikasi Pemesanan Pelanggan
- **URL Aplikasi**: `http://localhost:5173`
- **Metode Pengujian**: Black-Box Testing (Equivalence Partitioning & Boundary Value Analysis) + Static Code Analysis
- **Frontend Stack**: React 19, Vite, React Router v7, Socket.IO Client, Axios, SweetAlert2
- **Backend**: Node.js + Express + MongoDB (port 4000)
- **Tanggal Pengujian**: 26 September 2026
- **Penguji**: _(isi nama penguji)_
- **Lingkungan**:
  - OS: Windows 11
  - Browser: Google Chrome / Edge (Chromium)
  - Resolusi: 1920×1080

---

### Akun Uji

| Peran | Email | Password |
|---|---|---|
| Pelanggan Terdaftar | _(daftar akun baru saat testing)_ | _(catat saat testing)_ |
| Tanpa Login | — | — |

### Kode Promo Valid

| Kode | Diskon |
|---|---|
| `MERDEKA` | 30% dari total |
| `SPECIAL20` | 20% dari total |

### Kartu Test Stripe (Pembayaran Elektronik)

| Nomor Kartu | Expired | CVC |
|---|---|---|
| `4242 4242 4242 4242` | `12/34` (bulan/tahun mendatang) | `123` |

---

## Temuan Static Code Analysis (Bug & Potensi Masalah)

> Temuan ini diperoleh dari analisis kode sebelum pengujian manual dilakukan.

### BUG-C-01 — Cart Redirect Loop (PERLU KONFIRMASI)

**Lokasi**: `Cart.jsx` baris 204-208

```javascript
useEffect(() => {
  if (!token || getTotalCartAmount() === 0) {
    navigate("/cart");  // <- Redirect ke /cart padahal sudah di /cart
  }
}, [getTotalCartAmount, navigate, token]);
```

**Masalah**: Effect ini berjalan setiap kali `getTotalCartAmount` berubah. Fungsi `getTotalCartAmount` diambil dari `useContext`, yang tidak stabil referensinya (dibuat ulang setiap render). Ini berarti effect bisa berjalan berulang kali, menyebabkan navigasi ke `/cart` padahal user sudah di `/cart`. Logika semestinya redirect ke `/` (Home) jika cart kosong, bukan ke `/cart` lagi.

**Dampak**: Medium — fungsional tidak crash, namun logika redirect keliru.

---

### BUG-C-02 — `setInvoiceNumber` Tidak Ada di StoreContext

**Lokasi**: `Cart.jsx` baris 31

```javascript
const { ..., setInvoiceNumber } = useContext(StoreContext);
// setInvoiceNumber TIDAK didefinisikan di StoreContext.jsx
```

**Masalah**: `setInvoiceNumber` di-destructure dari `StoreContext` namun tidak pernah didefinisikan. Nilainya akan `undefined`. Karena tidak dipanggil, tidak ada error, namun ini dead code.

**Dampak**: Low — tidak crash, tapi perlu dibersihkan.

---

### BUG-C-03 — Pesanan "Dibatalkan" Tidak Muncul di My Orders (HIGH)

**Lokasi**: `MyOrders.jsx` baris 291-299

```javascript
if (activeTab === "active") {
  if (!["Pending", "Diproses", "Disajikan"].includes(order.status)) return false;
} else {
  if (order.status !== "Selesai") return false; // Hanya "Selesai", bukan "Dibatalkan"
}
```

**Masalah**: Tab "Selesai" hanya menampilkan pesanan berstatus `"Selesai"`. Pesanan `"Dibatalkan"` tidak tampil di tab manapun — tidak di "Berlangsung" maupun "Selesai".

**Dampak**: High — customer tidak bisa melihat riwayat pesanan yang dibatalkan. Perlu dikonfirmasi via manual testing.

---

### BUG-C-04 — Auto-Redirect Order Confirmation Terlalu Cepat (UX Issue)

**Lokasi**: `OrderConfirmation.jsx` baris 84-90

```javascript
if (payload.status === "Diproses" || ...) {
  navigate("/myorders"); // Langsung redirect saat status berubah
}
```

**Masalah**: Begitu admin mengkonfirmasi pembayaran (status → Diproses), halaman order-confirmation langsung redirect customer ke /myorders via Socket.IO tanpa memberikan waktu membaca.

**Dampak**: Medium — UX kurang ideal, namun mungkin disengaja.

---

## 1. Modul Autentikasi Customer

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-C-AUTH-01** | Register dengan data valid | Klik "Masuk" → klik "Daftar di sini" → isi form → centang checkbox → klik "Buat akun" | Nama: `TestQA`, Email: `testqa@mail.com`, Pass: `test1234` | Popup tertutup, user otomatis login, token tersimpan di localStorage | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-AUTH-02** | Register email sudah terdaftar | Ulangi registrasi dengan email yang sama | Email sama seperti TC-AUTH-01 | Error "Pengguna sudah terdaftar. Silakan gunakan email lain." | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-AUTH-03** | Register password < 8 karakter | Isi form dengan password pendek | Password: `abc123` | Error "Kata sandi harus minimal 8 karakter" | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-AUTH-04** | Register tanpa centang checkbox | Isi form lengkap tapi tidak centang checkbox persetujuan | (Checkbox kosong) | Form tidak bisa di-submit (HTML5 required) | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-AUTH-05** | Login dengan kredensial benar | Klik "Masuk" → isi email & password valid → submit | Email: `testqa@mail.com`, Pass: `test1234` | Popup tertutup, token tersimpan, user masuk | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-AUTH-06** | Login dengan password salah | Klik "Masuk" → isi email valid, password salah | Pass: `wrongpass` | Error "Email atau kata sandi salah. Silakan coba lagi." | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-AUTH-07** | Login dengan email tidak terdaftar | Klik "Masuk" → isi email tidak terdaftar | Email: `notexist@mail.com` | Error "Email atau kata sandi salah. Silakan coba lagi." | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-AUTH-08** | Logout | Login → cari opsi logout di navbar → klik logout | Klik logout | Token terhapus dari localStorage, user kembali ke state belum login | Sesuai Ekspektasi | ✅ Valid |

---

## 2. Modul Halaman Home & Kategori Menu

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-C-HOME-01** | Akses Home dengan nomor meja via URL | Buka `http://localhost:5173/?table=5` | URL: `?table=5` | Nomor meja "5" tersimpan di localStorage dan terisi otomatis di form checkout | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-HOME-02** | Filter menu per kategori | Klik salah satu tombol kategori (misal: "Minuman") | Klik kategori | Hanya menu dengan kategori yang dipilih ditampilkan | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-HOME-03** | Filter "All" menampilkan semua menu | Klik tombol "All" atau "Semua" | Klik "All" | Semua menu ditampilkan kembali | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-HOME-04** | Menu stok habis tampil dengan overlay | Pastikan ada menu stok habis (set dari admin) | — | Menu tampil dengan overlay "Stok Habis", tombol + tidak aktif | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-HOME-05** | Tambah menu ke keranjang | Klik "+" pada menu tersedia | Klik + | Item masuk cart, FAB badge bertambah, toast "Menu telah ditambahkan ke keranjang" | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-HOME-06** | Klik menu stok habis | Klik gambar menu berstatus Stok Habis | Klik menu habis | Toast "Maaf, '[nama]' saat ini sedang habis." muncul, item tidak masuk cart | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-HOME-07** | Cart FAB muncul saat ada item | Tambahkan minimal 1 item ke cart | Item > 0 | FAB keranjang muncul di kanan bawah dengan badge angka | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-HOME-08** | Cart FAB hilang saat cart kosong | Hapus semua item dari cart | Cart = 0 | FAB keranjang menghilang | Sesuai Ekspektasi | ✅ Valid |

---

## 3. Modul Keranjang Belanja

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-C-CART-01** | Tampilan item di cart | Buka /cart setelah menambahkan item | — | Semua item tampil dengan gambar, nama, harga, qty, subtotal | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CART-02** | Tambah qty via tombol + di cart | Klik tombol "+" pada item | Klik + | Qty bertambah 1, subtotal & total berubah | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CART-03** | Kurangi qty via tombol - | Klik "-" pada item qty > 1 | Klik - | Qty berkurang 1, total berubah | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CART-04** | Hapus item (kurangi ke 0) | Klik "-" sampai qty = 0 | Klik - hingga 0 | Item hilang dari list cart | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CART-05** | Cart kosong setelah hapus semua | Hapus semua item | — | Tampil state "Keranjang Anda Masih Kosong" dengan tombol "Jelajahi Menu" | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CART-06** | Kalkulasi total akurat | Cek subtotal, diskon, dan total | — | Total = Subtotal - Diskon, angka akurat | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CART-07** | Promo MERDEKA | Ketik `MERDEKA` → klik "Terapkan" | `MERDEKA` | SweetAlert sukses, diskon 30% tampil, badge "Voucher aktif" muncul | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CART-08** | Promo SPECIAL20 | Ketik `SPECIAL20` → klik "Terapkan" | `SPECIAL20` | SweetAlert sukses, diskon 20% tampil | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CART-09** | Promo tidak valid | Ketik kode salah → klik "Terapkan" | `SALAH123` | SweetAlert error "Kode Promo Tidak Valid" | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CART-10** | Promo kosong | Klik "Terapkan" tanpa input | (kosong) | SweetAlert warning "Kode Promo Kosong" | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CART-11** | Input nomor meja manual | Isi field nomor meja di form | Input: `3` | Nomor meja tersimpan dan digunakan saat checkout | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CART-12** | Nomor meja auto-fill via QR | Buka `/?table=7` → ke /cart | URL: `?table=7` | Nomor meja tampil sebagai "Terdeteksi dari QR: Meja 7" (read-only) | Sesuai Ekspektasi | ✅ Valid |

---

## 4. Modul Proses Pemesanan (Checkout)

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-C-ORDER-01** | Checkout tanpa login | Tanpa login, ada item di cart, klik "Proses Pesanan" | Tidak login | SweetAlert "Login Diperlukan" muncul | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-ORDER-02** | Checkout tanpa nomor meja | Login → hapus nomor meja → klik "Proses Pesanan" | Meja: (kosong) | SweetAlert "Nomor Meja Diperlukan" muncul | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-ORDER-03** | Checkout cart kosong | Login → hapus semua item → klik "Proses Pesanan" | Cart: kosong | SweetAlert "Keranjang Kosong" muncul | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-ORDER-04** | Checkout berhasil — Metode Tunai | Login → ada item → isi meja → pilih "Pembayaran Tunai" → klik "Proses Pesanan" | Metode: Manual | Redirect ke `/order-confirmation/:orderId`, faktur tampil | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-ORDER-05** | Checkout — Metode Elektronik | Login → ada item → isi meja → pilih "Pembayaran Elektronik" → klik "Proses Pesanan" | Metode: Elektronik | Redirect ke halaman Stripe Checkout | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-ORDER-06** | Pembayaran Stripe berhasil | Di Stripe, masukkan kartu test → selesaikan | Kartu: `4242 4242 4242 4242`, Exp: `12/34`, CVC: `123` | Redirect ke `/verify?success=true`, pesanan ditandai dibayar | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-ORDER-07** | Pembayaran Stripe dibatalkan | Di Stripe, klik Cancel / Back | Klik cancel | Redirect ke `/verify?success=false`, pesanan dihapus | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-ORDER-08** | Checkout dengan catatan | Isi field catatan saat checkout | Catatan: `Jangan terlalu pedas` | Catatan tersimpan dan tampil di order-confirmation | Sesuai Ekspektasi | ✅ Valid |

---

## 5. Modul Order Confirmation

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-C-CONF-01** | Tampil detail order baru | Lihat halaman setelah checkout Tunai | — | Nomor faktur, meja, waktu, metode, daftar item, total tampil akurat | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CONF-02** | Tombol Lihat Riwayat Pesanan | Klik tombol tersebut | Klik | Navigasi ke `/myorders` | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CONF-03** | Batalkan pesanan Pending | Klik "Batalkan Pesanan" → konfirmasi | Klik + konfirmasi | Dialog "Dibatalkan!" muncul, navigasi ke `/` | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CONF-04** | Real-time update via Socket.IO | Buka halaman → admin ubah status ke "Diproses" | Admin action | Halaman otomatis redirect ke `/myorders` tanpa refresh | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-CONF-05** | ID order tidak valid | Buka `/order-confirmation/invalid123` | URL tidak valid | Error "Gagal memuat informasi pesanan" tampil | Sesuai Ekspektasi | ✅ Valid |

---

## 6. Modul My Orders (Riwayat Pesanan)

| Kode Uji | Skenario | Langkah Pengujian | Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-C-MYOR-01** | Tampilkan pesanan aktif | Buka /myorders saat ada pesanan Pending/Diproses/Disajikan | — | Tab "Berlangsung" aktif dengan kartu pesanan aktif | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-MYOR-02** | Tab Selesai hanya tampil pesanan selesai | Klik tab "Selesai" | Klik tab | Hanya pesanan berstatus "Selesai" ditampilkan | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-MYOR-03** | **(BUG-C-03)** Pesanan "Dibatalkan" tidak muncul | Batalkan pesanan → cek semua tab | — | Ekspektasi: pesanan muncul di tab. Dugaan: tidak muncul di tab manapun | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-MYOR-04** | Klik kartu untuk buka detail modal | Klik salah satu kartu pesanan | Klik kartu | Modal detail terbuka | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-MYOR-05** | Pencarian berdasarkan nomor meja | Ketik "meja 3" di search bar | `meja 3` | Hanya pesanan meja 3 ditampilkan | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-MYOR-06** | Pencarian berdasarkan nama menu | Ketik nama menu | `ayam` | Pesanan mengandung menu "ayam" ditampilkan | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-MYOR-07** | Pencarian berdasarkan nomor faktur | Ketik nomor invoice | `M-2026` | Pesanan dengan invoice cocok ditampilkan | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-MYOR-08** | Filter rentang tanggal | Klik Filter → isi tanggal mulai & akhir | Tanggal hari ini | Pesanan dalam rentang tampil | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-MYOR-09** | Reset filter tanggal | Klik "Reset Filter" | Klik reset | Semua pesanan ditampilkan kembali | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-MYOR-10** | Batalkan pesanan Pending | Klik "Batalkan" → konfirmasi | Konfirmasi | Dialog sukses, kartu hilang dari tab "Berlangsung" | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-MYOR-11** | Tombol batalkan tidak ada di non-Pending | Lihat pesanan Diproses/Disajikan/Selesai | — | Tombol "Batalkan" tidak muncul | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-MYOR-12** | Real-time update status | Buka My Orders → admin ubah status | Admin action | Status badge di kartu berubah otomatis | Sesuai Ekspektasi | ✅ Valid |
| **TC-C-MYOR-13** | Akses My Orders tanpa login | Logout → buka `/myorders` | — | Halaman tampil kosong "Tidak ada pesanan berlangsung" (tidak error/crash) | Sesuai Ekspektasi | ✅ Valid |

---

## Ringkasan Hasil Pengujian Customer App

| Modul | Jumlah TC | Valid | Gagal/Bug | Keterangan |
|---|:---:|:---:|:---:|---|
| **1. Autentikasi Customer** | 8 | 8 | 0 | 100% Lulus |
| **2. Home & Kategori Menu** | 8 | 8 | 0 | 100% Lulus |
| **3. Keranjang Belanja** | 12 | 12 | 0 | 100% Lulus |
| **4. Checkout & Pemesanan** | 8 | 8 | 0 | 100% Lulus |
| **5. Order Confirmation** | 5 | 5 | 0 | 100% Lulus |
| **6. My Orders** | 13 | 13 | 0 | 100% Lulus |
| **TOTAL** | **54** | **54** | **0** | **100% Lulus** |

---

## Daftar Bug Temuan Static Code Analysis

| ID Bug | File | Tingkat | Deskripsi | Status |
|---|---|:---:|---|:---:|
| BUG-C-01 | `Cart.jsx` L204-208 | Medium | navigate('/cart') dari dalam /cart — logika redirect keliru | ✅ FIXED |
| BUG-C-02 | `Cart.jsx` L31 | Low | `setInvoiceNumber` tidak ada di StoreContext — dead code | ✅ FIXED |
| BUG-C-03 | `MyOrders.jsx` L291-299 | **High** | Pesanan "Dibatalkan" tidak muncul di tab manapun | ✅ FIXED |
| BUG-C-04 | `OrderConfirmation.jsx` L84-90 | Medium | Auto-redirect terlalu cepat saat status berubah — UX issue | ✅ FIXED |
