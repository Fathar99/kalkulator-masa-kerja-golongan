(function () {
  "use strict";

  /* ---------- Data: daftar golongan/ruang ---------- */
  var GOLONGAN = [
    "I/a", "I/b", "I/c", "I/d",
    "II/a", "II/b", "II/c", "II/d",
    "III/a", "III/b", "III/c", "III/d",
    "IV/a", "IV/b", "IV/c", "IV/d", "IV/e"
  ];

  /* Pengurangan MKG saat pindah rumpun golongan (sistem gaji segaris,
     PP No. 7/1977 jo. PP No. 30/2015). Kunci = "<rumpun asal>-<rumpun tujuan>".
     Catatan: pindah dari rumpun III ke IV TIDAK dikurangi. */
  var DEDUKSI_RUMPUN = {
    "I-II": { thn: 6, bln: 0 },
    "II-III": { thn: 5, bln: 0 }
  };

  var URUTAN_RUMPUN = ["I", "II", "III", "IV"];

  function rumpun(kode) {
    return kode.split("/")[0];
  }

  function golonganIndex(kode) {
    return GOLONGAN.indexOf(kode);
  }

  /* ---------- Util: durasi tahun/bulan ---------- */
  function normalisasiDurasi(thn, bln) {
    var totalBulan = thn * 12 + bln;
    if (totalBulan < 0) totalBulan = 0;
    return { thn: Math.floor(totalBulan / 12), bln: totalBulan % 12 };
  }

  function formatDurasi(d) {
    var t = d.thn + (d.thn === 1 ? " tahun" : " tahun");
    var b = d.bln + (d.bln === 1 ? " bulan" : " bulan");
    return d.thn + " tahun " + d.bln + " bulan";
  }

  /* Selisih dua tanggal dalam tahun & bulan (hari diabaikan ke bulan penuh terdekat ke bawah,
     mengikuti konvensi tabel gaji yang menghitung dalam satuan bulan). */
  function selisihTahunBulan(mulai, akhir) {
    var y = akhir.getFullYear() - mulai.getFullYear();
    var m = akhir.getMonth() - mulai.getMonth();
    var d = akhir.getDate() - mulai.getDate();
    if (d < 0) { m -= 1; }
    if (m < 0) { y -= 1; m += 12; }
    if (y < 0 || (y === 0 && m < 0)) { y = 0; m = 0; }
    return { thn: y, bln: m };
  }

  function tambahDurasi(a, b) {
    return normalisasiDurasi(a.thn + b.thn, a.bln + b.bln);
  }

  function kurangiDurasi(a, b) {
    return normalisasiDurasi(a.thn - b.thn, a.bln - b.bln);
  }

  function parseTanggal(inputEl) {
    var v = inputEl.value;
    if (!v) return null;
    var parts = v.split("-");
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  /* ---------- Populate <select> golongan ---------- */
  function isiPilihanGolongan(select) {
    GOLONGAN.forEach(function (kode) {
      var opt = document.createElement("option");
      opt.value = kode;
      opt.textContent = "Golongan/ruang " + kode;
      select.appendChild(opt);
    });
  }

  document.querySelectorAll("select#mkg-golongan, select#promosi-golongan-asal, select#promosi-golongan-tujuan")
    .forEach(isiPilihanGolongan);

  /* Default tanggal hitung = hari ini */
  var hariIni = new Date();
  var isoHariIni = hariIni.toISOString().slice(0, 10);
  document.getElementById("mkg-hitung").value = isoHariIni;
  document.getElementById("mks-hitung").value = isoHariIni;

  /* ---------- Tabs ---------- */
  var tombolTab = document.querySelectorAll(".tabs__btn");
  var panel = {
    mkg: document.getElementById("panel-mkg"),
    promosi: document.getElementById("panel-promosi"),
    mks: document.getElementById("panel-mks")
  };
  tombolTab.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tombolTab.forEach(function (b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      Object.keys(panel).forEach(function (key) {
        panel[key].classList.toggle("is-active", key === btn.dataset.tab);
      });
    });
  });

  /* ---------- Kalkulator 1: MKG saat ini ---------- */
  document.getElementById("form-mkg").addEventListener("submit", function (e) {
    e.preventDefault();
    var tmt = parseTanggal(document.getElementById("mkg-tmt"));
    var hitungSampai = parseTanggal(document.getElementById("mkg-hitung"));
    var thnSK = parseInt(document.getElementById("mkg-thn").value || "0", 10);
    var blnSK = parseInt(document.getElementById("mkg-bln").value || "0", 10);
    var golongan = document.getElementById("mkg-golongan").value;

    if (!tmt || !hitungSampai) return;

    var berjalan = selisihTahunBulan(tmt, hitungSampai);
    var mkgTercantum = normalisasiDurasi(thnSK, blnSK);
    var total = tambahDurasi(berjalan, mkgTercantum);

    var hasil = document.getElementById("result-mkg");
    hasil.hidden = false;
    document.getElementById("result-mkg-value").textContent = formatDurasi(total) + "  \u00B7  " + golongan;
    document.getElementById("result-mkg-note").textContent =
      "Berjalan " + formatDurasi(berjalan) + " sejak TMT SK, ditambah masa kerja tercantum " + formatDurasi(mkgTercantum) + " pada SK.";
    hasil.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  /* ---------- Kalkulator 2: Simulasi naik golongan ---------- */
  document.getElementById("form-promosi").addEventListener("submit", function (e) {
    e.preventDefault();
    var asal = document.getElementById("promosi-golongan-asal").value;
    var tujuan = document.getElementById("promosi-golongan-tujuan").value;
    var thn = parseInt(document.getElementById("promosi-thn").value || "0", 10);
    var bln = parseInt(document.getElementById("promosi-bln").value || "0", 10);
    var mkgAwal = normalisasiDurasi(thn, bln);

    var idxAsal = golonganIndex(asal);
    var idxTujuan = golonganIndex(tujuan);
    var hasil = document.getElementById("result-promosi");
    var valueEl = document.getElementById("result-promosi-value");
    var noteEl = document.getElementById("result-promosi-note");
    hasil.hidden = false;

    if (idxTujuan <= idxAsal) {
      valueEl.textContent = "\u2014";
      noteEl.textContent = "Golongan/ruang tujuan harus lebih tinggi dari golongan/ruang saat ini.";
      return;
    }

    var rumpunAsal = rumpun(asal);
    var rumpunTujuan = rumpun(tujuan);

    if (rumpunAsal === rumpunTujuan) {
      // Kenaikan reguler di dalam rumpun yang sama: tidak ada pengurangan.
      valueEl.textContent = formatDurasi(mkgAwal) + "  \u00B7  " + tujuan;
      noteEl.textContent = "Kenaikan pangkat reguler di dalam rumpun golongan " + rumpunAsal + " tidak mengurangi MKG.";
      return;
    }

    var idxRumpunAsal = URUTAN_RUMPUN.indexOf(rumpunAsal);
    var idxRumpunTujuan = URUTAN_RUMPUN.indexOf(rumpunTujuan);
    var lompatSatuRumpun = idxRumpunAsal >= 0 && idxRumpunTujuan === idxRumpunAsal + 1;

    if (!lompatSatuRumpun) {
      valueEl.textContent = "\u2014";
      noteEl.textContent = "Simulasi ini hanya mendukung kenaikan satu rumpun golongan sekaligus (I\u2192II, II\u2192III, III\u2192IV). Untuk lompatan lebih dari satu rumpun, hitung bertahap.";
      return;
    }

    var kunci = rumpunAsal + "-" + rumpunTujuan;
    var deduksi = DEDUKSI_RUMPUN[kunci];

    if (!deduksi) {
      // Pindah rumpun III -> IV: MKG tidak dikurangi.
      valueEl.textContent = formatDurasi(mkgAwal) + "  \u00B7  " + tujuan;
      noteEl.textContent = "Pindah rumpun " + rumpunAsal + " \u2192 " + rumpunTujuan + " tidak mengurangi MKG.";
      return;
    }

    var mkgBaru = kurangiDurasi(mkgAwal, deduksi);
    var totalBulanAwal = mkgAwal.thn * 12 + mkgAwal.bln;
    var totalBulanDeduksi = deduksi.thn * 12 + deduksi.bln;
    var minus = totalBulanDeduksi > totalBulanAwal;

    valueEl.textContent = formatDurasi(mkgBaru) + "  \u00B7  " + tujuan;
    noteEl.textContent = "Pindah rumpun " + rumpunAsal + " \u2192 " + rumpunTujuan + ", MKG dikurangi " + formatDurasi(deduksi) +
      (minus ? ". Hasil pengurangan minus, ditetapkan minimal 0 tahun 0 bulan." : ".");
  });

  /* ---------- Kalkulator 3: Masa Kerja Keseluruhan ---------- */
  document.getElementById("form-mks").addEventListener("submit", function (e) {
    e.preventDefault();
    var tmt = parseTanggal(document.getElementById("mks-tmt"));
    var hitungSampai = parseTanggal(document.getElementById("mks-hitung"));
    var thnSebelum = parseInt(document.getElementById("mks-thn").value || "0", 10);
    var blnSebelum = parseInt(document.getElementById("mks-bln").value || "0", 10);

    if (!tmt || !hitungSampai) return;

    var berjalan = selisihTahunBulan(tmt, hitungSampai);
    var masaSebelum = normalisasiDurasi(thnSebelum, blnSebelum);
    var total = tambahDurasi(berjalan, masaSebelum);

    var hasil = document.getElementById("result-mks");
    hasil.hidden = false;
    document.getElementById("result-mks-value").textContent = formatDurasi(total);
    document.getElementById("result-mks-note").textContent =
      "Berjalan " + formatDurasi(berjalan) + " sejak TMT CPNS/PNS" +
      (masaSebelum.thn || masaSebelum.bln ? ", ditambah masa kerja sebelumnya " + formatDurasi(masaSebelum) + "." : ".");
  });

})();
