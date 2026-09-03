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
    var total = Math.round(thn * 12 + bln);
    if (total < 0) total = 0;
    return { thn: Math.floor(total / 12), bln: total % 12 };
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

  /* Total pengurangan MKG antara dua golongan, dijumlahkan per batas rumpun
     yang dilewati (mendukung lompatan lebih dari satu rumpun, mis. I -> III). */
  function deduksiPindahGolongan(golonganAsal, golonganBaru) {
    var iAsal = rumpunIndex(golonganAsal);
    var iBaru = rumpunIndex(golonganBaru);
    var total = { thn: 0, bln: 0 };
    if (iAsal < 0 || iBaru < 0 || iBaru <= iAsal) return total;
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
  isiPilihanGolongan(document.getElementById("sk-golongan"));

  /* Default tanggal acuan = hari ini */
  var isoHariIni = new Date().toISOString().slice(0, 10);
  document.getElementById("tanggal-acuan").value = isoHariIni;

  /* ---------- Hitung & periksa ---------- */
  document.getElementById("form-hitung").addEventListener("submit", function (e) {
    e.preventDefault();

    var cpnsTmt = parseTanggalInput(document.getElementById("cpns-tmt"));
    var cpnsGolongan = document.getElementById("cpns-golongan").value;
    var cpnsThn = parseFloat(document.getElementById("cpns-thn").value || "0");
    var cpnsBln = parseFloat(document.getElementById("cpns-bln").value || "0");

    var skTmt = parseTanggalInput(document.getElementById("sk-tmt"));
    var skGolongan = document.getElementById("sk-golongan").value;
    var skThnStr = document.getElementById("sk-thn").value;
    var skBlnStr = document.getElementById("sk-bln").value;

    var tanggalAcuan = parseTanggalInput(document.getElementById("tanggal-acuan"));

    if (!cpnsTmt || !cpnsGolongan) { alert("Lengkapi TMT dan golongan/ruang awal CPNS."); return; }
    if (!skTmt || !skGolongan) { alert("Lengkapi TMT dan golongan/ruang pada SK terakhir."); return; }
    if (!tanggalAcuan) { alert("Isi tanggal acuan."); return; }
    if (skTmt < cpnsTmt) { alert("TMT SK terakhir tidak boleh sebelum TMT CPNS."); return; }

    var masaAwalCpns = normalisasiDurasi(cpnsThn, cpnsBln);

    /* ---- MKG pada SK terakhir ---- */
    var berjalanSampaiSK = selisihTahunBulan(cpnsTmt, skTmt);
    var sebelumDeduksi = tambahDurasi(berjalanSampaiSK, masaAwalCpns);
    var deduksi = deduksiPindahGolongan(cpnsGolongan, skGolongan);
    var mkgSeharusnya = kurangiDurasi(sebelumDeduksi, deduksi);
    var deduksiMelebihi = totalBulan(deduksi) > totalBulan(sebelumDeduksi);

    var mkgTercantum = null;
    if (skThnStr !== "" || skBlnStr !== "") {
      mkgTercantum = normalisasiDurasi(parseFloat(skThnStr || "0"), parseFloat(skBlnStr || "0"));
    }

    /* ---- MKG berjalan saat ini (proyeksi dari SK terakhir ke tanggal acuan) ---- */
    var berjalanSetelahSK = selisihTahunBulan(skTmt, tanggalAcuan > skTmt ? tanggalAcuan : skTmt);
    var mkgSekarang = tambahDurasi(mkgSeharusnya, berjalanSetelahSK);

    /* ---- MKS: lurus dari TMT CPNS, tidak terpengaruh deduksi segaris ---- */
    var berjalanMks = selisihTahunBulan(cpnsTmt, tanggalAcuan > cpnsTmt ? tanggalAcuan : cpnsTmt);
    var mks = tambahDurasi(berjalanMks, masaAwalCpns);

    render({
      berjalanSampaiSK: berjalanSampaiSK,
      masaAwalCpns: masaAwalCpns,
      cpnsGolongan: cpnsGolongan,
      skGolongan: skGolongan,
      deduksi: deduksi,
      deduksiMelebihi: deduksiMelebihi,
      mkgSeharusnya: mkgSeharusnya,
      mkgTercantum: mkgTercantum,
      mkgSekarang: mkgSekarang,
      mks: mks,
      skTmt: skTmt,
      tanggalAcuan: tanggalAcuan
    });
  });

  function statusHTML(status, teks) {
    var kelas = status === "ok" ? "status--ok" : status === "warn" ? "status--warn" : "status--empty";
    return "<span class=\"status " + kelas + "\">" + teks + "</span>";
  }

  function render(r) {
    document.getElementById("hasil-berjalan").textContent =
      formatDurasi(r.berjalanSampaiSK) + (totalBulan(r.masaAwalCpns) > 0 ? " + masa kerja awal " + formatDurasi(r.masaAwalCpns) : "") +
      " = " + formatDurasi(tambahDurasi(r.berjalanSampaiSK, r.masaAwalCpns));

    var barisDeduksi = document.getElementById("baris-deduksi");
    var rumpunAsal = r.cpnsGolongan.split("/")[0];
    var rumpunTujuan = r.skGolongan.split("/")[0];
    if (totalBulan(r.deduksi) > 0) {
      document.getElementById("hasil-deduksi").textContent =
        "Pindah rumpun " + rumpunAsal + " \u2192 " + rumpunTujuan + " : \u2212 " + formatDurasi(r.deduksi) +
        (r.deduksiMelebihi ? " (dibatasi minimal 0 th 0 bl)" : "");
      barisDeduksi.hidden = false;
    } else if (rumpunAsal !== rumpunTujuan) {
      document.getElementById("hasil-deduksi").textContent =
        "Pindah rumpun " + rumpunAsal + " \u2192 " + rumpunTujuan + " : tidak ada pengurangan";
      barisDeduksi.hidden = false;
    } else {
      document.getElementById("hasil-deduksi").textContent = "Tetap di rumpun " + rumpunAsal + " : tidak ada pengurangan";
      barisDeduksi.hidden = false;
    }

    document.getElementById("ringkasan-mkg-sk").textContent = formatDurasi(r.mkgSeharusnya) + "  \u00B7  " + r.skGolongan;

    var noteEl = document.getElementById("ringkasan-mkg-sk-note");
    if (r.mkgTercantum) {
      var selisihBulan = totalBulan(r.mkgTercantum) - totalBulan(r.mkgSeharusnya);
      if (selisihBulan === 0) {
        noteEl.innerHTML = "Tercantum di SK: " + formatDurasi(r.mkgTercantum) + " &mdash; " + statusHTML("ok", "Sesuai");
      } else {
        var arah = selisihBulan > 0 ? "lebih besar" : "lebih kecil";
        var absDurasi = normalisasiDurasi(0, Math.abs(selisihBulan));
        noteEl.innerHTML = "Tercantum di SK: " + formatDurasi(r.mkgTercantum) + " &mdash; " +
          statusHTML("warn", "Perlu koreksi") + " (" + formatDurasi(absDurasi) + " " + arah + " dari seharusnya)";
      }
    } else {
      noteEl.textContent = "Per " + formatTanggal(r.skTmt) + ", TMT SK terakhir.";
    }

    document.getElementById("ringkasan-mkg-sekarang").textContent = formatDurasi(r.mkgSekarang) + "  \u00B7  " + r.skGolongan;
    document.getElementById("ringkasan-mkg-sekarang-note").textContent = "Per " + formatTanggal(r.tanggalAcuan) + ".";

    document.getElementById("ringkasan-mks").textContent = formatDurasi(r.mks);

    var hasilSection = document.getElementById("hasil-section");
    hasilSection.hidden = false;
    hasilSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

})();
