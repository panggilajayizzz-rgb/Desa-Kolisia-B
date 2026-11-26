/**
 * js/public.js — Logika Halaman Publik, Peta GPS, Layanan Surat, Bansos, Lapor Warga & BUMDes
 * Catatan: Tidak ada nested template literals maupun inline onclick string mentah.
 */

var PublicApp = (function () {
  var state = {
    homeData: null,
    newsPage: 1,
    newsItems: [],
    produkPage: 1,
    produkItems: [],
    lastTrackedSurat: null,
    mapInstance: null,
    mapMarker: null,
    currentCoords: {
      lat: Number(APP_CONFIG.DEFAULT_VILLAGE.KOORDINAT_LAT),
      lng: Number(APP_CONFIG.DEFAULT_VILLAGE.KOORDINAT_LNG)
    }
  };

  function statusBadgeClass(statusText) {
    var s = String(statusText || '').toLowerCase();
    if (s.indexOf('setuju') !== -1 || s.indexOf('salur') !== -1 || s.indexOf('selesai') !== -1 || s.indexOf('tersedia') !== -1 || s.indexOf('baik') !== -1) {
      return 'status-pill status-ok';
    }
    if (s.indexOf('revisi') !== -1 || s.indexOf('batal') !== -1 || s.indexOf('habis') !== -1 || s.indexOf('berat') !== -1) {
      return 'status-pill status-err';
    }
    return 'status-pill status-warn';
  }

  function badgeNewsClass(kat) {
    var k = String(kat || '').toUpperCase();
    if (k === 'KEGIATAN' || k === 'KESEHATAN') return 'news-badge badge-olive';
    if (k === 'PEMBANGUNAN') return 'news-badge badge-amber';
    return 'news-badge';
  }

  function init() {
    bindNavigationEvents();
    bindSuratEvents();
    bindBansosEvents();
    bindPengaduanEvents();
    bindPemerintahanEvents();
    bindBumdesEvents();
    bindNewsFilters();
    initOrUpdateMap(state.currentCoords.lat, state.currentCoords.lng, 'Kantor Desa Kolisia B', 'Kec. Magepanda, Kab. Sikka, NTT');
    refreshAllPublicData(false);
    checkUrlQrVerify();
    registerPwaServiceWorker();
  }

  function registerPwaServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('sw.js').catch(function () {
        // Abaikan jika browser/origin tidak mengizinkan SW
      });
    }
  }

  function checkUrlQrVerify() {
    var params = new URLSearchParams(window.location.search);
    var qr = params.get('verify');
    if (qr && getGasApiUrl()) {
      switchSuratTab('verifikasi');
      var inp = document.getElementById('inputKodeQr');
      if (inp) inp.value = qr;
      runVerifyQr(qr);
      var sec = document.getElementById('layanan-surat');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function refreshAllPublicData(forceRefresh) {
    var apiUrl = getGasApiUrl();
    var banner = document.getElementById('apiConfigBanner');
    if (!apiUrl) {
      if (banner) banner.classList.remove('hidden');
      renderUnconfiguredState();
      return;
    }
    if (banner) banner.classList.add('hidden');

    ApiClient.get('getPublicHome', {}, { forceRefresh: forceRefresh })
      .then(function (data) {
        state.homeData = data;
        renderHomeProfileAndStats(data);
        renderPublicApbdes(data.apbdes);
        renderPerangkatList(data.perangkat || []);
        renderLembagaList(data.lembaga || []);
      })
      .catch(function (err) {
        showToast(err.message || 'Gagal memuat ringkasan desa.', 'error');
      });

    loadPublicBerita(forceRefresh);
    loadPublicProduk(forceRefresh);
  }

  function renderUnconfiguredState() {
    var newsEl = document.getElementById('publicNewsGrid');
    var apbEl = document.getElementById('publicApbdesBody');
    var prgEl = document.getElementById('perangkatGrid');
    var lmbEl = document.getElementById('lembagaGrid');
    var prdEl = document.getElementById('publicProdukGrid');

    var noticeHtml = '<div class="empty-state">Menunggu koneksi URL Web App Google Apps Script. Klik <strong>Hubungkan URL API</strong> di atas untuk mulai menampilkan data langsung dari Google Sheets.</div>';
    if (newsEl) newsEl.innerHTML = noticeHtml;
    if (prgEl) prgEl.innerHTML = noticeHtml;
    if (lmbEl) lmbEl.innerHTML = noticeHtml;
    if (prdEl) prdEl.innerHTML = noticeHtml;
    if (apbEl) apbEl.innerHTML = '<tr><td colspan="4" class="text-center">Menunggu koneksi backend Google Sheets...</td></tr>';
  }

  function renderHomeProfileAndStats(data) {
    var p = (data && data.profil) ? data.profil : {};
    var st = (data && data.statistik) ? data.statistik : {};

    var namaDesa = p.NAMA_DESA || 'Desa Kolisia B';
    var kec = p.KECAMATAN || 'Kecamatan Magepanda';
    var kab = p.KABUPATEN || 'Kabupaten Sikka';
    var prov = p.PROVINSI || 'Nusa Tenggara Timur';

    var navTitle = document.getElementById('navVillageName');
    if (navTitle) navTitle.textContent = namaDesa.toUpperCase();

    var heroTitle = document.getElementById('heroTitle');
    if (heroTitle) heroTitle.textContent = p.HERO_JUDUL || ('Selamat Datang di ' + namaDesa);

    var heroSub = document.getElementById('heroSubtitle');
    if (heroSub) heroSub.textContent = p.HERO_SUBJUDUL || (kec + ', ' + kab + ' — Flores, ' + prov);

    var heroBg = document.getElementById('heroBg');
    if (heroBg && p.HERO_GAMBAR_URL) {
      heroBg.style.backgroundImage = 'url("' + escapeHtml(p.HERO_GAMBAR_URL) + '")';
    }

    var elPenduduk = document.getElementById('statPenduduk');
    var elApbdes = document.getElementById('statApbdes');
    var elSurat = document.getElementById('statSurat');
    if (elPenduduk) elPenduduk.textContent = String(st.totalPenduduk || 0);
    if (elApbdes) elApbdes.textContent = String(st.persentaseAPBDes || 0) + '%';
    if (elSurat) elSurat.textContent = String(st.suratTerbit || 0);

    var descEl = document.getElementById('discoverDesc');
    if (descEl && p.DESKRIPSI_LOKASI) descEl.textContent = p.DESKRIPSI_LOKASI;

    var lokDesc = document.getElementById('lokasiDeskripsi');
    if (lokDesc && p.DESKRIPSI_LOKASI) lokDesc.textContent = p.DESKRIPSI_LOKASI;

    var geoAlamat = document.getElementById('geoAlamat');
    if (geoAlamat) geoAlamat.textContent = p.ALAMAT || (namaDesa + ', ' + kec + ', ' + kab);

    var geoLuas = document.getElementById('geoLuas');
    if (geoLuas) geoLuas.textContent = p.LUAS_WILAYAH || '-';

    var geoUS = document.getElementById('geoBatasUS');
    if (geoUS) geoUS.textContent = (p.BATAS_UTARA || '-') + ' / ' + (p.BATAS_SELATAN || '-');

    var geoTB = document.getElementById('geoBatasTB');
    if (geoTB) geoTB.textContent = (p.BATAS_TIMUR || '-') + ' / ' + (p.BATAS_BARAT || '-');

    var lat = parseFloat(p.KOORDINAT_LAT || APP_CONFIG.DEFAULT_VILLAGE.KOORDINAT_LAT);
    var lng = parseFloat(p.KOORDINAT_LNG || APP_CONFIG.DEFAULT_VILLAGE.KOORDINAT_LNG);
    if (!isNaN(lat) && !isNaN(lng)) {
      state.currentCoords = { lat: lat, lng: lng };
      var geoKoor = document.getElementById('geoKoordinat');
      if (geoKoor) geoKoor.textContent = lat.toFixed(6) + ', ' + lng.toFixed(6);
      var routeBtn = document.getElementById('btnGoogleMapsRoute');
      if (routeBtn) {
        routeBtn.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(lat + ',' + lng);
      }
      initOrUpdateMap(lat, lng, 'Kantor ' + namaDesa, p.ALAMAT || (kec + ', ' + kab));
    }

    var fAlamat = document.getElementById('footerAlamat');
    var fTelp = document.getElementById('footerTelp');
    var fEmail = document.getElementById('footerEmail');
    if (fAlamat && p.ALAMAT) fAlamat.textContent = p.ALAMAT;
    if (fTelp && p.TELEPON) fTelp.textContent = 'Telp: ' + p.TELEPON;
    if (fEmail && p.EMAIL) fEmail.textContent = p.EMAIL;
  }

  function initOrUpdateMap(lat, lng, title, alamat) {
    var mapEl = document.getElementById('desaMap');
    if (!mapEl || typeof L === 'undefined') return;

    if (!state.mapInstance) {
      state.mapInstance = L.map('desaMap').setView([lat, lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(state.mapInstance);
      state.mapMarker = L.marker([lat, lng]).addTo(state.mapInstance);
    } else {
      state.mapInstance.setView([lat, lng], 13);
      if (state.mapMarker) {
        state.mapMarker.setLatLng([lat, lng]);
      }
    }
    if (state.mapMarker) {
      state.mapMarker.bindPopup('<strong>' + escapeHtml(title) + '</strong><br>' + escapeHtml(alamat)).openPopup();
    }
  }

  /* ============================================================================
   * BERITA & PAGINATION
   * ============================================================================ */

  function bindNewsFilters() {
    var sInput = document.getElementById('publicNewsSearch');
    var fSelect = document.getElementById('publicNewsFilter');
    if (sInput) {
      sInput.addEventListener('input', debounce(function () {
        state.newsPage = 1;
        loadPublicBerita(false);
      }, 320));
    }
    if (fSelect) {
      fSelect.addEventListener('change', function () {
        state.newsPage = 1;
        loadPublicBerita(false);
      });
    }
    var grid = document.getElementById('publicNewsGrid');
    if (grid) {
      grid.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action="read-berita"]');
        if (!btn) return;
        var kode = btn.getAttribute('data-kode');
        openBeritaDetailModal(kode);
      });
    }
    var pag = document.getElementById('publicNewsPagination');
    if (pag) {
      pag.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-news-page]');
        if (!btn) return;
        state.newsPage = parseInt(btn.getAttribute('data-news-page'), 10) || 1;
        loadPublicBerita(false);
      });
    }
  }

  function loadPublicBerita(forceRefresh) {
    if (!getGasApiUrl()) return;
    var search = (document.getElementById('publicNewsSearch') || {}).value || '';
    var filter = (document.getElementById('publicNewsFilter') || {}).value || 'Semua';

    ApiClient.get('listPublicBerita', {
      page: state.newsPage,
      limit: 3,
      search: search,
      filter: filter
    }, { forceRefresh: forceRefresh })
      .then(function (res) {
        state.newsItems = res.items || [];
        renderNewsCards(state.newsItems);
        renderSimplePagination('publicNewsPagination', res, 'data-news-page');
      })
      .catch(function (err) {
        var grid = document.getElementById('publicNewsGrid');
        if (grid) grid.innerHTML = '<div class="empty-state">' + escapeHtml(err.message) + '</div>';
      });
  }

  function renderNewsCards(items) {
    var grid = document.getElementById('publicNewsGrid');
    if (!grid) return;
    if (!items || items.length === 0) {
      grid.innerHTML = '<div class="empty-state">Belum ada berita yang sesuai pencarian.</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var imgHtml = item.gambar
        ? '<img src="' + escapeHtml(item.gambar) + '" alt="' + escapeHtml(item.judul) + '" loading="lazy">'
        : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#5D7A58;font-weight:700;">Desa Kolisia B</div>';
      html += '<article class="news-card">'
        + '<div class="news-thumb">' + imgHtml + '<span class="' + badgeNewsClass(item.kategori) + '">' + escapeHtml(item.kategori) + '</span></div>'
        + '<div class="news-body">'
        + '<h3>' + escapeHtml(item.judul) + '</h3>'
        + '<p>' + escapeHtml(item.ringkasan) + '</p>'
        + '<div class="news-foot"><span>' + escapeHtml(item.tanggal) + '</span>'
        + '<button type="button" class="btn btn-sm btn-secondary" data-action="read-berita" data-kode="' + escapeHtml(item.kode) + '">Baca &rarr;</button>'
        + '</div></div></article>';
    }
    grid.innerHTML = html;
  }

  function openBeritaDetailModal(kode) {
    var found = null;
    for (var i = 0; i < state.newsItems.length; i++) {
      if (state.newsItems[i].kode === kode) {
        found = state.newsItems[i];
        break;
      }
    }
    if (!found) return;
    var imgBlock = found.gambar
      ? '<img src="' + escapeHtml(found.gambar) + '" alt="' + escapeHtml(found.judul) + '" style="width:100%;max-height:240px;object-fit:cover;border-radius:10px;margin-bottom:1rem;">'
      : '';
    var body = imgBlock
      + '<div style="margin-bottom:0.75rem;"><span class="status-pill">' + escapeHtml(found.kategori) + '</span> <small style="color:#5C635E;margin-left:8px;">' + escapeHtml(found.tanggal) + '</small></div>'
      + '<p style="white-space:pre-line;margin:0;line-height:1.7;">' + escapeHtml(found.isi || found.ringkasan) + '</p>';
    openCustomModal(found.judul, body);
  }

  /* ============================================================================
   * LAYANAN SURAT MANDIRI, TRACKING, QR VERIFIKASI & CETAK PDF
   * ============================================================================ */

  function bindSuratEvents() {
    var tabButtons = document.querySelectorAll('[data-surat-tab]');
    for (var i = 0; i < tabButtons.length; i++) {
      tabButtons[i].addEventListener('click', function () {
        switchSuratTab(this.getAttribute('data-surat-tab'));
      });
    }

    var jenisEl = document.getElementById('srtJenis');
    var detailLabel = document.getElementById('srtDetailLabel');
    if (jenisEl && detailLabel) {
      jenisEl.addEventListener('change', function () {
        var v = this.value;
        if (v.indexOf('SKU') !== -1) detailLabel.textContent = 'Nama & Jenis Usaha, Lokasi Usaha *';
        else if (v.indexOf('Kematian') !== -1) detailLabel.textContent = 'Nama Almarhum/ah, Tanggal & Sebab Meninggal *';
        else if (v.indexOf('SKTM') !== -1) detailLabel.textContent = 'Keterangan Pekerjaan/Penghasilan & Tujuan Bantuan';
        else detailLabel.textContent = 'Keterangan Tambahan';
      });
    }

    var formAjukan = document.getElementById('formAjukanSurat');
    if (formAjukan) {
      formAjukan.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = document.getElementById('btnSubmitSurat');
        var box = document.getElementById('suratSuccessBox');
        var payload = {
          jenisSurat: document.getElementById('srtJenis').value,
          nik: document.getElementById('srtNik').value.trim(),
          nama: document.getElementById('srtNama').value.trim(),
          ttl: document.getElementById('srtTtl').value.trim(),
          dusun: document.getElementById('srtDusun').value.trim(),
          keperluan: document.getElementById('srtKeperluan').value.trim(),
          detailTambahan: document.getElementById('srtDetail').value.trim()
        };
        setButtonLoading(btn, true, 'Mengirim Pengajuan...', 'Kirim Pengajuan Surat');
        ApiClient.post('submitSurat', payload)
          .then(function (res) {
            formAjukan.reset();
            if (box) {
              box.classList.remove('hidden');
              box.innerHTML = '<strong>Pengajuan Surat Berhasil!</strong><br>Simpan Kode Tracking Anda: <code>' + escapeHtml(res.kodeTracking) + '</code> (Status: ' + escapeHtml(res.status) + '). Gunakan kode ini bersama 4 digit akhir NIK pada tab <strong>Lacak &amp; Cetak PDF</strong>.';
            }
            showToast('Pengajuan surat tercatat: ' + res.kodeTracking, 'success');
          })
          .catch(function (err) {
            showToast(err.message, 'error');
          })
          .finally(function () {
            setButtonLoading(btn, false, '', 'Kirim Pengajuan Surat');
          });
      });
    }

    var formLacak = document.getElementById('formLacakSurat');
    if (formLacak) {
      formLacak.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = document.getElementById('btnLacakSurat');
        var kode = document.getElementById('lacakKode').value.trim();
        var nik4 = document.getElementById('lacakNik4').value.trim();
        var out = document.getElementById('hasilLacakSurat');
        setButtonLoading(btn, true, 'Mencari...', 'Lacak Status');
        ApiClient.get('trackSurat', { kode: kode, nik4: nik4 }, { cacheable: false })
          .then(function (res) {
            state.lastTrackedSurat = res;
            var printBtnHtml = res.status === 'Disetujui'
              ? '<div style="margin-top:0.85rem;"><button type="button" class="btn btn-primary btn-sm" data-action="print-tracked-surat">Cetak / Simpan PDF Surat Resmi</button></div>'
              : '';
            var revHtml = res.catatanRevisi
              ? '<p style="margin:0.5rem 0 0;color:#992A20;"><strong>Catatan Revisi:</strong> ' + escapeHtml(res.catatanRevisi) + '</p>'
              : '';
            if (out) {
              out.innerHTML = '<div class="track-card">'
                + '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">'
                + '<strong>' + escapeHtml(res.jenisSurat) + '</strong>'
                + '<span class="' + statusBadgeClass(res.status) + '">' + escapeHtml(res.status) + '</span>'
                + '</div>'
                + '<p style="margin:0.5rem 0 0;font-size:0.86rem;">Kode: <strong>' + escapeHtml(res.kodeTracking) + '</strong>'
                + (res.nomorSurat ? ' &bull; No. Surat: <strong>' + escapeHtml(res.nomorSurat) + '</strong>' : '') + '</p>'
                + '<p style="margin:0.25rem 0 0;font-size:0.86rem;">Pemohon: ' + escapeHtml(res.namaPemohon) + ' (' + escapeHtml(res.nikTersensor) + ')</p>'
                + '<p style="margin:0.25rem 0 0;font-size:0.82rem;color:#5C635E;">Diajukan: ' + escapeHtml(res.tanggalPengajuan) + (res.disahkanOleh ? ' &bull; Disahkan: ' + escapeHtml(res.disahkanOleh) : '') + '</p>'
                + revHtml
                + printBtnHtml
                + '</div>';
            }
          })
          .catch(function (err) {
            if (out) out.innerHTML = '<div class="empty-state">' + escapeHtml(err.message) + '</div>';
          })
          .finally(function () {
            setButtonLoading(btn, false, '', 'Lacak Status');
          });
      });
    }

    var hasilLacak = document.getElementById('hasilLacakSurat');
    if (hasilLacak) {
      hasilLacak.addEventListener('click', function (e) {
        if (e.target.closest('[data-action="print-tracked-surat"]') && state.lastTrackedSurat) {
          printOfficialLetter(state.lastTrackedSurat);
        }
      });
    }

    var formQr = document.getElementById('formVerifikasiQr');
    if (formQr) {
      formQr.addEventListener('submit', function (e) {
        e.preventDefault();
        runVerifyQr(document.getElementById('inputKodeQr').value.trim());
      });
    }
  }

  function switchSuratTab(tabName) {
    var btns = document.querySelectorAll('[data-surat-tab]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-surat-tab') === tabName);
    }
    var fAjukan = document.getElementById('formAjukanSurat');
    var pLacak = document.getElementById('suratLacakPane');
    var pVerif = document.getElementById('suratVerifikasiPane');
    var sBox = document.getElementById('suratSuccessBox');
    if (sBox) sBox.classList.add('hidden');
    if (fAjukan) fAjukan.classList.toggle('hidden', tabName !== 'ajukan');
    if (pLacak) pLacak.classList.toggle('hidden', tabName !== 'lacak');
    if (pVerif) pVerif.classList.toggle('hidden', tabName !== 'verifikasi');
  }

  function runVerifyQr(qrCode) {
    var btn = document.getElementById('btnCekQr');
    var out = document.getElementById('hasilVerifikasiQr');
    setButtonLoading(btn, true, 'Memeriksa...', 'Verifikasi Keaslian');
    ApiClient.get('verifyQrSurat', { qr: qrCode }, { cacheable: false })
      .then(function (res) {
        if (!out) return;
        if (!res.valid) {
          out.innerHTML = '<div class="track-card" style="border-color:#B9382C;"><strong>TIDAK VALID:</strong> ' + escapeHtml(res.message) + '</div>';
          return;
        }
        out.innerHTML = '<div class="track-card" style="border-color:#5D7A58;">'
          + '<span class="status-pill status-ok">DOKUMEN SAH &amp; TERDAFTAR</span>'
          + '<p style="margin:0.6rem 0 0;"><strong>Nomor Surat:</strong> ' + escapeHtml(res.nomorSurat) + '</p>'
          + '<p style="margin:0.25rem 0 0;"><strong>Jenis Surat:</strong> ' + escapeHtml(res.jenisSurat) + '</p>'
          + '<p style="margin:0.25rem 0 0;"><strong>Pemohon:</strong> ' + escapeHtml(res.namaPemohon) + '</p>'
          + '<p style="margin:0.25rem 0 0;"><strong>Disahkan Oleh:</strong> ' + escapeHtml(res.disahkanOleh) + ' pada ' + escapeHtml(res.tanggalSelesai) + '</p>'
          + '</div>';
      })
      .catch(function (err) {
        if (out) out.innerHTML = '<div class="empty-state">' + escapeHtml(err.message) + '</div>';
      })
      .finally(function () {
        setButtonLoading(btn, false, '', 'Verifikasi Keaslian');
      });
  }

  function printOfficialLetter(surat) {
    var area = document.getElementById('printArea');
    if (!area) return;
    var p = surat.profilDesa || {};
    var verifyUrl = window.location.origin + window.location.pathname + '?verify=' + encodeURIComponent(surat.kodeQr || surat.kodeTracking);
    var qrSvg = renderQrSvgString(verifyUrl, 3);

    area.innerHTML = '<div class="print-kop">'
      + '<h3>PEMERINTAH ' + escapeHtml(p.kabupaten || 'KABUPATEN SIKKA') + '</h3>'
      + '<h3>' + escapeHtml(p.kecamatan || 'KECAMATAN MAGEPANDA') + '</h3>'
      + '<h2>' + escapeHtml(p.namaDesa || 'DESA KOLISIA B') + '</h2>'
      + '<p>' + escapeHtml(p.alamat || 'Jalan Trans Utara Flores, Kec. Magepanda, Kab. Sikka, NTT') + '</p>'
      + '</div>'
      + '<div class="print-title">'
      + '<h4>' + escapeHtml(surat.jenisSurat) + '</h4>'
      + '<p>Nomor: ' + escapeHtml(surat.nomorSurat || '-') + '</p>'
      + '</div>'
      + '<p>Yang bertanda tangan di bawah ini, Kepala ' + escapeHtml(p.namaDesa || 'Desa Kolisia B') + ', ' + escapeHtml(p.kecamatan || 'Kecamatan Magepanda') + ', ' + escapeHtml(p.kabupaten || 'Kabupaten Sikka') + ', menerangkan dengan sebenarnya bahwa:</p>'
      + '<table class="print-table">'
      + '<tr><td style="width:180px;">Nama Lengkap</td><td>: <strong>' + escapeHtml(surat.namaPemohon) + '</strong></td></tr>'
      + '<tr><td>NIK</td><td>: ' + escapeHtml(surat.nikAsliUntukCetak || surat.nikTersensor) + '</td></tr>'
      + '<tr><td>Tempat, Tgl Lahir</td><td>: ' + escapeHtml(surat.ttl) + '</td></tr>'
      + '<tr><td>Alamat / Dusun</td><td>: ' + escapeHtml(surat.dusun) + ', Desa Kolisia B</td></tr>'
      + '<tr><td>Keperluan</td><td>: ' + escapeHtml(surat.keperluan) + '</td></tr>'
      + (surat.detailTambahan ? '<tr><td>Keterangan</td><td>: ' + escapeHtml(surat.detailTambahan) + '</td></tr>' : '')
      + '</table>'
      + '<p>Demikian surat keterangan ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.</p>'
      + '<div class="print-sign-row">'
      + '<div class="print-qr-box">' + qrSvg + '<div>Verifikasi Digital:<br><strong>' + escapeHtml(surat.kodeQr || surat.kodeTracking) + '</strong></div></div>'
      + '<div style="text-align:center;">'
      + '<p style="margin:0;">Kolisia B, ' + escapeHtml((surat.tanggalSelesai || '').slice(0, 10)) + '</p>'
      + '<p style="margin:0 0 54px;">Kepala Desa Kolisia B,</p>'
      + '<p style="margin:0;font-weight:bold;text-decoration:underline;">' + escapeHtml(surat.disahkanOleh || p.namaKades || 'Kepala Desa Kolisia B') + '</p>'
      + (p.nipdKades ? '<p style="margin:0;font-size:10pt;">NIPD. ' + escapeHtml(p.nipdKades) + '</p>' : '')
      + '</div></div>';

    setTimeout(function () {
      window.print();
    }, 150);
  }

  /* ============================================================================
   * TRANSPARANSI APBDES & CEK BANSOS
   * ============================================================================ */

  function renderPublicApbdes(apb) {
    if (!apb) return;
    var elTP = document.getElementById('apbTotalPendapatan');
    var elRP = document.getElementById('apbRealPendapatan');
    var elTB = document.getElementById('apbTotalBelanja');
    var elRB = document.getElementById('apbRealBelanja');
    var elPct = document.getElementById('apbPersentase');

    if (elTP) elTP.textContent = formatRupiah(apb.totalPendapatan);
    if (elRP) elRP.textContent = 'Realisasi: ' + formatRupiah(apb.realisasiPendapatan);
    if (elTB) elTB.textContent = formatRupiah(apb.totalBelanja);
    if (elRB) elRB.textContent = 'Realisasi: ' + formatRupiah(apb.realisasiBelanja);
    if (elPct) elPct.textContent = String(apb.persentaseRealisasi || 0) + '%';

    var tbody = document.getElementById('publicApbdesBody');
    if (!tbody) return;
    var list = apb.rincian || [];
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">Belum ada data APBDes.</td></tr>';
      return;
    }
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      html += '<tr>'
        + '<td><strong>' + escapeHtml(r.bidang) + '</strong><br><small style="color:#5C635E;">' + escapeHtml(r.uraian) + '</small></td>'
        + '<td><span class="status-pill">' + escapeHtml(r.jenis) + '</span></td>'
        + '<td>' + formatRupiah(r.anggaran) + '</td>'
        + '<td>' + formatRupiah(r.realisasi) + '</td>'
        + '</tr>';
    }
    tbody.innerHTML = html;
  }

  function bindBansosEvents() {
    var form = document.getElementById('formCekBansos');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = document.getElementById('btnCekBansos');
      var nik = document.getElementById('cekBansosNik').value.trim();
      var out = document.getElementById('hasilCekBansos');
      setButtonLoading(btn, true, 'Mengecek...', 'Cek Status');
      ApiClient.get('cekBansos', { nik: nik }, { cacheable: false })
        .then(function (res) {
          if (!out) return;
          if (!res.found || !res.items || res.items.length === 0) {
            out.innerHTML = '<div class="empty-state">NIK tersebut belum terdaftar pada daftar penerima bantuan aktif. Hubungi perangkat desa jika membutuhkan verifikasi DTKS.</div>';
            return;
          }
          var html = '';
          for (var i = 0; i < res.items.length; i++) {
            var b = res.items[i];
            html += '<div class="track-card">'
              + '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;">'
              + '<strong>' + escapeHtml(b.program) + ' (' + escapeHtml(b.periode) + ')</strong>'
              + '<span class="' + statusBadgeClass(b.status) + '">' + escapeHtml(b.status) + '</span>'
              + '</div>'
              + '<p style="margin:0.4rem 0 0;font-size:0.86rem;">Penerima: <strong>' + escapeHtml(b.namaTersensor) + '</strong> &bull; NIK: ' + escapeHtml(b.nikTersensor) + '</p>'
              + '<p style="margin:0.2rem 0 0;font-size:0.84rem;color:#5C635E;">Wilayah: ' + escapeHtml(b.dusun) + ' &bull; Bentuk: ' + escapeHtml(b.nominal) + '</p>'
              + '</div>';
          }
          out.innerHTML = html;
        })
        .catch(function (err) {
          if (out) out.innerHTML = '<div class="empty-state">' + escapeHtml(err.message) + '</div>';
        })
        .finally(function () {
          setButtonLoading(btn, false, '', 'Cek Status');
        });
    });
  }

  /* ============================================================================
   * LAPOR WARGA (PENGADUAN)
   * ============================================================================ */

  function bindPengaduanEvents() {
    var form = document.getElementById('formLaporWarga');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = document.getElementById('btnSubmitPengaduan');
        var box = document.getElementById('pengaduanSuccessBox');
        var payload = {
          namaPelapor: document.getElementById('aduPelapor').value.trim(),
          kontak: document.getElementById('aduKontak').value.trim(),
          tujuan: document.getElementById('aduTujuan').value,
          kategori: document.getElementById('aduKategori').value,
          judul: document.getElementById('aduJudul').value.trim(),
          isi: document.getElementById('aduIsi').value.trim()
        };
        setButtonLoading(btn, true, 'Mengirim...', 'Kirim Laporan');
        ApiClient.post('submitPengaduan', payload)
          .then(function (res) {
            form.reset();
            if (box) {
              box.classList.remove('hidden');
              box.innerHTML = '<strong>Laporan Terkirim!</strong> Kode Tiket Anda: <code>' + escapeHtml(res.kodeTiket) + '</code>. Simpan kode ini untuk memantau tanggapan Pemdes/BPD.';
            }
            showToast('Laporan terkirim: ' + res.kodeTiket, 'success');
          })
          .catch(function (err) {
            showToast(err.message, 'error');
          })
          .finally(function () {
            setButtonLoading(btn, false, '', 'Kirim Laporan');
          });
      });
    }

    var formLacak = document.getElementById('formLacakPengaduan');
    if (formLacak) {
      formLacak.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = document.getElementById('btnLacakPengaduan');
        var kode = document.getElementById('lacakKodeAduan').value.trim();
        var out = document.getElementById('hasilLacakPengaduan');
        setButtonLoading(btn, true, 'Mengecek...', 'Cek Tiket');
        ApiClient.get('trackPengaduan', { kode: kode }, { cacheable: false })
          .then(function (res) {
            if (!out) return;
            out.innerHTML = '<div class="track-card">'
              + '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;">'
              + '<strong>' + escapeHtml(res.judul) + '</strong>'
              + '<span class="' + statusBadgeClass(res.status) + '">' + escapeHtml(res.status) + '</span>'
              + '</div>'
              + '<p style="margin:0.4rem 0 0;font-size:0.84rem;">Ditujukan ke: <strong>' + escapeHtml(res.tujuan) + '</strong> &bull; Kategori: ' + escapeHtml(res.kategori) + '</p>'
              + '<p style="margin:0.4rem 0 0;font-size:0.86rem;"><strong>Tanggapan Resmi:</strong> ' + escapeHtml(res.tanggapan || 'Menunggu peninjauan petugas desa.') + '</p>'
              + '</div>';
          })
          .catch(function (err) {
            if (out) out.innerHTML = '<div class="empty-state">' + escapeHtml(err.message) + '</div>';
          })
          .finally(function () {
            setButtonLoading(btn, false, '', 'Cek Tiket');
          });
      });
    }
  }

  /* ============================================================================
   * PERANGKAT DESA & LEMBAGA
   * ============================================================================ */

  function bindPemerintahanEvents() {
    var btns = document.querySelectorAll('[data-pem-tab]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        var tab = this.getAttribute('data-pem-tab');
        for (var k = 0; k < btns.length; k++) {
          btns[k].classList.toggle('active', btns[k].getAttribute('data-pem-tab') === tab);
        }
        document.getElementById('perangkatGrid').classList.toggle('hidden', tab !== 'perangkat');
        document.getElementById('lembagaGrid').classList.toggle('hidden', tab !== 'lembaga');
      });
    }
  }

  function renderPerangkatList(items) {
    var el = document.getElementById('perangkatGrid');
    if (!el) return;
    if (!items || items.length === 0) {
      el.innerHTML = '<div class="empty-state">Belum ada data perangkat desa.</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var p = items[i];
      html += '<div class="card-panel">'
        + '<span class="status-pill status-ok">' + escapeHtml(p.jabatan) + '</span>'
        + '<h3 style="margin-top:0.65rem;font-size:1rem;">' + escapeHtml(p.nama) + '</h3>'
        + '<p style="margin:0.2rem 0 0;font-size:0.82rem;color:#5C635E;">NIPD: ' + escapeHtml(p.nipd || '-') + '</p>'
        + '<p style="margin:0.2rem 0 0;font-size:0.82rem;color:#5C635E;">Kontak: ' + escapeHtml(p.noHp || '-') + '</p>'
        + '</div>';
    }
    el.innerHTML = html;
  }

  function renderLembagaList(items) {
    var el = document.getElementById('lembagaGrid');
    if (!el) return;
    if (!items || items.length === 0) {
      el.innerHTML = '<div class="empty-state">Belum ada data lembaga desa.</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var l = items[i];
      html += '<div class="card-panel">'
        + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">'
        + '<h3 style="font-size:1.05rem;">' + escapeHtml(l.nama) + '</h3>'
        + '<span class="status-pill">' + escapeHtml(l.anggota || '-') + '</span>'
        + '</div>'
        + '<p style="margin:0.4rem 0;font-size:0.86rem;color:#5C635E;">' + escapeHtml(l.deskripsi) + '</p>'
        + '<p style="margin:0.35rem 0 0;font-size:0.82rem;"><strong>Ketua:</strong> ' + escapeHtml(l.ketua) + ' &bull; <strong>Kontak:</strong> ' + escapeHtml(l.kontak || '-') + '</p>'
        + '<p style="margin:0.2rem 0 0;font-size:0.82rem;color:#D16014;"><strong>Agenda:</strong> ' + escapeHtml(l.jadwal || '-') + '</p>'
        + '</div>';
    }
    el.innerHTML = html;
  }

  /* ============================================================================
   * BUMDES & MARKETPLACE DESA
   * ============================================================================ */

  function bindBumdesEvents() {
    var sInput = document.getElementById('publicProdukSearch');
    var fSelect = document.getElementById('publicProdukFilter');
    if (sInput) {
      sInput.addEventListener('input', debounce(function () {
        state.produkPage = 1;
        loadPublicProduk(false);
      }, 320));
    }
    if (fSelect) {
      fSelect.addEventListener('change', function () {
        state.produkPage = 1;
        loadPublicProduk(false);
      });
    }
    var grid = document.getElementById('publicProdukGrid');
    if (grid) {
      grid.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action="order-produk"]');
        if (!btn) return;
        openOrderProdukModal(btn.getAttribute('data-kode'));
      });
    }
    var pag = document.getElementById('publicProdukPagination');
    if (pag) {
      pag.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-produk-page]');
        if (!btn) return;
        state.produkPage = parseInt(btn.getAttribute('data-produk-page'), 10) || 1;
        loadPublicProduk(false);
      });
    }
  }

  function loadPublicProduk(forceRefresh) {
    if (!getGasApiUrl()) return;
    var search = (document.getElementById('publicProdukSearch') || {}).value || '';
    var filter = (document.getElementById('publicProdukFilter') || {}).value || 'Semua';

    ApiClient.get('listPublicProduk', {
      page: state.produkPage,
      limit: 3,
      search: search,
      filter: filter
    }, { forceRefresh: forceRefresh })
      .then(function (res) {
        state.produkItems = res.items || [];
        renderProdukCards(state.produkItems);
        renderSimplePagination('publicProdukPagination', res, 'data-produk-page');
      })
      .catch(function (err) {
        var grid = document.getElementById('publicProdukGrid');
        if (grid) grid.innerHTML = '<div class="empty-state">' + escapeHtml(err.message) + '</div>';
      });
  }

  function renderProdukCards(items) {
    var grid = document.getElementById('publicProdukGrid');
    if (!grid) return;
    if (!items || items.length === 0) {
      grid.innerHTML = '<div class="empty-state">Belum ada produk BUMDes yang tersedia.</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var p = items[i];
      var imgHtml = p.gambar
        ? '<img src="' + escapeHtml(p.gambar) + '" alt="' + escapeHtml(p.nama) + '" loading="lazy">'
        : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#5D7A58;font-weight:700;">Produk Desa</div>';
      html += '<article class="news-card">'
        + '<div class="news-thumb">' + imgHtml + '<span class="news-badge badge-olive">' + escapeHtml(p.kategori) + '</span></div>'
        + '<div class="news-body">'
        + '<h3>' + escapeHtml(p.nama) + '</h3>'
        + '<p>' + escapeHtml(p.deskripsi) + '</p>'
        + '<div style="margin-bottom:0.75rem;display:flex;justify-content:space-between;align-items:center;">'
        + '<strong style="color:#D16014;font-size:1.05rem;">' + formatRupiah(p.harga) + ' <small style="color:#5C635E;font-weight:500;">/' + escapeHtml(p.satuan) + '</small></strong>'
        + '<span class="status-pill">Stok: ' + escapeHtml(p.stok) + '</span>'
        + '</div>'
        + '<div class="news-foot"><span style="font-size:0.74rem;">' + escapeHtml(p.penjual) + '</span>'
        + '<button type="button" class="btn btn-primary btn-sm" data-action="order-produk" data-kode="' + escapeHtml(p.kode) + '">Pesan</button>'
        + '</div></div></article>';
    }
    grid.innerHTML = html;
  }

  function openOrderProdukModal(kode) {
    var prod = null;
    for (var i = 0; i < state.produkItems.length; i++) {
      if (state.produkItems[i].kode === kode) {
        prod = state.produkItems[i];
        break;
      }
    }
    if (!prod) return;

    var formHtml = '<p style="margin-top:0;"><strong>' + escapeHtml(prod.nama) + '</strong> — ' + formatRupiah(prod.harga) + ' / ' + escapeHtml(prod.satuan) + ' (Stok: ' + escapeHtml(prod.stok) + ')</p>'
      + '<form id="modalOrderForm">'
      + '<div class="form-group"><label for="ordQty">Jumlah Pesanan *</label><input type="number" id="ordQty" min="1" max="' + escapeHtml(prod.stok) + '" value="1" required></div>'
      + '<div class="form-group"><label for="ordNama">Nama Pembeli *</label><input type="text" id="ordNama" required></div>'
      + '<div class="form-group"><label for="ordHp">Nomor WhatsApp Pembeli *</label><input type="text" id="ordHp" placeholder="0812xxxxxxxx" required></div>'
      + '<div class="form-group"><label for="ordAlamat">Alamat / Dusun Pengiriman *</label><textarea id="ordAlamat" rows="2" required></textarea></div>'
      + '<button type="submit" class="btn btn-primary" id="btnKirimOrder">Buat Pesanan &amp; Lanjut WhatsApp</button>'
      + '</form>';
    openCustomModal('Pesan Produk BUMDes', formHtml);

    var ordForm = document.getElementById('modalOrderForm');
    if (ordForm) {
      ordForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = document.getElementById('btnKirimOrder');
        var payload = {
          kodeProduk: prod.kode,
          jumlah: parseInt(document.getElementById('ordQty').value, 10) || 1,
          namaPembeli: document.getElementById('ordNama').value.trim(),
          noHp: document.getElementById('ordHp').value.trim(),
          alamat: document.getElementById('ordAlamat').value.trim()
        };
        setButtonLoading(btn, true, 'Mencatat Pesanan...', 'Buat Pesanan & Lanjut WhatsApp');
        ApiClient.post('createOrderBUMDes', payload)
          .then(function (res) {
            ApiClient.invalidate('GET_listPublicProduk');
            loadPublicProduk(true);
            var waText = 'Halo Admin BUMDes Kolisia B, saya ingin konfirmasi pesanan:%0A'
              + 'Kode Order: ' + encodeURIComponent(res.kodeOrder) + '%0A'
              + 'Produk: ' + encodeURIComponent(res.namaProduk) + '%0A'
              + 'Jumlah: ' + encodeURIComponent(res.jumlah) + '%0A'
              + 'Total: ' + encodeURIComponent(formatRupiah(res.totalHarga)) + '%0A'
              + 'Nama: ' + encodeURIComponent(payload.namaPembeli) + '%0A'
              + 'Alamat: ' + encodeURIComponent(payload.alamat);
            var waPhone = res.waPenjual || '6281234567890';
            var waUrl = 'https://wa.me/' + waPhone + '?text=' + waText;

            var bodyEl = document.getElementById('appModalBody');
            if (bodyEl) {
              bodyEl.innerHTML = '<div class="info-banner" style="margin-top:0;">'
                + '<strong>Pesanan Berhasil Dicatat!</strong><br>'
                + 'Kode Pesanan: <code>' + escapeHtml(res.kodeOrder) + '</code><br>'
                + 'Total Pembayaran: <strong>' + formatRupiah(res.totalHarga) + '</strong>'
                + '</div>'
                + '<p style="margin:1rem 0;">Klik tombol di bawah untuk melanjutkan pembayaran (COD / Transfer) langsung melalui WhatsApp unit BUMDes.</p>'
                + '<a href="' + waUrl + '" target="_blank" rel="noopener" class="btn btn-primary">Lanjutkan ke WhatsApp Penjual</a>';
            }
            showToast('Order ' + res.kodeOrder + ' tersimpan!', 'success');
          })
          .catch(function (err) {
            showToast(err.message, 'error');
          })
          .finally(function () {
            setButtonLoading(btn, false, '', 'Buat Pesanan & Lanjut WhatsApp');
          });
      });
    }
  }

  /* ============================================================================
   * NAVIGASI, PENCARIAN CEPAT, KONEKSI API MODAL & HELPERS
   * ============================================================================ */

  function bindNavigationEvents() {
    var moreBtn = document.getElementById('moreMenuBtn');
    var moreDrop = document.getElementById('moreMenuDropdown');
    if (moreBtn && moreDrop) {
      moreBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isHidden = moreDrop.classList.toggle('hidden');
        moreBtn.setAttribute('aria-expanded', String(!isHidden));
      });
    }

    var mobileBtn = document.getElementById('mobileMenuBtn');
    var drawer = document.getElementById('mobileDrawer');
    if (mobileBtn && drawer) {
      mobileBtn.addEventListener('click', function () {
        var isHidden = drawer.classList.toggle('hidden');
        mobileBtn.setAttribute('aria-expanded', String(!isHidden));
      });
      drawer.addEventListener('click', function (e) {
        if (e.target.closest('a, button')) {
          drawer.classList.add('hidden');
          mobileBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    var qSearch = document.getElementById('quickSearchBtn');
    if (qSearch) {
      qSearch.addEventListener('click', function () {
        var inp = document.getElementById('publicNewsSearch');
        if (inp) {
          inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(function () { inp.focus(); }, 300);
        }
      });
    }

    document.addEventListener('click', function (e) {
      if (moreDrop && !e.target.closest('.nav-dropdown')) {
        moreDrop.classList.add('hidden');
        if (moreBtn) moreBtn.setAttribute('aria-expanded', 'false');
      }
      var actBtn = e.target.closest('[data-action]');
      if (!actBtn) return;
      var act = actBtn.getAttribute('data-action');
      if (act === 'close-modal') closeCustomModal();
      if (act === 'open-api-modal') openApiConfigModal();
      if (act === 'copy-coords') {
        var text = state.currentCoords.lat.toFixed(6) + ', ' + state.currentCoords.lng.toFixed(6);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            showToast('Koordinat disalin: ' + text, 'success');
          });
        } else {
          showToast('Koordinat GPS: ' + text, 'success');
        }
      }
    });

    var backdrop = document.getElementById('appModalBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closeCustomModal();
      });
    }
  }

  function openApiConfigModal() {
    var currentUrl = getGasApiUrl();
    var html = '<p class="card-desc">Tempel URL Web App Google Apps Script (<code>https://script.google.com/macros/s/.../exec</code>) yang sudah Anda deploy agar website langsung terhubung ke Google Sheets.</p>'
      + '<form id="apiUrlForm">'
      + '<div class="form-group"><label for="inpGasUrl">URL Web App Google Apps Script</label>'
      + '<input type="url" id="inpGasUrl" value="' + escapeHtml(currentUrl) + '" placeholder="https://script.google.com/macros/s/.../exec" required></div>'
      + '<div class="form-footer">'
      + '<button type="button" class="btn btn-secondary" data-action="close-modal">Batal</button>'
      + '<button type="submit" class="btn btn-primary">Simpan &amp; Hubungkan</button>'
      + '</div></form>';
    openCustomModal('Pengaturan Koneksi Backend', html);

    var f = document.getElementById('apiUrlForm');
    if (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var val = document.getElementById('inpGasUrl').value.trim();
        setGasApiUrl(val);
        ApiClient.invalidate();
        closeCustomModal();
        showToast('URL API disimpan. Memuat data desa...', 'success');
        refreshAllPublicData(true);
      });
    }
  }

  function renderSimplePagination(containerId, res, attrName) {
    var el = document.getElementById(containerId);
    if (!el) return;
    if (!res || res.totalPages <= 1) {
      el.innerHTML = res && res.total ? '<span>Menampilkan ' + res.items.length + ' dari ' + res.total + ' data</span>' : '';
      return;
    }
    var prevPage = Math.max(1, res.page - 1);
    var nextPage = Math.min(res.totalPages, res.page + 1);
    el.innerHTML = '<span>Halaman ' + res.page + ' dari ' + res.totalPages + ' (' + res.total + ' data)</span>'
      + '<div class="pagination-btns">'
      + '<button type="button" class="btn btn-secondary btn-sm" ' + attrName + '="' + prevPage + '"' + (res.page <= 1 ? ' disabled' : '') + '>&larr; Sebelumnya</button>'
      + '<button type="button" class="btn btn-secondary btn-sm" ' + attrName + '="' + nextPage + '"' + (res.page >= res.totalPages ? ' disabled' : '') + '>Berikutnya &rarr;</button>'
      + '</div>';
  }

  function debounce(fn, delay) {
    var timer;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }

  return {
    init: init,
    refreshAllPublicData: refreshAllPublicData,
    printOfficialLetter: printOfficialLetter,
    renderSimplePagination: renderSimplePagination,
    statusBadgeClass: statusBadgeClass,
    openApiConfigModal: openApiConfigModal
  };
})();

document.addEventListener('DOMContentLoaded', function () {
  PublicApp.init();
});
