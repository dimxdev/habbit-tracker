<div align="center">

# 📅 Habbit Tracker

**Aplikasi pelacak kebiasaan & jadwal harian yang ringan, cepat, dan bisa dipakai offline.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa)]()
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)]()

<br />

> 🌙 Dark Mode &nbsp;•&nbsp; 📲 Installable PWA &nbsp;•&nbsp; ✈️ Offline Ready &nbsp;•&nbsp; ⚡ Lazy Loaded

</div>

---

## ✨ Fitur Unggulan

| Fitur | Keterangan |
|-------|-----------|
| 📊 **Dashboard Harian** | Lihat jadwal hari ini sekaligus status tiap slot *(sedang berlangsung / lewat / mendatang)* |
| 🗓️ **Jadwal Mingguan** | Atur jadwal untuk Senin–Minggu, tambah / edit / hapus slot waktu dengan mudah |
| ⚠️ **Deteksi Bentrok** | Otomatis peringatkan jika ada jadwal yang saling tumpang tindih |
| 📋 **Copy Jadwal** | Salin jadwal dari satu hari ke hari lain hanya dengan satu klik |
| 💬 **Kutipan Motivasi** | Kutipan motivasi harian yang berganti otomatis setiap hari |
| 🌙 **Dark Mode** | Toggle tema terang / gelap, pilihan disimpan secara permanen |
| 📤 **Export & Import** | Backup data ke JSON atau ekspor jadwal ke PDF siap cetak |
| 📲 **PWA + Offline** | Install ke home screen & gunakan sepenuhnya tanpa koneksi internet |
| ⚡ **Lazy Loading** | Bundle awal hanya ~239 KB — halaman lain dimuat saat dibutuhkan |
| 💾 **Tanpa Backend** | Semua data tersimpan di `localStorage` — privasi terjaga, tidak ada login |

---

## 🚀 Memulai

### Prasyarat

