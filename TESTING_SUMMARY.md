# RINGKASAN PENGUJIAN SISTEM
## BUJANG CAFE POS — TESTING SUMMARY

---

## Statistik Pengujian

| Aplikasi | Modul | Total Test Case |
|---|:---:|:---:|
| 🧑 **Customer App** (http://localhost:5173) | 6 modul | **54 TC** |
| 🔧 **Admin Panel** (http://localhost:5174) | 9 modul | **84 TC** |
| **GRAND TOTAL** | **15 modul** | **138 TC** |

---

## Dokumen Pengujian

| Dokumen | Deskripsi | Link |
|---|---|---|
| `BLACK_BOX_TESTING_CUSTOMER.md` | Black-box testing aplikasi pelanggan (54 TC, 6 modul) | [Buka Dokumen](file:///d:/College/Tugas%20Sopiansyah/Tugas%20Akhir/menu-ordering-app-deploy/BLACK_BOX_TESTING_CUSTOMER.md) |
| `BLACK_BOX_TESTING_ADMIN.md` | Black-box testing admin panel (84 TC, 9 modul - Versi Konsolidasi Lengkap) | [Buka Dokumen](file:///d:/College/Tugas%20Sopiansyah/Tugas%20Akhir/menu-ordering-app-deploy/BLACK_BOX_TESTING_ADMIN.md) |

---

## Temuan Bug dari Static Code Analysis

### Aplikasi Customer (Frontend)

| ID | Tingkat | File | Baris | Deskripsi | Rekomendasi |
|---|:---:|---|:---:|---|---|
| **BUG-C-01** | 🟡 Medium | `Cart.jsx` | L204-208 | `navigate('/cart')` dari dalam halaman `/cart` — logika redirect keliru | Ubah redirect ke `navigate('/')` agar customer diarahkan ke Home saat cart kosong |
| **BUG-C-02** | 🟢 Low | `Cart.jsx` | L31 | `setInvoiceNumber` di-destructure dari StoreContext tapi tidak ada — dead code | Hapus `setInvoiceNumber` dari destructuring |
| **BUG-C-03** | 🔴 **High** | `MyOrders.jsx` | L291-299 | Pesanan "Dibatalkan" tidak tampil di tab manapun (Berlangsung dan Selesai) | Tambahkan kondisi untuk status "Dibatalkan" di tab "Selesai" atau buat tab ketiga "Dibatalkan" |
| **BUG-C-04** | 🟡 Medium | `OrderConfirmation.jsx` | L84-90 | Auto-redirect ke `/myorders` terlalu cepat via Socket.IO — UX kurang ideal | Tambahkan delay 2-3 detik atau tampilkan toast notifikasi sebelum redirect |

### Admin Panel

| ID | Tingkat | File | Baris | Deskripsi | Rekomendasi |
|---|:---:|---|:---:|---|---|
| **BUG-A-01** | 🟡 Medium | `Login.jsx` | L48-56 | `result.data?.user?.role` selalu `undefined` — kasir selalu redirect ke `/dashboard` dulu sebelum ke `/orders` | Perbaiki `AuthContext.login()` untuk mengembalikan data user, atau gunakan `role` dari state AuthContext |
| **BUG-A-02** | 🟢 Low | `Orders.jsx` | L229-234 | `handleCancelOrder` menggunakan `window.confirm()` — inkonsisten dengan desain UI | Ganti ke SweetAlert2 seperti komponen lainnya |
| **BUG-A-03** | 🟢 Low | `Dashboard.jsx` | L23 | `BACKEND_URL` didefinisikan tapi tidak digunakan | Hapus deklarasi const yang tidak terpakai |
| **BUG-A-04** | ✅ Fixed | `Tables.jsx` | — | `axios.post` digunakan tanpa import — menyebabkan "Gagal mengosongkan meja" | Sudah diperbaiki: diganti `api.post` |

---

## Prioritas Perbaikan Bug

### Harus Diperbaiki (High Priority)
1. **BUG-C-03** — Pesanan "Dibatalkan" tidak muncul di My Orders
   - Dampak: Customer tidak bisa melihat riwayat pembatalan pesanannya
   - File: `MyOrders.jsx` baris 295-298

### Perlu Diperbaiki (Medium Priority)
2. **BUG-C-01** — Cart redirect ke diri sendiri
   - Dampak: Logika redirect keliru, tidak crash namun tidak ideal
   - File: `Cart.jsx` baris 206
3. **BUG-A-01** — Login kasir melalui /dashboard dahulu
   - Dampak: Double redirect yang tidak perlu
   - File: `Login.jsx` baris 52

### Nice to Fix (Low Priority)
4. **BUG-C-02** — Dead code `setInvoiceNumber` di Cart.jsx
5. **BUG-A-02** — `window.confirm` inkonsisten di Orders.jsx
6. **BUG-A-03** — Dead code `BACKEND_URL` di Dashboard.jsx

---

## Rekomendasi Perbaikan Kode

### Fix BUG-C-03 (Kritis): MyOrders.jsx — Tambahkan status "Dibatalkan"

```javascript
// SEBELUM (MyOrders.jsx baris 295-298):
} else {
  if (order.status !== "Selesai") return false;
}

// SESUDAH:
} else {
  if (order.status !== "Selesai" && order.status !== "Dibatalkan") return false;
}
```

### Fix BUG-C-01 (Medium): Cart.jsx — Redirect ke Home bukan ke Cart

```javascript
// SEBELUM (Cart.jsx baris 205-208):
useEffect(() => {
  if (!token || getTotalCartAmount() === 0) {
    navigate("/cart"); // BUG: redirect ke diri sendiri
  }
}, [getTotalCartAmount, navigate, token]);

// SESUDAH — Tidak perlu redirect, biarkan UI menampilkan state kosong:
// (Hapus useEffect ini, Cart.jsx sudah memiliki tampilan empty state di baris 221-228)
```

### Fix BUG-C-02 (Low): Cart.jsx — Hapus dead code

```javascript
// SEBELUM (Cart.jsx baris 31):
const {
  ...
  setInvoiceNumber, // Tidak ada di StoreContext
} = useContext(StoreContext);

// SESUDAH — Hapus baris setInvoiceNumber:
const {
  cartItems, food_list, addToCart, removeFromCart,
  getTotalCartAmount, url, handlePromoCode, discount,
  token, tableNumber, setTableNumber,
} = useContext(StoreContext);
```

### Fix BUG-A-02 (Low): Orders.jsx — Ganti window.confirm ke SweetAlert

```javascript
// SEBELUM (Orders.jsx baris 229-234):
const handleCancelOrder = (orderId, invoiceNumber) => {
  if (window.confirm(`Batalkan ${invoiceNumber}?...`)) {
    handleStatusChange(orderId, 'Dibatalkan');
  }
};

// SESUDAH — Gunakan toast + konfirmasi dari library yang sudah dipakai:
// (Ganti dengan SweetAlert2.fire({ ..., showCancelButton: true, ... }) style)
```

---

## Catatan Testing Manual

> Gunakan tabel ini untuk mencatat hasil pengujian manual saat menjalankan setiap test case di browser.

| Status | Keterangan |
|:---:|---|
| ✅ **VALID** | Hasil aktual sesuai hasil yang diharapkan |
| ❌ **BUG** | Hasil aktual berbeda dengan yang diharapkan — terdapat error |
| ⚠️ **PARTIAL** | Berfungsi sebagian, ada penyimpangan minor |
| ⏭️ **SKIP** | Test di-skip karena ketergantungan pre-condition tidak terpenuhi |

---

## Kesimpulan

Dari **static code analysis** yang dilakukan pada seluruh 15 fitur sistem, ditemukan:
- **1 bug kritikal** (High) yang mempengaruhi fungsionalitas: BUG-C-03 (pesanan dibatalkan tidak tampil)
- **3 bug medium** yang mempengaruhi UX: BUG-C-01, BUG-C-04, BUG-A-01
- **3 bug low** berupa dead code dan inkonsistensi UX: BUG-C-02, BUG-A-02, BUG-A-03
- **1 bug sudah diperbaiki**: BUG-A-04 (Kosongkan Meja — axios tidak diimport)

Secara keseluruhan, sistem berfungsi dengan baik untuk **happy path scenarios**. Fitur inti (pemesanan, pembayaran, tracking pesanan, manajemen meja) bekerja sesuai alur yang diharapkan. Bug yang ditemukan bersifat **non-blocking** kecuali BUG-C-03 yang perlu diprioritaskan untuk perbaikan.
