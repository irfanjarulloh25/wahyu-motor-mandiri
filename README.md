# Sistem Komputerisasi Bengkel Wahyu Motor Mandiri

Proyek ini adalah sistem informasi manajemen terpadu (POS, Manajemen Inventori, dan CRM) untuk mengelola operasional Bengkel Wahyu Motor Mandiri. Sistem dirancang dengan berpedoman pada kaidah dan standar Rekayasa Perangkat Lunak (RPL) untuk memastikan performa yang tinggi, mudah dipelihara (*maintainability*), dan siap dikembangkan lebih lanjut (*scalability*).

## 🏗 Arsitektur Sistem

Sistem ini menggunakan perpaduan arsitektur **Single Page Application (SPA)** pada sisi *client* (Frontend) dan **Headless MVC (Model-View-Controller) / RESTful API** pada sisi *server* (Backend). 

Konsep dan pola desain utama yang diimplementasikan:
1. **Separation of Concerns (SoC):** Terdapat pemisahan mutlak antara logika tampilan letak antarmuka pengguna (Frontend) dengan pengolahan logika bisnis dan basis data (Backend).
2. **Front Controller Pattern:** Seluruh lalu lintas data di backend diarahkan melalui satu pintu masuk utama (`api/index.php`), yang kemudian mendelegasikan tugas ke *Controller* yang sesuai lewat proses pendistribusian rute (Routing).
3. **Singleton Pattern:** Diimplementasikan pada layer basis data (`api/Core/Database.php`) untuk memastikan hanya ada satu koneksi database (`PDO`) yang aktif, sehingga sangat hemat memori (Memory Efficient).
4. **JavaScript ES6 Modules:** Seluruh tampilan dan perilaku frontend dipecah ke dalam modul-modul fungsional berdasarkan fitur untuk menghindari *monolithic code* yang sulit dilacak.
5. **ACID Transactions:** Pada proses Checkout Transaksi memastikan manipulasi kalkulasi uang dan pemotongan stok barang terjadi secara sitematik dan konsisten di database. Jika satu query gagal, proses keseluruhan di-rollback (dibatalkan).

## 🛠 Tech Stack (Teknologi)
- **Frontend Utama:** HTML5, CSS3 murni (Vanilla), JavaScript Native (ES6 Modules)
- **Backend Service:** PHP Native (Versi 7.4 / 8.0+)
- **Database:** MySQL relational model diakses menggunakan PHP Data Objects (PDO) wrapper
- **Pustaka Eksternal:** SweetAlert2 (Premium UX Notifications), Lucide (SVGs/Icons), jsPDF (Laporan PDF)

## 📂 Struktur Direktori

Berikut adalah penempatan hierarki direktori pada sistem berdasarkan konsep RPL:

```text
📁 RPL - BENGKEL (Root Directory)
├── 📁 api/ (Backend API & Logic Layer)
│   ├── 📁 Controllers/    # Penghubung antara routing dengan Model (Contoh: AuthController)
│   ├── 📁 Core/           # Inti mesin kerangka MVC utama
│   │   ├── App.php        # Router / Front Controller yang memecah URL request
│   │   ├── Controller.php # Base Controller parent yang melayani response JSON
│   │   └── Database.php   # PDO Singleton Wrapper pengelola koneksi MySQL
│   ├── 📁 Models/         # Data Access Layer / Tempat mengeksekusi SQL (Contoh: SparepartModel)
│   ├── config.php         # Environment/Konfigurasi koneksi (Dibiarkan untuk transisi historis)
│   ├── index.php          # Pintu masuk (Entry-point) semua permintaan Backend Endpoint
│   └── init.php           # Autoloader dan Bootstrapper utama untuk menginisiasi MVC Core
│
├── 📁 css/                # Kumpulan stylesheet
│   └── index.css          # Desain utama terpusat, dengan prinsip token CSS Native
│
├── 📁 js/                 # Konfigurasi Frontend (Tampilan Interface)
│   ├── 📁 views/          # Logika presentasi yang telah dipisahkan per ruang lingkup
│   │   ├── BanksView.js          # Controller tampilan Rekening
│   │   ├── CustomersView.js      # Controller tampilan Pelanggan
│   │   ├── DashboardView.js      # Controller ringkasan statistik aplikasi
│   │   ├── InventoryView.js      # Controller inventori stok barang
│   │   ├── ReportsView.js        # Controller keuangan
│   │   ├── ServicesView.js       # Controller daftar jasa service
│   │   └── TransactionsView.js   # Controller layar kasir (Point of Sales) dan Riwayat
│   ├── api.js             # Utility Client pengirim Request Fetch API Global & UI Toast
│   ├── auth.js            # Mekanisme Manajemen Sesi/Otorisasi peramban
│   └── main.js            # Bootstrapper Frontend UI, dan Router SPA Antarmuka Window utama
│
├── index.html             # Antarmuka SPA ter-rendering (Hanya UI & DOM Elements)
└── kasir_stock.sql        # Skema struktural tabel Relational Database
```

## 🔐 Standar Keamanan Sistem
- **SQL Injection Prevention:** Seluruh interaksi menggunakan *Prepared Statements* milik PDO. Backend tidak menerima string terusan langsung ke basis data.
- **Data Validation & Sanitization:** Input dikelola rapi di *Controller* menggunakan metode penyaringan standar.
- **REST Response Formatting:** Apabila ada suatu sistem yang jatuh (*server failure*) respons ditampilkan dalam JSON yang rapi `{ error: 'Pesan Kesalahan' }`, tanpa membuka baris detail konfigurasi server kepada klien.

## 🚀 Panduan Memulai Cepat (*Quick Start*)
1. Pastikan server lokal terpasang seperti XAMPP terinstal, dan ekstensi **PDO_MySQL** aktif.
2. Buat database baru di `phpMyAdmin`.
3. Import file kerangka tabel `kasir_stock.sql` ke dalam database tersebut.
4. Sesuaikan konfigurasi parameter database di dalam file `api/Core/Database.php` (Server, Username, Password, Database Name).
5. Jalankan project dengan mengakses *localhost*, misal: `http://localhost/RPL%20-%20BENGKEL/`. Sistem mewajibkan akses pada HTTP server, aplikasi tidak dapat dibuka layaknya file dengan peramban `file:///` karena regulasi keamanan **CORS Modules** di sisi *client*.
