# Kalkulator & Koreksi Masa Kerja Golongan PNS

Kalkulator statis (HTML/CSS/JS murni, tanpa build tool) untuk **menelusuri riwayat pangkat sejak CPNS** dan menghitung ulang Masa Kerja Golongan (MKG) yang seharusnya pada setiap SK Kenaikan Pangkat, lalu membandingkannya dengan MKG yang tercantum di SK &mdash; untuk menemukan SK yang keliru sebelum kesalahan itu menjalar ke SK berikutnya.

## Cara kerja

1. **Data awal CPNS**: TMT CPNS, golongan/ruang awal, dan masa kerja yang diperhitungkan saat CPNS (bila ada, dari pengalaman kerja sebelumnya).
2. **Riwayat SK Kenaikan Pangkat**: tambahkan setiap SK secara berurutan (TMT, golongan/ruang baru, dan opsional MKG yang tercantum di SK tersebut untuk dibandingkan).
3. **Tanggal acuan**: tanggal untuk menghitung MKG dan Masa Kerja Keseluruhan (MKS) yang berjalan pada golongan/ruang terakhir.

Untuk setiap SK, alat ini menghitung:

```
MKG seharusnya = (waktu berjalan sejak TMT SK sebelumnya)
                + (MKG hasil hitung pada SK sebelumnya)
                − (pengurangan bila pindah rumpun golongan)
```

Nilai **hasil hitung** pada satu tahap dipakai sebagai dasar tahap berikutnya (bukan nilai yang tercantum di SK), sehingga satu SK yang salah tidak ikut menjalar ke perhitungan SK-SK sesudahnya. Bila kolom "MKG tercantum dalam SK" diisi, baris tersebut ditandai **Sesuai** atau **Perlu koreksi** beserta selisihnya.

## Dasar aturan

Berdasarkan PP No. 7 Tahun 1977 tentang Peraturan Gaji Pegawai Negeri Sipil, sebagaimana diubah terakhir dengan PP No. 30 Tahun 2015 &mdash; sistem gaji segaris (in-line):

- Pengurangan MKG **hanya** berlaku saat berpindah **rumpun golongan** (I&rarr;II, II&rarr;III), bukan pada kenaikan pangkat reguler di dalam rumpun yang sama (mis. III/a &rarr; III/b).

  | Perpindahan rumpun | Pengurangan MKG |
  |---|---|
  | I &rarr; II | 6 tahun |
  | II &rarr; III | 5 tahun |
  | III &rarr; IV | tidak dikurangi |

- Bila lompatan melewati lebih dari satu batas rumpun sekaligus (kasus langka), pengurangan dijumlahkan per batas yang dilewati.
- Jika hasil pengurangan menjadi minus, MKG ditetapkan minimal **0 tahun 0 bulan**.
- **Masa Kerja Keseluruhan (MKS)** dihitung lurus dari TMT CPNS sampai tanggal acuan (ditambah masa kerja yang diperhitungkan saat CPNS), dan **tidak** dipengaruhi pengurangan segaris ini.

**Catatan:** ini adalah alat bantu untuk penelusuran indikasi kesalahan. Koreksi resmi tetap memerlukan verifikasi dan penetapan oleh BKN/instansi Pembina kepegawaian berdasarkan dokumen SK asli.

## Struktur proyek

```
.
├── index.html          # Form data CPNS, riwayat SK dinamis, tabel hasil
├── assets/
│   ├── style.css        # Tampilan (tema ledger/letterhead)
│   └── script.js        # Logika rantai perhitungan & audit MKG
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

## Mengubah aturan/nilai

Tabel golongan dan besaran pengurangan MKG ada di bagian atas `assets/script.js` (`GOLONGAN`, `URUTAN_RUMPUN`, dan `DEDUKSI_RUMPUN`), sehingga mudah disesuaikan bila ada perubahan regulasi.