- [Node.js](https://nodejs.org) versi **18+**
- npm versi **9+**

### Instalasi

```bash
# 1. Clone repositori
git clone https://github.com/dimxdev/habbit-tracker.git
cd habbit-tracker

# 2. Install dependensi
npm install

# 3. Jalankan development server
npm run dev
```

Buka browser di **http://localhost:5173** 🎉

### Build Produksi

```bash
npm run build      # Build untuk produksi
npm run preview    # Preview hasil build secara lokal
```

---

## 🏗️ Struktur Proyek

```
habbit-tracker/
├── public/
│   ├── favicon-32.png          # Favicon 32×32
│   ├── favicon-64.png          # Favicon 64×64
│   ├── apple-touch-icon.png    # Icon iOS 180×180
│   ├── logo-192.png            # PWA icon 192×192
│   ├── logo-512.png            # PWA icon 512×512
│   └── qris.png                # QRIS pembayaran
│
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Wrapper utama (sidebar + bottom nav)
│   │   ├── Sidebar.tsx         # Navigasi desktop
│   │   ├── BottomNav.tsx       # Navigasi mobile
│   │   └── PageHeader.tsx      # Header halaman gradient
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx       # Halaman utama & jadwal hari ini
│   │   ├── Schedule.tsx        # Manajemen jadwal mingguan
│   │   └── Settings.tsx        # Pengaturan tema, data & support
│   │
│   ├── hooks/
│   │   ├── useStorage.ts       # Hook localStorage generic
│   │   └── useTheme.ts         # Hook dark / light mode
│   │
│   ├── utils/
│   │   ├── helpers.ts          # Fungsi utilitas (tanggal, waktu, dll)
│   │   └── pdfExport.ts        # Generator ekspor PDF
│   │
│   ├── data/
│   │   ├── defaultData.ts      # Data awal kosong
│   │   └── motivations.ts      # Koleksi kutipan motivasi
│   │
│   └── types/
│       └── index.ts            # TypeScript interfaces & types
│
├── vite.config.ts              # Konfigurasi Vite + PWA
├── index.html                  # Entry point HTML
└── package.json
```

---

## 🛠️ Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| ⚛️ **React** | 19 | UI Framework |
| 🔷 **TypeScript** | 6 | Type safety |
| 🎨 **Tailwind CSS** | v4 | Styling utility-first |
| ⚡ **Vite** | 8 | Build tool ultra-cepat |
| 🛣️ **React Router** | v7 | Client-side routing |
| 📄 **jsPDF + AutoTable** | latest | Generate & ekspor PDF |
| 🎯 **Lucide React** | latest | Icon library |
| 📲 **vite-plugin-pwa** | latest | Service Worker & Web App Manifest |

---

## 📲 Install sebagai Aplikasi (PWA)

Habbit Tracker bisa dipasang seperti aplikasi native di perangkatmu!

**🤖 Android (Chrome / Edge)**
1. Buka aplikasi di browser
2. Ketuk ikon **⋮** → pilih **"Tambahkan ke layar utama"**

**🍎 iOS (Safari)**
1. Buka aplikasi di Safari
2. Ketuk ikon **□↑** → pilih **"Add to Home Screen"**

**🖥️ Desktop (Chrome / Edge)**
1. Klik ikon **⊕** di address bar kanan
2. Klik **"Install"**

> ✅ Setelah dipasang, aplikasi bisa digunakan **sepenuhnya tanpa koneksi internet!**

---

## ⚡ Performa & Optimasi

Dioptimasi untuk pengguna dengan kuota terbatas 📶

```
📦 Bundle awal (JS)     ~239 KB   (gzip: ~77 KB)
🎨 CSS                  ~32 KB    (gzip: ~6 KB)
📊 Dashboard             ~11 KB   ── dimuat saat buka halaman
🗓️  Schedule             ~13 KB   ── dimuat saat buka halaman
⚙️  Settings + jsPDF    ~439 KB   ── dimuat saat buka halaman
```

**Strategi cache Service Worker (Workbox):**

| Aset | Strategi | Efek |
|------|----------|------|
| JS / CSS / Gambar | Cache First | Instan dari cache |
| Google Fonts stylesheet | Stale While Revalidate | Cepat + update di background |
| Google Fonts file (woff2) | Cache First (1 tahun) | Tidak pernah di-request ulang |
| Navigasi | Network First + Fallback | Konten terbaru, fallback ke cache saat offline |

> 🔁 Kunjungan ke-2 dan seterusnya: **nyaris 0 byte** dari jaringan!

---

## 💾 Manajemen Data

Semua data tersimpan di **localStorage** browser — tidak ada server, tidak ada akun.

| Aksi | Keterangan |
|------|-----------|
| 📤 **Export JSON** | Backup seluruh jadwal ke file `.json` |
| 📥 **Import JSON** | Restore data dari file backup |
| 📄 **Export PDF** | Cetak / simpan jadwal dalam format PDF |
| 🗑️ **Hapus Semua** | Reset seluruh data ke kondisi awal |

---

## 🤝 Kontribusi

Kontribusi sangat disambut! 🙌 Baik itu bug report, ide fitur, atau pull request.

```bash
# 1. Fork repositori ini
# 2. Buat branch fitur baru
git checkout -b feature/fitur-keren

# 3. Commit perubahan kamu
git commit -m "feat: tambah fitur keren"

# 4. Push ke branch
git push origin feature/fitur-keren

# 5. Buat Pull Request 🎉
```

---

## ☕ Support Developer

Aplikasi ini **100% gratis** dan open source.
Kalau bermanfaat, kamu bisa support pengembangannya dengan scan QRIS di bawah 👇

<div align="center">

<img src="public/qris.png" width="200" alt="QRIS Support" />

<br />

Atau kirim feedback & bug report langsung via
**[WhatsApp 💬](https://wa.me/6281212834013)**

</div>

---

## 📄 Lisensi

Proyek ini menggunakan lisensi **MIT** — bebas digunakan, dimodifikasi, dan didistribusikan.

---

<div align="center">


⭐ **Kasih bintang kalau bermanfaat!** ⭐

</div>
