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

  function rumpunIndex(kode) {
    return URUTAN_RUMPUN.indexOf(rumpun(kode));
  }

  /* ---------- Util: durasi tahun/bulan ---------- */
  function normalisasiDurasi(thn, bln) {
    var totalBulan = Math.round(thn * 12 + bln);
    if (totalBulan < 0) totalBulan = 0;
    return { thn: Math.floor(totalBulan / 12), bln: totalBulan % 12 };
  }

  function totalBulan(d) {
    return d.thn * 12 + d.bln;
  }

  function formatDurasi(d) {
    return d.thn + " tahun " + d.bln + " bulan";
  }

  function formatTanggal(tgl) {
    var bulanNama = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return tgl.getDate() + " " + bulanNama[tgl.getMonth()] + " " + tgl.getFullYear();
  }

  /* Selisih dua tanggal dalam tahun & bulan. */
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

  function parseTanggalInput(inputEl) {
    var v = inputEl.value;
    if (!v) return null;
    var parts = v.split("-");
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  /* Total pengurangan MKG saat pindah dari golonganAsal ke golonganBaru,
     dijumlahkan per batas rumpun yang dilewati (mendukung lompatan >1 rumpun). */
  function deduksiPindahGolongan(golonganAsal, golonganBaru) {
    var iAsal = rumpunIndex(golonganAsal);
    var iBaru = rumpunIndex(golonganBaru);
    var total = { thn: 0, bln: 0 };
    if (iBaru <= iAsal) return total;
    for (var i = iAsal; i < iBaru; i++) {
      var kunci = URUTAN_RUMPUN[i] + "-" + URUTAN_RUMPUN[i + 1];
      var d = DEDUKSI_RUMPUN[kunci];
      if (d) total = tambahDurasi(total, d);
    }
    return total;
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
  isiPilihanGolongan(document.getElementById("cpns-golongan"));

  /* Default tanggal acuan = hari ini */
  var isoHariIni = new Date().toISOString().slice(0, 10);
  document.getElementById("tanggal-acuan").value = isoHariIni;

  /* ---------- Baris riwayat SK Kenaikan Pangkat (dinamis) ---------- */
  var container = document.getElementById("riwayat-container");
  var template = document.getElementById("template-riwayat-row");

  function beriNomorUlang() {
    var rows = container.querySelectorAll("[data-row]");
    rows.forEach(function (row, idx) {
      row.querySelector("[data-row-title]").textContent = "SK Kenaikan Pangkat ke-" + (idx + 1);
    });
  }

  function tambahBarisRiwayat() {
    var frag = template.content.cloneNode(true);
    var row = frag.querySelector("[data-row]");
    var selectGolongan = row.querySelector("select[data-field='golongan']");
    isiPilihanGolongan(selectGolongan);

    row.querySelector("[data-remove]").addEventListener("click", function () {
      row.remove();
      beriNomorUlang();
    });

    container.appendChild(row);
    beriNomorUlang();
  }

  document.getElementById("btn-tambah-sk").addEventListener("click", tambahBarisRiwayat);

  /* Mulai dengan dua baris riwayat kosong agar form tidak terasa kosong. */
  tambahBarisRiwayat();
  tambahBarisRiwayat();

  /* ---------- Hitung & periksa riwayat ---------- */
  document.getElementById("btn-hitung").addEventListener("click", function () {
    var cpnsTmt = parseTanggalInput(document.getElementById("cpns-tmt"));
    var cpnsGolongan = document.getElementById("cpns-golongan").value;
    var cpnsThn = parseFloat(document.getElementById("cpns-thn").value || "0");
    var cpnsBln = parseFloat(document.getElementById("cpns-bln").value || "0");
    var tanggalAcuan = parseTanggalInput(document.getElementById("tanggal-acuan"));

    if (!cpnsTmt) {
      alert("Isi TMT CPNS terlebih dahulu.");
      return;
    }
    if (!tanggalAcuan) {
      alert("Isi tanggal acuan terlebih dahulu.");
      return;
    }

    /* Kumpulkan baris riwayat yang terisi TMT-nya, urutkan berdasarkan TMT. */
    var barisEl = Array.prototype.slice.call(container.querySelectorAll("[data-row]"));
    var riwayat = [];
    var adaBarisTanpaTmt = false;

    barisEl.forEach(function (row) {
      var tmt = parseTanggalInput(row.querySelector("[data-field='tmt']"));
      var golongan = row.querySelector("[data-field='golongan']").value;
      var thnStr = row.querySelector("[data-field='thn']").value;
      var blnStr = row.querySelector("[data-field='bln']").value;
      if (!tmt) { adaBarisTanpaTmt = true; return; }
      var tercantum = null;
      if (thnStr !== "" || blnStr !== "") {
        tercantum = normalisasiDurasi(parseFloat(thnStr || "0"), parseFloat(blnStr || "0"));
      }
      riwayat.push({ tmt: tmt, golongan: golongan, tercantum: tercantum });
    });

    if (riwayat.length === 0) {
      alert("Tambahkan minimal satu SK Kenaikan Pangkat dengan TMT terisi.");
      return;
    }

    riwayat.sort(function (a, b) { return a.tmt - b.tmt; });

    /* ---------- Rantai perhitungan ---------- */
    var baris = [];
    var prevTmt = cpnsTmt;
    var prevGolongan = cpnsGolongan;
    var prevMkg = normalisasiDurasi(cpnsThn, cpnsBln);

    baris.push({
      label: "Pengangkatan CPNS",
      tmt: cpnsTmt,
      golongan: cpnsGolongan,
      seharusnya: prevMkg,
      tercantum: null,
      status: "empty",
      catatan: "Titik awal riwayat."
    });

    riwayat.forEach(function (r, idx) {
      var berjalan = selisihTahunBulan(prevTmt, r.tmt);
      var sebelumKoreksi = tambahDurasi(prevMkg, berjalan);
      var deduksi = deduksiPindahGolongan(prevGolongan, r.golongan);
      var seharusnya = kurangiDurasi(sebelumKoreksi, deduksi);
      var minus = totalBulan(deduksi) > totalBulan(sebelumKoreksi);

      var status = "empty";
      var catatan = "";
      if (totalBulan(deduksi) > 0) {
        catatan = "Pindah rumpun " + rumpun(prevGolongan) + " \u2192 " + rumpun(r.golongan) +
          ", MKG dikurangi " + formatDurasi(deduksi) + (minus ? " (dibatasi minimal 0 th 0 bl)." : ".");
      } else if (rumpun(prevGolongan) !== rumpun(r.golongan)) {
        catatan = "Pindah rumpun " + rumpun(prevGolongan) + " \u2192 " + rumpun(r.golongan) + ", tidak ada pengurangan.";
      } else {
        catatan = "Kenaikan pangkat reguler di rumpun " + rumpun(r.golongan) + ", tidak ada pengurangan.";
      }

      var selisihTeks = "\u2014";
      if (r.tercantum) {
        var selisihBulan = totalBulan(r.tercantum) - totalBulan(seharusnya);
        if (selisihBulan === 0) {
          status = "ok";
          selisihTeks = "0 bulan";
        } else {
          status = "warn";
          var arah = selisihBulan > 0 ? "lebih besar" : "lebih kecil";
          var absDurasi = normalisasiDurasi(0, Math.abs(selisihBulan));
          selisihTeks = formatDurasi(absDurasi) + " " + arah + " dari seharusnya";
        }
      }

      baris.push({
        label: "SK ke-" + (idx + 1),
        tmt: r.tmt,
        golongan: r.golongan,
        seharusnya: seharusnya,
        tercantum: r.tercantum,
        status: status,
        selisihTeks: selisihTeks,
        catatan: catatan
      });

      /* Rantai memakai nilai HASIL HITUNG (bukan nilai tercantum di SK) sebagai dasar
         tahap berikutnya, supaya kesalahan satu SK tidak ikut menjalar. */
      prevTmt = r.tmt;
      prevGolongan = r.golongan;
      prevMkg = seharusnya;
    });

    /* MKG berjalan pada golongan/ruang terakhir, sampai tanggal acuan. */
    var berjalanAkhir = selisihTahunBulan(prevTmt, tanggalAcuan);
    var mkgSaatIni = tambahDurasi(prevMkg, berjalanAkhir);

    /* MKS: lurus dari TMT CPNS, tidak terpengaruh pengurangan segaris. */
    var berjalanMks = selisihTahunBulan(cpnsTmt, tanggalAcuan);
    var masaAwalCpns = normalisasiDurasi(cpnsThn, cpnsBln);
    var mks = tambahDurasi(berjalanMks, masaAwalCpns);

    renderHasil(baris, prevGolongan, mkgSaatIni, mks, tanggalAcuan);
  });

  function statusBadge(status, teks) {
    var kelas = status === "ok" ? "status--ok" : status === "warn" ? "status--warn" : "status--empty";
    return "<span class=\"status " + kelas + "\">" + teks + "</span>";
  }

  function renderHasil(baris, golonganAkhir, mkgSaatIni, mks, tanggalAcuan) {
    var tbody = document.getElementById("tabel-hasil-body");
    tbody.innerHTML = "";

    baris.forEach(function (b) {
      var tr = document.createElement("tr");

      var statusTeks, statusKelas;
      if (b.status === "ok") { statusTeks = "Sesuai"; statusKelas = "ok"; }
      else if (b.status === "warn") { statusTeks = "Perlu koreksi"; statusKelas = "warn"; }
      else { statusTeks = "Tidak dibandingkan"; statusKelas = "empty"; }

      tr.innerHTML =
        "<td>" + b.label + "<br><span style='font-family:var(--font-sans);color:var(--ink-soft);font-size:12px;'>" + (b.catatan || "") + "</span></td>" +
        "<td>" + formatTanggal(b.tmt) + "</td>" +
        "<td>" + b.golongan + "</td>" +
        "<td>" + formatDurasi(b.seharusnya) + "</td>" +
        "<td>" + (b.tercantum ? formatDurasi(b.tercantum) : "\u2014") + "</td>" +
        "<td>" + (b.selisihTeks || "\u2014") + "</td>" +
        "<td>" + statusBadge(statusKelas, statusTeks) + "</td>";
      tbody.appendChild(tr);
    });

    document.getElementById("ringkasan-mkg").textContent = formatDurasi(mkgSaatIni) + "  \u00B7  " + golonganAkhir;
    document.getElementById("ringkasan-mkg-note").textContent =
      "Per " + formatTanggal(tanggalAcuan) + ", dihitung dari MKG hasil koreksi pada SK terakhir.";
    document.getElementById("ringkasan-mks").textContent = formatDurasi(mks);

    var hasilSection = document.getElementById("hasil-section");
    hasilSection.hidden = false;
    hasilSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

})();
