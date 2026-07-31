# Atlas Daily v0.1

**Tuangkan isi kepala. Pegang yang cukup untuk hari ini.**

Atlas Daily bukan planner yang meminta pengguna merapikan hidupnya ke dalam banyak kolom. Versi pertama ini menguji satu pengalaman inti: mengeluarkan isi kepala, memilih paling banyak 1–3 fokus berdasarkan kapasitas, menyimpan sisanya tanpa rasa bersalah, lalu menutup hari dengan keputusan yang jelas.

## Yang sudah tersedia

- Onboarding ringan tanpa akun.
- Check-in kapasitas: Energi tipis, cukup, atau lapang.
- Brain dump satu hal per baris.
- Keputusan cepat: Hari ini, Nanti, atau Lepaskan.
- Batas fokus otomatis agar hari tidak kembali penuh.
- Halaman Hari Ini tanpa streak, skor, dan kolom berlebihan.
- Tutup Hari: simpan atau lepaskan tugas yang belum selesai.
- Penyimpanan lokal di IndexedDB.
- Ekspor dan impor data pengguna.
- PWA dasar dan dukungan offline setelah kunjungan pertama.
- Struktur repository/service agar backend atau Firebase dapat ditambahkan nanti tanpa membuat ulang UI.

## Menjalankan di komputer

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

## Memeriksa versi produksi

```bash
npm run typecheck
npm run build
npm run preview
```

## Deployment GitHub → Cloudflare Pages

1. Buat repository GitHub baru bernama `atlas-daily`.
2. Unggah seluruh isi folder ini ke repository tersebut.
3. Di Cloudflare Dashboard, buka **Workers & Pages → Create → Pages → Connect to Git**.
4. Pilih repository `atlas-daily`.
5. Gunakan konfigurasi:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js: `20.19` atau lebih baru
6. Deploy.

## Arsitektur yang disiapkan untuk backend nanti

```text
Komponen React
      ↓
AtlasDailyService
      ↓
AtlasDailyRepository (interface)
      ↓
IndexedDbAtlasDailyRepository (saat ini)
```

Saat sinkronisasi cloud dibutuhkan, tambahkan adapter baru, misalnya `FirebaseAtlasDailyRepository`, tanpa mengubah pengalaman utama dan mayoritas komponen React.

## Catatan privasi v0.1

Data disimpan di browser perangkat dan belum dienkripsi dengan PIN. Jangan klaim sebagai penyimpanan terenkripsi. Pengguna perlu mengunduh cadangan sebelum membersihkan data browser atau berpindah perangkat.
