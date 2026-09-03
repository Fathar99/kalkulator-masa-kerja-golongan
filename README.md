# Kalkulator & Koreksi Masa Kerja Golongan PNS

Kalkulator statis (HTML/CSS/JS murni, tanpa build tool) untuk menghitung Masa Kerja Golongan (MKG) yang **seharusnya** pada SK Kenaikan Pangkat terakhir, berdasarkan TMT CPNS dan golongan awal &mdash; untuk memeriksa apakah MKG yang tercantum di SK sudah benar.

## Cara kerja

Cukup dua titik data, **tidak perlu mengisi riwayat SK di tengah-tengah**:

1. **Pengangkatan CPNS**: TMT CPNS, golongan/ruang awal, dan masa kerja yang diperhitungkan saat CPNS (bila ada).
2. **SK Kenaikan Pangkat terakhir**: TMT dan golongan/ruang pada SK terakhir, plus opsional MKG yang tercantum di SK tersebut untuk dibandingkan.
3. **Tanggal acuan**: untuk memproyeksikan MKG dan Masa Kerja Keseluruhan (MKS) yang berjalan sampai hari ini (atau tanggal lain).

Rumusnya:

```
MKG seharusnya = (waktu berjalan dari TMT CPNS sampai TMT SK terakhir)
                + (masa kerja diperhitungkan saat CPNS)
                − (total pengurangan untuk setiap batas rumpun golongan
                   yang dilewati dari golongan awal ke golongan SK terakhir)
```

Pengurangan dihitung otomatis berdasarkan **rumpun** golongan awal dan rumpun golongan pada SK terakhir saja (mis. dari II ke III/b &rarr; satu batas rumpun dilewati &rarr; dikurangi 5 tahun sekali), **tidak** bergantung pada berapa kali kenaikan pangkat reguler terjadi di dalam satu rumpun (mis. II/a&rarr;II/b&rarr;II/c&rarr;II/d tidak menambah pengurangan). Bila melompat lebih dari satu rumpun sekaligus (mis. I ke III), pengurangan dijumlahkan per batas yang dilewati.

Bila kolom "MKG tercantum dalam SK" diisi, hasil hitung dibandingkan dan ditandai **Sesuai** atau **Perlu koreksi** beserta selisihnya.

## Dasar aturan

Berdasarkan PP No. 7 Tahun 1977 tentang Peraturan Gaji Pegawai Negeri Sipil, sebagaimana diubah terakhir dengan PP No. 30 Tahun 2015 &mdash; sistem gaji segaris (in-line):

  | Perpindahan rumpun | Pengurangan MKG |
  |---|---|
  | I &rarr; II | 6 tahun |
  | II &rarr; III | 5 tahun |
  | III &rarr; IV | tidak dikurangi |

- Kenaikan pangkat reguler di dalam rumpun yang sama (mis. III/a &rarr; III/b) tidak dikurangi.
- Jika hasil pengurangan menjadi minus, MKG ditetapkan minimal **0 tahun 0 bulan**.
- **Masa Kerja Keseluruhan (MKS)** dihitung lurus dari TMT CPNS sampai tanggal acuan (ditambah masa kerja yang diperhitungkan saat CPNS), dan **tidak** dipengaruhi pengurangan segaris ini.

**Catatan:** ini adalah alat bantu untuk penelusuran indikasi kesalahan. Koreksi resmi tetap memerlukan verifikasi dan penetapan oleh BKN/instansi Pembina kepegawaian berdasarkan dokumen SK asli.

## Struktur proyek

```
.
├── index.html          # Form CPNS, SK terakhir, tanggal acuan, hasil pemeriksaan
├── assets/
│   ├── style.css        # Tampilan (tema ledger/letterhead)
│   └── script.js        # Logika perhitungan & perbandingan MKG
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

1. Buat repository baru di GitHub (mis. `koreksi-masa-kerja-pns`), lalu push folder ini:

   ```bash
   cd mkg-calculator
   git init
   git add .
   git commit -m "Kalkulator dan koreksi masa kerja golongan PNS"
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

**Jika sebelumnya sudah pernah deploy versi lama** dan setelah update tampilan/perilaku terlihat tidak berubah (mis. dropdown golongan kosong, tombol tidak berfungsi): itu biasanya cache browser menahan `assets/script.js` versi lama. Lakukan hard refresh (Ctrl+Shift+R / Cmd+Shift+R), atau tunggu 1&ndash;2 menit setelah push baru sebelum membuka lagi. File `index.html` di proyek ini sudah memuat `assets/style.css?v=3` dan `assets/script.js?v=3` sebagai penanda versi untuk membantu memaksa browser mengambil salinan terbaru.

## Mengubah aturan/nilai

Tabel golongan dan besaran pengurangan MKG ada di bagian atas `assets/script.js` (`GOLONGAN`, `URUTAN_RUMPUN`, dan `DEDUKSI_RUMPUN`), sehingga mudah disesuaikan bila ada perubahan regulasi.
