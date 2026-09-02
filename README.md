# Kalkulator Masa Kerja PNS

Kalkulator statis (HTML/CSS/JS murni, tanpa build tool) untuk menghitung:

1. **Masa Kerja Golongan (MKG)** berjalan &mdash; dari TMT SK pangkat terakhir + masa kerja tercantum pada SK.
2. **Simulasi kenaikan golongan** &mdash; menerapkan pengurangan MKG saat pindah rumpun golongan (sistem gaji segaris).
3. **Masa Kerja Keseluruhan (MKS)** &mdash; dari TMT CPNS/PNS + masa kerja sebelumnya (bila ada).

## Dasar aturan yang dipakai

Berdasarkan PP No. 7 Tahun 1977 tentang Peraturan Gaji Pegawai Negeri Sipil, sebagaimana diubah terakhir dengan PP No. 30 Tahun 2015, dan praktik perhitungan yang berlaku di lingkungan BKN/BKPSDM:

- Sistem gaji menganut prinsip **segaris (in-line)**: MKG pada golongan yang lebih tinggi tidak melanjutkan angka MKG golongan sebelumnya secara utuh, melainkan dikurangi mengikuti kesejajaran tabel skala gaji.
- Pengurangan berlaku **hanya saat berpindah rumpun golongan** (I&rarr;II, II&rarr;III, III&rarr;IV), bukan pada kenaikan pangkat reguler di dalam rumpun yang sama (mis. III/a &rarr; III/b).
- Besaran pengurangan:
  | Perpindahan rumpun | Pengurangan MKG |
  |---|---|
  | I &rarr; II | 6 tahun |
  | II &rarr; III | 5 tahun |
  | III &rarr; IV | tidak dikurangi |
- Jika hasil pengurangan menjadi minus, MKG ditetapkan minimal **0 tahun 0 bulan**.

Nilai-nilai ini diverifikasi terhadap beberapa referensi resmi BKPSDM dan konsisten dengan contoh perhitungan yang umum dipakai di lingkungan kepegawaian (mis. II/d MKG 22 th 7 bln naik ke III/a &rarr; 17 th 7 bln).

**Catatan:** ini adalah alat bantu hitung untuk keperluan internal/simulasi. Penetapan MKG resmi tetap mengacu pada SK dan verifikasi BKN/instansi pembina kepegawaian &mdash; selalu cocokkan dengan regulasi terbaru sebelum digunakan untuk keputusan administratif.

## Struktur proyek

```
.
├── index.html          # Markup & tiga panel kalkulator
├── assets/
│   ├── style.css        # Tampilan (tema ledger/letterhead)
│   └── script.js        # Logika perhitungan tanggal & deduksi golongan
└── README.md
```

Tidak ada dependency build (tidak perlu `npm install`). Font dimuat dari Google Fonts via CDN saat halaman dibuka.

## Menjalankan secara lokal

Buka `index.html` langsung di browser, atau jalankan server statis sederhana:

```bash
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

## Deploy ke GitHub Pages

1. Buat repository baru di GitHub (mis. `kalkulator-masa-kerja-pns`), lalu push folder ini:

   ```bash
   cd mkg-calculator
   git init
   git add .
   git commit -m "Kalkulator masa kerja PNS"
   git branch -M main
   git remote add origin https://github.com/<username>/<nama-repo>.git
   git push -u origin main
   ```

2. Di GitHub, buka **Settings &rarr; Pages**.
3. Pada **Build and deployment**, pilih **Source: Deploy from a branch**.
4. Pilih **Branch: `main`**, folder **`/ (root)`**, lalu **Save**.
5. Tunggu 1&ndash;2 menit, situs akan tersedia di:
   `https://<username>.github.io/<nama-repo>/`

Karena ini situs statis murni (tanpa framework), tidak diperlukan GitHub Actions atau langkah build tambahan &mdash; opsi "Deploy from a branch" sudah cukup.

## Mengubah aturan/nilai

Semua tabel golongan dan besaran pengurangan MKG ada di bagian atas `assets/script.js` (`GOLONGAN` dan `DEDUKSI_RUMPUN`), sehingga mudah disesuaikan bila ada perubahan regulasi.
