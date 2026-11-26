/**
 * js/admin.js — Panel Dashboard Admin & Kepala Desa (Auth, Cache, Auto-ID, PIN Kades, Kalibrasi GPS & Ekspor CSV)
 */

var AdminApp = (function () {
  var state = {
    activeModule: 'surat',
    page: 1,
    search: '',
    filter: 'Semua',
    currentItems: [],
    profilMap: {}
  };

  var MODULE_SCHEMAS = {
    surat: {
      title: 'Pelayanan & Pengesahan Surat',
      filters: ['Semua', 'Menunggu Verifikasi', 'Menunggu Pengesahan Kades', 'Disetujui', 'Perlu Revisi'],
      columns: ['Kode / No. Surat', 'Jenis Surat', 'Pemohon', 'Status', 'Aksi'],
      fields: [
        { name: 'jenisSurat', label: 'Jenis Surat', type: 'select', options: ['Surat Keterangan Usaha (SKU)', 'Surat Keterangan Domisili', 'Surat Keterangan Tidak Mampu (SKTM)', 'Surat Pengantar SKCK', 'Surat Keterangan Kematian'] },
        { name: 'nik', label: 'NIK Pemohon (16 Digit)', type: 'text', required: true },
        { name: 'nama', label: 'Nama Pemohon', type: 'text', required: true },
        { name: 'ttl', label: 'Tempat, Tgl Lahir', type: 'text', required: true },
        { name: 'dusun', label: 'Alamat / Dusun', type: 'text', required: true },
        { name: 'keperluan', label: 'Keperluan', type: 'text', required: true },
        { name: 'detail', label: 'Keterangan Tambahan', type: 'textarea' },
        { name: 'status', label: 'Status Verifikasi', type: 'select', options: ['Menunggu Verifikasi', 'Menunggu Pengesahan Kades', 'Perlu Revisi'] },
        { name: 'catatan', label: 'Catatan Revisi (jika dikembalikan)', type: 'text' }
      ]
    },
    penduduk: {
      title: 'Data Kependudukan',
      filters: ['Semua', 'Aktif', 'Pindah', 'Meninggal'],
      columns: ['Kode', 'NIK / KK', 'Nama Lengkap', 'Dusun / RT', 'Status', 'Aksi'],
      fields: [
        { name: 'nik', label: 'NIK (16 Digit)', type: 'text', required: true },
        { name: 'noKk', label: 'Nomor KK (16 Digit)', type: 'text' },
        { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
        { name: 'jk', label: 'Jenis Kelamin', type: 'select', options: ['Laki-laki', 'Perempuan'] },
        { name: 'ttl', label: 'Tempat, Tgl Lahir', type: 'text', required: true },
        { name: 'dusun', label: 'Dusun', type: 'text', required: true },
        { name: 'rt', label: 'RT', type: 'text' },
        { name: 'pekerjaan', label: 'Pekerjaan', type: 'text' },
        { name: 'status', label: 'Status Kependudukan', type: 'select', options: ['Aktif', 'Pindah', 'Meninggal'] }
      ]
    },
    apbdes: {
      title: 'Keuangan & APBDes',
      filters: ['Semua', 'Pendapatan', 'Belanja', 'Pembiayaan'],
      columns: ['Kode / Tahun', 'Jenis & Bidang', 'Uraian', 'Anggaran / Realisasi', 'Aksi'],
      fields: [
        { name: 'tahun', label: 'Tahun Anggaran', type: 'text', defaultVal: '2026', required: true },
        { name: 'jenis', label: 'Jenis', type: 'select', options: ['Pendapatan', 'Belanja', 'Pembiayaan'] },
        { name: 'bidang', label: 'Bidang', type: 'text', required: true },
        { name: 'uraian', label: 'Uraian Kegiatan', type: 'text', required: true },
        { name: 'anggaran', label: 'Anggaran (Rp)', type: 'number', required: true },
        { name: 'realisasi', label: 'Realisasi (Rp)', type: 'number', required: true },
        { name: 'tanggal', label: 'Tanggal Catat', type: 'date' }
      ]
    },
    bansos: {
      title: 'Transparansi Bantuan Sosial',
      filters: ['Semua', 'BLT', 'DTKS', 'Ketahanan Pangan', 'Penanganan Stunting'],
      columns: ['Kode', 'Penerima / NIK', 'Program & Periode', 'Bentuk', 'Status', 'Aksi'],
      fields: [
        { name: 'nik', label: 'NIK Penerima (16 Digit)', type: 'text', required: true },
        { name: 'nama', label: 'Nama Penerima', type: 'text', required: true },
        { name: 'dusun', label: 'Dusun', type: 'text', required: true },
        { name: 'program', label: 'Program Bantuan', type: 'select', options: ['BLT', 'DTKS', 'Ketahanan Pangan', 'Penanganan Stunting'] },
        { name: 'periode', label: 'Periode Penyaluran', type: 'text', required: true },
        { name: 'nominal', label: 'Nominal / Bentuk Bantuan', type: 'text', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Terjadwal', 'Tersalurkan', 'Menunggu Verifikasi'] }
      ]
    },
    pengaduan: {
      title: 'Lapor Warga (Pemdes & BPD)',
      filters: ['Semua', 'Masuk', 'Ditindaklanjuti', 'Selesai'],
      columns: ['Tiket', 'Pelapor & Tujuan', 'Judul Laporan', 'Status', 'Aksi'],
      fields: [
        { name: 'pelapor', label: 'Nama Pelapor', type: 'text', required: true },
        { name: 'tujuan', label: 'Tujuan', type: 'select', options: ['Pemerintah Desa', 'BPD'] },
        { name: 'kategori', label: 'Kategori', type: 'text', required: true },
        { name: 'judul', label: 'Judul Laporan', type: 'text', required: true },
        { name: 'isi', label: 'Isi Laporan', type: 'textarea', required: true },
        { name: 'status', label: 'Status Tindak Lanjut', type: 'select', options: ['Masuk', 'Ditindaklanjuti', 'Selesai'] },
        { name: 'tanggapan', label: 'Tanggapan Resmi Pemdes / BPD', type: 'textarea' }
      ]
    },
    perangkat: {
      title: 'Manajemen Perangkat Desa',
      filters: ['Semua', 'Aktif', 'Nonaktif'],
      columns: ['Kode', 'NIPD & Nama', 'Jabatan', 'Kontak', 'Status', 'Aksi'],
      fields: [
        { name: 'nipd', label: 'NIPD', type: 'text' },
        { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
        { name: 'jabatan', label: 'Jabatan', type: 'text', required: true },
        { name: 'noHp', label: 'Nomor HP', type: 'text' },
        { name: 'status', label: 'Status Jabatan', type: 'select', options: ['Aktif', 'Nonaktif'] },
        { name: 'foto', label: 'URL Foto (Opsional)', type: 'url' }
      ]
    },
    aset: {
      title: 'Inventaris & Aset Desa',
      filters: ['Semua', 'Tanah Kas Desa', 'Bangunan', 'Kendaraan', 'Inventaris Kantor'],
      columns: ['Kode', 'Nama Barang / Tanah', 'Kategori & Lokasi', 'Nilai & Kondisi', 'Aksi'],
      fields: [
        { name: 'nama', label: 'Nama Barang / Tanah Kas Desa', type: 'text', required: true },
        { name: 'kategori', label: 'Kategori Aset', type: 'select', options: ['Tanah Kas Desa', 'Bangunan', 'Kendaraan', 'Inventaris Kantor'] },
        { name: 'lokasi', label: 'Lokasi', type: 'text', required: true },
        { name: 'tahun', label: 'Tahun Perolehan', type: 'text' },
        { name: 'nilai', label: 'Nilai Perolehan (Rp)', type: 'number', required: true },
        { name: 'kondisi', label: 'Kondisi', type: 'select', options: ['Baik', 'Rusak Ringan', 'Rusak Berat'] },
        { name: 'keterangan', label: 'Keterangan / Luas', type: 'text' }
      ]
    },
    lembaga: {
      title: 'Lembaga Kemasyarakatan Desa',
      filters: ['Semua'],
      columns: ['Kode', 'Nama Lembaga', 'Ketua & Anggota', 'Agenda Kegiatan', 'Aksi'],
      fields: [
        { name: 'nama', label: 'Nama Lembaga (PKK, BPD, Karang Taruna, Posyandu)', type: 'text', required: true },
        { name: 'ketua', label: 'Nama Ketua / Koordinator', type: 'text', required: true },
        { name: 'anggota', label: 'Jumlah Anggota', type: 'text' },
        { name: 'jadwal', label: 'Jadwal / Kegiatan Rutin', type: 'text' },
        { name: 'kontak', label: 'Kontak', type: 'text' },
        { name: 'deskripsi', label: 'Deskripsi Tugas', type: 'textarea' }
      ]
    },
    berita: {
      title: 'Berita & Pengumuman Desa',
      filters: ['Semua', 'TERBIT', 'DRAF'],
      columns: ['Kode', 'Judul & Kategori', 'Tanggal', 'Status', 'Aksi'],
      fields: [
        { name: 'judul', label: 'Judul Berita', type: 'text', required: true },
        { name: 'kategori', label: 'Kategori', type: 'select', options: ['PENGUMUMAN', 'KEGIATAN', 'PEMBANGUNAN', 'KESEHATAN'] },
        { name: 'ringkasan', label: 'Ringkasan Singkat', type: 'text', required: true },
        { name: 'isi', label: 'Isi Lengkap', type: 'textarea', required: true },
        { name: 'gambar', label: 'URL Foto (Opsional)', type: 'url' },
        { name: 'tanggal', label: 'Tanggal Terbit', type: 'date' },
        { name: 'status', label: 'Status Publikasi', type: 'select', options: ['TERBIT', 'DRAF'] }
      ]
    },
    produk: {
      title: 'Produk BUMDes & Marketplace',
      filters: ['Semua', 'Tersedia', 'Habis'],
      columns: ['Kode', 'Produk & Kategori', 'Harga & Stok', 'Penjual / WA', 'Status', 'Aksi'],
      fields: [
        { name: 'nama', label: 'Nama Produk', type: 'text', required: true },
        { name: 'kategori', label: 'Kategori', type: 'select', options: ['Olahan Pangan', 'Kerajinan Lokal', 'Hasil Bumi', 'Jasa BUMDes'] },
        { name: 'harga', label: 'Harga (Rp)', type: 'number', required: true },
        { name: 'stok', label: 'Stok', type: 'number', required: true },
        { name: 'satuan', label: 'Satuan', type: 'text', defaultVal: 'Unit', required: true },
        { name: 'penjual', label: 'Unit BUMDes / Penjual', type: 'text', required: true },
        { name: 'wa', label: 'No. WhatsApp (Format 628...)', type: 'text', required: true },
        { name: 'deskripsi', label: 'Deskripsi Produk', type: 'textarea' },
        { name: 'gambar', label: 'URL Gambar Produk', type: 'url' },
        { name: 'status', label: 'Status', type: 'select', options: ['Tersedia', 'Habis'] }
      ]
    },
    pesanan: {
      title: 'Pesanan Masuk BUMDes',
      filters: ['Semua', 'Menunggu Konfirmasi', 'Diproses', 'Selesai', 'Dibatalkan'],
      columns: ['Kode Order', 'Produk & Qty', 'Pembeli & Alamat', 'Total', 'Status', 'Aksi'],
      fields: [
        { name: 'status', label: 'Status Pesanan', type: 'select', options: ['Menunggu Konfirmasi', 'Diproses', 'Selesai', 'Dibatalkan'] }
      ],
      disableAdd: true
    }
  };

  function init() {
    updateAuthButtonUI();
    bindEvents();
  }

  function updateAuthButtonUI() {
    var btn = document.getElementById('authActionBtn');
    if (!btn) return;
    var session = ApiClient.getSession();
    if (session && session.token) {
      btn.textContent = session.role === 'KADES' ? 'DASHBOARD KADES' : 'DASHBOARD ADMIN';
    } else {
      btn.textContent = 'LOGIN ADMIN';
    }
  }

  function bindEvents() {
    document.addEventListener('click', function (e) {
      var actEl = e.target.closest('[data-action]');
      if (!actEl) return;
      var act = actEl.getAttribute('data-action');
      if (act === 'open-auth') {
        var session = ApiClient.getSession();
        if (session && session.token) openAdminDashboard();
        else openLoginModal();
      } else if (act === 'back-to-public') {
        document.getElementById('adminPanel').classList.add('hidden');
        document.getElementById('publicPortal').classList.remove('hidden');
      } else if (act === 'logout') {
        handleLogout();
      }
    });

    var tabsWrap = document.getElementById('adminModuleTabs');
    if (tabsWrap) {
      tabsWrap.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-module]');
        if (!btn) return;
        switchAdminModule(btn.getAttribute('data-module'));
      });
    }

    var searchEl = document.getElementById('adminSearchInput');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        state.search = this.value.trim();
        state.page = 1;
        loadAdminModuleData(false);
      });
    }

    var filterEl = document.getElementById('adminFilterSelect');
    if (filterEl) {
      filterEl.addEventListener('change', function () {
        state.filter = this.value;
        state.page = 1;
        loadAdminModuleData(false);
      });
    }

    var btnRefresh = document.getElementById('btnAdminRefresh');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', function () {
        ApiClient.invalidate('POST_listModule');
        loadAdminSummary();
        loadAdminModuleData(true);
        showToast('Data disinkronkan dari Google Sheets.', 'success');
      });
    }

    var btnAdd = document.getElementById('btnAdminAdd');
    if (btnAdd) {
      btnAdd.addEventListener('click', function () {
        openRecordFormModal(null);
      });
    }

    var btnExport = document.getElementById('btnAdminExport');
    if (btnExport) {
      btnExport.addEventListener('click', handleExportCsv);
    }

    var tableBody = document.getElementById('adminTableBody');
    if (tableBody) {
      tableBody.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-adm-act]');
        if (!btn) return;
        var act = btn.getAttribute('data-adm-act');
        var id = btn.getAttribute('data-id');
        if (act === 'edit') {
          var item = findCurrentItem(id);
          if (item) openRecordFormModal(item);
        } else if (act === 'delete') {
          openDeleteConfirmModal(id);
        } else if (act === 'sahkan') {
          openKadesPinModal(id);
        } else if (act === 'print') {
          var suratItem = findCurrentItem(id);
          if (suratItem) printSuratFromAdmin(suratItem);
        }
      });
    }

    var pagEl = document.getElementById('adminPagination');
    if (pagEl) {
      pagEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-adm-page]');
        if (!btn) return;
        state.page = parseInt(btn.getAttribute('data-adm-page'), 10) || 1;
        loadAdminModuleData(false);
      });
    }

    var btnDetectGps = document.getElementById('btnDetectGps');
    if (btnDetectGps) {
      btnDetectGps.addEventListener('click', detectCurrentGpsLocation);
    }

    var profilForm = document.getElementById('adminProfilForm');
    if (profilForm) {
      profilForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveProfilAndGps();
      });
    }
  }

  function findCurrentItem(id) {
    for (var i = 0; i < state.currentItems.length; i++) {
      if (state.currentItems[i].id === id) return state.currentItems[i];
    }
    return null;
  }

  function openLoginModal() {
    if (!getGasApiUrl()) {
      showToast('Hubungkan URL API Google Apps Script terlebih dahulu.', 'error');
      PublicApp.openApiConfigModal();
      return;
    }

    var html = '<p class="card-desc">Masuk menggunakan akun <strong>Perangkat Desa (ADMIN)</strong> atau <strong>Kepala Desa (KADES)</strong> untuk mengelola data &amp; mengesahkan surat.</p>'
      + '<form id="loginForm">'
      + '<div class="form-group"><label for="loginUser">Username</label><input type="text" id="loginUser" placeholder="admin atau kades" required></div>'
      + '<div class="form-group"><label for="loginPass">Kata Sandi</label><input type="password" id="loginPass" required></div>'
      + '<div class="form-footer">'
      + '<button type="button" class="btn btn-secondary" data-action="close-modal">Batal</button>'
      + '<button type="submit" class="btn btn-primary" id="btnDoLogin">Masuk Sekarang</button>'
      + '</div></form>';
    openCustomModal('Login Administrasi Desa Kolisia B', html);

    var form = document.getElementById('loginForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = document.getElementById('btnDoLogin');
        var username = document.getElementById('loginUser').value.trim();
        var password = document.getElementById('loginPass').value;
        setButtonLoading(btn, true, 'Memverifikasi...', 'Masuk Sekarang');
        ApiClient.post('login', { username: username, password: password })
          .then(function (res) {
            ApiClient.setSession(res);
            updateAuthButtonUI();
            closeCustomModal();
            showToast('Selamat datang, ' + res.name, 'success');
            openAdminDashboard();
          })
          .catch(function (err) {
            showToast(err.message, 'error');
          })
          .finally(function () {
            setButtonLoading(btn, false, '', 'Masuk Sekarang');
          });
      });
    }
  }

  function handleLogout() {
    ApiClient.post('logout', {}).catch(function () {});
    ApiClient.setSession(null);
    ApiClient.invalidate();
    updateAuthButtonUI();
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('publicPortal').classList.remove('hidden');
    showToast('Anda telah keluar dari panel administrasi.', 'success');
  }

  function openAdminDashboard() {
    var session = ApiClient.getSession();
    if (!session) {
      openLoginModal();
      return;
    }
    document.getElementById('publicPortal').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    document.getElementById('adminRoleBadge').textContent = session.role === 'KADES' ? 'KEPALA DESA (OTORISASI)' : 'ADMIN PERANGKAT DESA';
    document.getElementById('adminGreeting').textContent = session.name + ' — Desa Kolisia B';
    loadAdminSummary();
    switchAdminModule(state.activeModule || 'surat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function loadAdminSummary() {
    ApiClient.post('getAdminSummary', {}, { cacheable: true })
      .then(function (res) {
        var m = res.metrics || {};
        state.profilMap = res.profil || {};
        document.getElementById('admStatPenduduk').textContent = String(m.totalPenduduk || 0);
        document.getElementById('admStatSurat').textContent = String(m.suratPending || 0);
        document.getElementById('admStatSuratKades').textContent = 'Menunggu Pengesahan Kades: ' + String(m.suratTungguKades || 0);
        document.getElementById('admStatAduan').textContent = String(m.pengaduanAktif || 0);
        document.getElementById('admStatOrder').textContent = 'Order BUMDes Menunggu: ' + String(m.orderBumdesMenunggu || 0);
        populateProfilForm(state.profilMap);
      })
      .catch(function (err) {
        showToast(err.message, 'error');
      });
  }

  function switchAdminModule(moduleName) {
    state.activeModule = moduleName;
    state.page = 1;
    state.search = '';
    state.filter = 'Semua';

    var tabs = document.querySelectorAll('#adminModuleTabs .admin-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('active', tabs[i].getAttribute('data-module') === moduleName);
    }

    var tableCont = document.getElementById('adminTableContainer');
    var profForm = document.getElementById('adminProfilForm');
    if (moduleName === 'profil') {
      tableCont.classList.add('hidden');
      profForm.classList.remove('hidden');
      populateProfilForm(state.profilMap);
      return;
    }

    profForm.classList.add('hidden');
    tableCont.classList.remove('hidden');

    var schema = MODULE_SCHEMAS[moduleName];
    document.getElementById('adminSearchInput').value = '';
    var filterEl = document.getElementById('adminFilterSelect');
    var fHtml = '';
    for (var f = 0; f < schema.filters.length; f++) {
      fHtml += '<option value="' + escapeHtml(schema.filters[f]) + '">' + escapeHtml(schema.filters[f]) + '</option>';
    }
    filterEl.innerHTML = fHtml;

    var addBtn = document.getElementById('btnAdminAdd');
    if (addBtn) addBtn.classList.toggle('hidden', Boolean(schema.disableAdd));

    loadAdminModuleData(false);
  }

  function loadAdminModuleData(forceRefresh) {
    var mod = state.activeModule;
    if (mod === 'profil') return;
    var schema = MODULE_SCHEMAS[mod];

    var headEl = document.getElementById('adminTableHead');
    var bodyEl = document.getElementById('adminTableBody');
    var thHtml = '<tr>';
    for (var c = 0; c < schema.columns.length; c++) {
      thHtml += '<th>' + escapeHtml(schema.columns[c]) + '</th>';
    }
    thHtml += '</tr>';
    headEl.innerHTML = thHtml;
    bodyEl.innerHTML = '<tr><td colspan="' + schema.columns.length + '" class="text-center">Memuat data...</td></tr>';

    ApiClient.post('listModule', {
      module: mod,
      page: state.page,
      limit: 10,
      search: state.search,
      filter: state.filter
    }, { cacheable: true, forceRefresh: forceRefresh })
      .then(function (res) {
        state.currentItems = res.items || [];
        renderAdminTableRows(mod, state.currentItems, schema.columns.length);
        PublicApp.renderSimplePagination('adminPagination', res, 'data-adm-page');
      })
      .catch(function (err) {
        bodyEl.innerHTML = '<tr><td colspan="' + schema.columns.length + '" class="text-center">' + escapeHtml(err.message) + '</td></tr>';
      });
  }

  function renderAdminTableRows(mod, items, colCount) {
    var bodyEl = document.getElementById('adminTableBody');
    if (!items || items.length === 0) {
      bodyEl.innerHTML = '<tr><td colspan="' + colCount + '" class="text-center">Belum ada data pada modul ini.</td></tr>';
      return;
    }

    var session = ApiClient.getSession() || {};
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var r = items[i];
      var actions = '<div style="display:flex;gap:0.35rem;flex-wrap:wrap;">'
        + '<button type="button" class="btn btn-secondary btn-sm" data-adm-act="edit" data-id="' + escapeHtml(r.id) + '">Ubah</button>'
        + '<button type="button" class="btn btn-danger btn-sm" data-adm-act="delete" data-id="' + escapeHtml(r.id) + '">Hapus</button>'
        + '</div>';

      if (mod === 'surat') {
        var extraBtn = '';
        if (session.role === 'KADES' && r.status !== 'Disetujui') {
          extraBtn = '<button type="button" class="btn btn-primary btn-sm" data-adm-act="sahkan" data-id="' + escapeHtml(r.id) + '">Sahkan (PIN)</button>';
        }
        if (r.status === 'Disetujui') {
          extraBtn += '<button type="button" class="btn btn-secondary btn-sm" data-adm-act="print" data-id="' + escapeHtml(r.id) + '">Cetak PDF</button>';
        }
        actions = '<div style="display:flex;gap:0.35rem;flex-wrap:wrap;">' + extraBtn
          + '<button type="button" class="btn btn-secondary btn-sm" data-adm-act="edit" data-id="' + escapeHtml(r.id) + '">Proses</button>'
          + '<button type="button" class="btn btn-danger btn-sm" data-adm-act="delete" data-id="' + escapeHtml(r.id) + '">Hapus</button></div>';

        html += '<tr><td><strong>' + escapeHtml(r.id) + '</strong><br><small>' + escapeHtml(r.nomorSurat || 'Belum bernomor') + '</small></td>'
          + '<td>' + escapeHtml(r.jenisSurat) + '<br><small>' + escapeHtml(r.keperluan) + '</small></td>'
          + '<td><strong>' + escapeHtml(r.nama) + '</strong><br><small>NIK: ' + escapeHtml(r.nik) + '</small></td>'
          + '<td><span class="' + PublicApp.statusBadgeClass(r.status) + '">' + escapeHtml(r.status) + '</span></td>'
          + '<td>' + actions + '</td></tr>';
      } else if (mod === 'penduduk') {
        html += '<tr><td>' + escapeHtml(r.id) + '</td><td><strong>' + escapeHtml(r.nik) + '</strong><br><small>KK: ' + escapeHtml(r.noKk || '-') + '</small></td>'
          + '<td><strong>' + escapeHtml(r.nama) + '</strong><br><small>' + escapeHtml(r.jk) + ' &bull; ' + escapeHtml(r.pekerjaan) + '</small></td>'
          + '<td>' + escapeHtml(r.dusun) + ' (RT ' + escapeHtml(r.rt) + ')</td>'
          + '<td><span class="' + PublicApp.statusBadgeClass(r.status) + '">' + escapeHtml(r.status) + '</span></td><td>' + actions + '</td></tr>';
      } else if (mod === 'apbdes') {
        html += '<tr><td><strong>' + escapeHtml(r.id) + '</strong><br><small>' + escapeHtml(r.tahun) + '</small></td>'
          + '<td><span class="status-pill">' + escapeHtml(r.jenis) + '</span><br><small>' + escapeHtml(r.bidang) + '</small></td>'
          + '<td>' + escapeHtml(r.uraian) + '</td>'
          + '<td>Ang: ' + formatRupiah(r.anggaran) + '<br><strong>Real: ' + formatRupiah(r.realisasi) + '</strong></td><td>' + actions + '</td></tr>';
      } else if (mod === 'bansos') {
        html += '<tr><td>' + escapeHtml(r.id) + '</td><td><strong>' + escapeHtml(r.nama) + '</strong><br><small>' + escapeHtml(r.nik) + '</small></td>'
          + '<td><strong>' + escapeHtml(r.program) + '</strong><br><small>' + escapeHtml(r.periode) + '</small></td>'
          + '<td>' + escapeHtml(r.nominal) + '</td>'
          + '<td><span class="' + PublicApp.statusBadgeClass(r.status) + '">' + escapeHtml(r.status) + '</span></td><td>' + actions + '</td></tr>';
      } else if (mod === 'pengaduan') {
        html += '<tr><td><strong>' + escapeHtml(r.id) + '</strong><br><small>' + escapeHtml(r.tanggalLapor) + '</small></td>'
          + '<td>' + escapeHtml(r.pelapor) + '<br><small>Ke: ' + escapeHtml(r.tujuan) + '</small></td>'
          + '<td><strong>' + escapeHtml(r.judul) + '</strong><br><small>' + escapeHtml(r.isi) + '</small></td>'
          + '<td><span class="' + PublicApp.statusBadgeClass(r.status) + '">' + escapeHtml(r.status) + '</span></td><td>' + actions + '</td></tr>';
      } else if (mod === 'perangkat') {
        html += '<tr><td>' + escapeHtml(r.id) + '</td><td><strong>' + escapeHtml(r.nama) + '</strong><br><small>NIPD: ' + escapeHtml(r.nipd || '-') + '</small></td>'
          + '<td>' + escapeHtml(r.jabatan) + '</td><td>' + escapeHtml(r.noHp || '-') + '</td>'
          + '<td><span class="' + PublicApp.statusBadgeClass(r.status) + '">' + escapeHtml(r.status) + '</span></td><td>' + actions + '</td></tr>';
      } else if (mod === 'aset') {
        html += '<tr><td>' + escapeHtml(r.id) + '</td><td><strong>' + escapeHtml(r.nama) + '</strong><br><small>Tahun: ' + escapeHtml(r.tahun) + '</small></td>'
          + '<td>' + escapeHtml(r.kategori) + '<br><small>' + escapeHtml(r.lokasi) + '</small></td>'
          + '<td>' + formatRupiah(r.nilai) + '<br><span class="' + PublicApp.statusBadgeClass(r.kondisi) + '">' + escapeHtml(r.kondisi) + '</span></td><td>' + actions + '</td></tr>';
      } else if (mod === 'lembaga') {
        html += '<tr><td>' + escapeHtml(r.id) + '</td><td><strong>' + escapeHtml(r.nama) + '</strong></td>'
          + '<td>' + escapeHtml(r.ketua) + '<br><small>' + escapeHtml(r.anggota) + '</small></td>'
          + '<td>' + escapeHtml(r.jadwal) + '</td><td>' + actions + '</td></tr>';
      } else if (mod === 'berita') {
        html += '<tr><td>' + escapeHtml(r.id) + '</td><td><strong>' + escapeHtml(r.judul) + '</strong><br><small>' + escapeHtml(r.kategori) + '</small></td>'
          + '<td>' + escapeHtml(r.tanggal) + '</td>'
          + '<td><span class="' + PublicApp.statusBadgeClass(r.status) + '">' + escapeHtml(r.status) + '</span></td><td>' + actions + '</td></tr>';
      } else if (mod === 'produk') {
        html += '<tr><td>' + escapeHtml(r.id) + '</td><td><strong>' + escapeHtml(r.nama) + '</strong><br><small>' + escapeHtml(r.kategori) + '</small></td>'
          + '<td>' + formatRupiah(r.harga) + '<br><small>Stok: ' + escapeHtml(r.stok) + ' ' + escapeHtml(r.satuan) + '</small></td>'
          + '<td>' + escapeHtml(r.penjual) + '<br><small>' + escapeHtml(r.wa) + '</small></td>'
          + '<td><span class="' + PublicApp.statusBadgeClass(r.status) + '">' + escapeHtml(r.status) + '</span></td><td>' + actions + '</td></tr>';
      } else if (mod === 'pesanan') {
        html += '<tr><td><strong>' + escapeHtml(r.id) + '</strong><br><small>' + escapeHtml(r.tanggal) + '</small></td>'
          + '<td>' + escapeHtml(r.namaProduk) + ' (' + escapeHtml(r.jumlah) + 'x)</td>'
          + '<td><strong>' + escapeHtml(r.pembeli) + '</strong><br><small>' + escapeHtml(r.noHp) + ' &bull; ' + escapeHtml(r.alamat) + '</small></td>'
          + '<td><strong>' + formatRupiah(r.total) + '</strong></td>'
          + '<td><span class="' + PublicApp.statusBadgeClass(r.status) + '">' + escapeHtml(r.status) + '</span></td><td>' + actions + '</td></tr>';
      }
    }
    bodyEl.innerHTML = html;
  }

  function openRecordFormModal(existingItem) {
    var mod = state.activeModule;
    var schema = MODULE_SCHEMAS[mod];
    var isEdit = Boolean(existingItem && existingItem.id);

    var fieldsHtml = '<div class="form-group"><label for="fldAutoId">Kode Unik Otomatis</label>'
      + '<input type="text" id="fldAutoId" value="' + escapeHtml(isEdit ? existingItem.id : 'Memuat kode...') + '" readonly></div>';

    for (var i = 0; i < schema.fields.length; i++) {
      var f = schema.fields[i];
      var val = isEdit ? (existingItem[f.name] !== undefined ? existingItem[f.name] : '') : (f.defaultVal || '');
      var reqAttr = f.required ? ' required' : '';
      fieldsHtml += '<div class="form-group"><label for="fld_' + f.name + '">' + escapeHtml(f.label) + (f.required ? ' *' : '') + '</label>';
      if (f.type === 'select') {
        fieldsHtml += '<select id="fld_' + f.name + '"' + reqAttr + '>';
        for (var o = 0; o < f.options.length; o++) {
          var opt = f.options[o];
          var sel = String(val) === String(opt) ? ' selected' : '';
          fieldsHtml += '<option value="' + escapeHtml(opt) + '"' + sel + '>' + escapeHtml(opt) + '</option>';
        }
        fieldsHtml += '</select>';
      } else if (f.type === 'textarea') {
        fieldsHtml += '<textarea id="fld_' + f.name + '" rows="3"' + reqAttr + '>' + escapeHtml(val) + '</textarea>';
      } else {
        fieldsHtml += '<input type="' + escapeHtml(f.type || 'text') + '" id="fld_' + f.name + '" value="' + escapeHtml(val) + '"' + reqAttr + '>';
      }
      fieldsHtml += '</div>';
    }

    var formHtml = '<form id="admRecordForm">' + fieldsHtml
      + '<div class="form-footer">'
      + '<button type="button" class="btn btn-secondary" data-action="close-modal">Batal</button>'
      + '<button type="submit" class="btn btn-primary" id="btnAdmSave">Simpan Data</button>'
      + '</div></form>';

    openCustomModal((isEdit ? 'Ubah ' : 'Tambah ') + schema.title, formHtml);

    if (!isEdit) {
      ApiClient.post('getNextId', { module: mod })
        .then(function (res) {
          var idEl = document.getElementById('fldAutoId');
          if (idEl && res && res.nextId) idEl.value = res.nextId;
        })
        .catch(function () {});
    }

    var formEl = document.getElementById('admRecordForm');
    if (formEl) {
      formEl.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = document.getElementById('btnAdmSave');
        var recordPayload = {};
        if (isEdit) recordPayload.id = existingItem.id;
        for (var k = 0; k < schema.fields.length; k++) {
          var fd = schema.fields[k];
          var el = document.getElementById('fld_' + fd.name);
          recordPayload[fd.name] = el ? el.value.trim() : '';
        }

        setButtonLoading(btn, true, 'Menyimpan...', 'Simpan Data');
        ApiClient.post('saveRecord', { module: mod, isEdit: isEdit, record: recordPayload })
          .then(function (res) {
            ApiClient.invalidate();
            closeCustomModal();
            showToast('Data ' + res.id + ' berhasil disimpan.', 'success');
            loadAdminSummary();
            loadAdminModuleData(true);
            PublicApp.refreshAllPublicData(true);
          })
          .catch(function (err) {
            showToast(err.message, 'error');
          })
          .finally(function () {
            setButtonLoading(btn, false, '', 'Simpan Data');
          });
      });
    }
  }

  function openDeleteConfirmModal(id) {
    var html = '<p>Apakah Anda yakin ingin menghapus data <strong>' + escapeHtml(id) + '</strong>? Tindakan ini tidak dapat dibatalkan.</p>'
      + '<div class="form-footer">'
      + '<button type="button" class="btn btn-secondary" data-action="close-modal">Batal</button>'
      + '<button type="button" class="btn btn-danger" id="btnConfirmDelete">Ya, Hapus Data</button>'
      + '</div>';
    openCustomModal('Konfirmasi Hapus Data', html);

    var btn = document.getElementById('btnConfirmDelete');
    if (btn) {
      btn.addEventListener('click', function () {
        setButtonLoading(btn, true, 'Menghapus...', 'Ya, Hapus Data');
        ApiClient.post('deleteRecord', { module: state.activeModule, id: id })
          .then(function () {
            ApiClient.invalidate();
            closeCustomModal();
            showToast('Data ' + id + ' telah dihapus.', 'success');
            loadAdminSummary();
            loadAdminModuleData(true);
            PublicApp.refreshAllPublicData(true);
          })
          .catch(function (err) {
            showToast(err.message, 'error');
          })
          .finally(function () {
            setButtonLoading(btn, false, '', 'Ya, Hapus Data');
          });
      });
    }
  }

  function openKadesPinModal(kodeTracking) {
    var html = '<p class="card-desc">Anda akan mengesahkan surat <strong>' + escapeHtml(kodeTracking) + '</strong> secara digital. Sistem akan menerbitkan Nomor Surat Resmi &amp; QR Code Verifikasi.</p>'
      + '<form id="kadesPinForm">'
      + '<div class="form-group"><label for="inpKadesPin">PIN Otorisasi Kepala Desa *</label><input type="password" id="inpKadesPin" placeholder="Masukkan PIN Kepala Desa" required></div>'
      + '<div class="form-footer">'
      + '<button type="button" class="btn btn-secondary" data-action="close-modal">Batal</button>'
      + '<button type="submit" class="btn btn-primary" id="btnSubmitPinKades">Sahkan Surat Sekarang</button>'
      + '</div></form>';
    openCustomModal('Pengesahan Digital Kepala Desa', html);

    var form = document.getElementById('kadesPinForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = document.getElementById('btnSubmitPinKades');
        var pin = document.getElementById('inpKadesPin').value.trim();
        setButtonLoading(btn, true, 'Mengesahkan...', 'Sahkan Surat Sekarang');
        ApiClient.post('sahkanSurat', { kodeTracking: kodeTracking, pin: pin })
          .then(function (res) {
            ApiClient.invalidate();
            closeCustomModal();
            showToast('Surat disahkan: ' + res.nomorSurat, 'success');
            loadAdminSummary();
            loadAdminModuleData(true);
            PublicApp.refreshAllPublicData(true);
          })
          .catch(function (err) {
            showToast(err.message, 'error');
          })
          .finally(function () {
            setButtonLoading(btn, false, '', 'Sahkan Surat Sekarang');
          });
      });
    }
  }

  function printSuratFromAdmin(r) {
    var p = state.profilMap || {};
    PublicApp.printOfficialLetter({
      kodeTracking: r.id,
      nomorSurat: r.nomorSurat,
      jenisSurat: r.jenisSurat,
      nikAsliUntukCetak: r.nik,
      namaPemohon: r.nama,
      ttl: r.ttl,
      dusun: r.dusun,
      keperluan: r.keperluan,
      detailTambahan: r.detail,
      disahkanOleh: r.disahkanOleh,
      tanggalSelesai: r.tanggalSelesai,
      kodeQr: r.kodeQr,
      profilDesa: {
        namaDesa: p.NAMA_DESA || 'Desa Kolisia B',
        kecamatan: p.KECAMATAN || 'Kecamatan Magepanda',
        kabupaten: p.KABUPATEN || 'Kabupaten Sikka',
        alamat: p.ALAMAT || '',
        namaKades: p.NAMA_KADES || 'Kepala Desa Kolisia B',
        nipdKades: p.NIPD_KADES || ''
      }
    });
  }

  function handleExportCsv() {
    var mod = state.activeModule;
    if (mod === 'profil') return;
    var btn = document.getElementById('btnAdminExport');
    setButtonLoading(btn, true, 'Menyiapkan...', 'Ekspor CSV');
    ApiClient.post('exportModuleCsv', { module: mod })
      .then(function (res) {
        downloadCsvFile('DesaKolisiaB_' + mod + '.csv', res.headers || [], res.rows || []);
        showToast('File CSV berhasil diunduh.', 'success');
      })
      .catch(function (err) {
        showToast(err.message, 'error');
      })
      .finally(function () {
        setButtonLoading(btn, false, '', 'Ekspor CSV');
      });
  }

  function populateProfilForm(p) {
    if (!p) return;
    var mapFields = {
      profNamaDesa: p.NAMA_DESA || 'Desa Kolisia B',
      profNamaKades: p.NAMA_KADES || '',
      profNipdKades: p.NIPD_KADES || '',
      profLuas: p.LUAS_WILAYAH || '',
      profTelepon: p.TELEPON || '',
      profEmail: p.EMAIL || '',
      profLat: p.KOORDINAT_LAT || '-8.567500',
      profLng: p.KOORDINAT_LNG || '122.043500',
      profAlamat: p.ALAMAT || '',
      profHeroImg: p.HERO_GAMBAR_URL || '',
      profDeskripsiLokasi: p.DESKRIPSI_LOKASI || ''
    };
    for (var id in mapFields) {
      if (mapFields.hasOwnProperty(id)) {
        var el = document.getElementById(id);
        if (el) el.value = mapFields[id];
      }
    }
  }

  function detectCurrentGpsLocation() {
    if (!navigator.geolocation) {
      showToast('Browser Anda tidak mendukung fitur deteksi GPS otomatis.', 'error');
      return;
    }
    var btn = document.getElementById('btnDetectGps');
    setButtonLoading(btn, true, 'Mendeteksi GPS...', 'Ambil Titik GPS Lokasi Saat Ini');
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        document.getElementById('profLat').value = pos.coords.latitude.toFixed(6);
        document.getElementById('profLng').value = pos.coords.longitude.toFixed(6);
        setButtonLoading(btn, false, '', 'Ambil Titik GPS Lokasi Saat Ini');
        showToast('Titik GPS berhasil dideteksi. Jangan lupa klik Simpan!', 'success');
      },
      function (err) {
        setButtonLoading(btn, false, '', 'Ambil Titik GPS Lokasi Saat Ini');
        showToast('Gagal mengambil GPS (' + err.message + '). Pastikan izin lokasi aktif atau isi koordinat manual.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function saveProfilAndGps() {
    var btn = document.getElementById('btnSaveProfil');
    var entries = {
      NAMA_DESA: document.getElementById('profNamaDesa').value.trim(),
      NAMA_KADES: document.getElementById('profNamaKades').value.trim(),
      NIPD_KADES: document.getElementById('profNipdKades').value.trim(),
      LUAS_WILAYAH: document.getElementById('profLuas').value.trim(),
      TELEPON: document.getElementById('profTelepon').value.trim(),
      EMAIL: document.getElementById('profEmail').value.trim(),
      KOORDINAT_LAT: document.getElementById('profLat').value.trim(),
      KOORDINAT_LNG: document.getElementById('profLng').value.trim(),
      ALAMAT: document.getElementById('profAlamat').value.trim(),
      HERO_GAMBAR_URL: document.getElementById('profHeroImg').value.trim(),
      DESKRIPSI_LOKASI: document.getElementById('profDeskripsiLokasi').value.trim()
    };
    setButtonLoading(btn, true, 'Menyimpan...', 'Simpan Perubahan Profil & GPS');
    ApiClient.post('updateProfilDesa', { entries: entries })
      .then(function (res) {
        state.profilMap = res.profil || entries;
        ApiClient.invalidate();
        PublicApp.refreshAllPublicData(true);
        showToast('Profil Desa & Titik Koordinat GPS berhasil disimpan.', 'success');
      })
      .catch(function (err) {
        showToast(err.message, 'error');
      })
      .finally(function () {
        setButtonLoading(btn, false, '', 'Simpan Perubahan Profil & GPS');
      });
  }

  return { init: init };
})();

document.addEventListener('DOMContentLoaded', function () {
  AdminApp.init();
});
