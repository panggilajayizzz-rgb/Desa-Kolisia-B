# Product Requirements Document (PRD) — Website & Sistem Administrasi Terpadu Desa Kolisia B

---
## ZONA ATAS: SPESIFIKASI KEBUTUHAN PRODUK (BLUEPRINT AWAL)

### 1. Nama Projek & Problem Statement
- **Nama Projek:** Portal Publik, Layanan Mandiri & Sistem Administrasi Terpadu **Desa Kolisia B** (Kecamatan Magepanda, Kabupaten Sikka, Flores, Nusa Tenggara Timur)
- **Problem Statement:**
  Pemerintah **Desa Kolisia B, Kec. Magepanda, Kab. Sikka, Flores, NTT** membutuhkan satu sistem terpadu yang menjembatani pelayanan publik modern bagi masyarakat, informasi geografis/lokasi desa yang akurat, serta tata kelola administrasi internal perangkat desa yang tertib:
  1. **Untuk Masyarakat Umum & Pengunjung:** Menyediakan portal informasi desa yang cepat di HP maupun komputer (mendukung pemasangan *PWA / Add to Home Screen* layaknya aplikasi Android), informasi **lokasi wilayah & Peta GPS interaktif** (lengkap dengan petunjuk arah ke Kantor Desa Kolisia B di Kec. Magepanda, Kab. Sikka), layanan pengajuan & pelacakan surat mandiri dari rumah, pencetakan surat berverifikasi QR, pengecekan status bantuan sosial secara aman, kanal pengaduan (*Lapor Warga* ke Pemdes/BPD), serta etalase transaksi produk **BUMDes & Marketplace Desa**.
  2. **Untuk Perangkat Desa & Kepala Desa:** Mengelola data kependudukan, keuangan APBDes, penerima bantuan sosial, pelayanan & arsip surat, kepegawaian perangkat desa, inventaris/aset & tanah kas desa, lembaga kemasyarakatan (PKK, BPD, Karang Taruna, Posyandu), kalibrasi koordinat GPS desa, serta pengesahan surat digital oleh Kepala Desa—dengan database Google Sheets yang gratis, transparan dipantau, dan aman.

---

### 2. Peran Pengguna (3 Level Akses)
1. **Masyarakat Umum (Publik — Tanpa Login):**
   - Mengakses beranda profil Desa Kolisia B, susunan perangkat desa, lembaga desa, berita/agenda, transparansi ringkas APBDes, serta **Peta Lokasi & GPS Desa Kolisia B (Kec. Magepanda, Kab. Sikka, Flores, NTT)** lengkap dengan tombol petunjuk arah Google Maps.
   - Mengajukan **Permohonan Surat Online** (SKU, Domisili, SKTM, Pengantar SKCK, Kematian) dan melacak progresnya lewat **Kode Tracking** (`SRT-YYYYMM-XXX`), serta mengunduh/mencetak surat yang telah disetujui.
   - Memverifikasi keaslian surat melalui pemindaian **QR Code Verifikasi** pada halaman publik.
   - Mengecek status penerima **Bantuan Sosial** (BLT, DTKS, Ketahanan Pangan, Stunting) dengan NIK (hasil nama & NIK disensor otomatis).
   - Mengirimkan aspirasi atau laporan melalui kanal **Lapor Warga** (ditujukan ke **Pemerintah Desa** atau **BPD**) dan memantau status tindak lanjutnya.
   - Menjelajahi **Marketplace BUMDes**, membuat pesanan produk (tercatat ke Google Sheets), dan melanjutkan konfirmasi pembayaran melalui WhatsApp admin BUMDes.
2. **Admin / Perangkat Desa (Login Role: `ADMIN`):**
   - Mengelola seluruh modul administrasi: **Data Penduduk**, **APBDes**, **Bantuan Sosial**, **Berita & Profil Desa** (termasuk kalibrasi koordinat GPS & info wilayah), **Perangkat Desa**, **Aset & Tanah Kas Desa**, **Lembaga Desa**, **Produk & Pesanan BUMDes**, serta memproses **Pengaduan Warga**.
   - Memverifikasi pengajuan surat warga, melengkapi/mengubah status ke *Menunggu Pengesahan Kades* atau *Perlu Revisi*, dan mencetak surat.
   - Mengekspor rekap laporan (APBDes, Bansos, Surat, Aset, Pesanan) ke format **CSV / Siap Cetak**.
3. **Kepala Desa (Login Role: `KADES`):**
   - Mengakses Dashboard Eksekutif (ringkasan statistik kependudukan, realisasi APBDes, pengaduan masuk, dan surat menunggu pengesahan).
   - Melakukan **Pengesahan Digital Surat** menggunakan **PIN Otorisasi Kepala Desa** (khusus `KADES`), yang secara otomatis menerbitkan nomor surat resmi, stempel waktu pengesahan, dan **QR Code Verifikasi** ke database desa.

---

### 3. Arsitektur & Lingkungan Kerja
- **Arsitektur Modular (Direkomendasikan karena mencakup 13+ modul terintegrasi):**
  - **Frontend Statis + PWA (Siap Deploy ke GitHub Pages / Vercel):**
    - `index.html`: Kerangka halaman publik, peta lokasi & GPS, portal layanan mandiri, verifikasi QR surat, dan panel Admin/Kades.
    - `styles.css`: Desain responsif *Mobile-First* berbasis palet referensi (*Warm Alabaster, Forest Green, Terracotta*) + aturan `@media print` presisi A4/F4 untuk cetak surat resmi & laporan.
    - `js/config.js`: Pengaturan URL API Google Apps Script, metadata default **Desa Kolisia B, Kec. Magepanda, Kab. Sikka, Flores, NTT**, dan konstanta UI.
    - `js/api.js`: Lapisan komunikasi CORS-safe, manajemen token sesi, *Client-Side In-Memory Cache*, dan *Optimistic UI*.
    - `js/public.js`: Logika tampilan publik (Beranda, Peta Lokasi & GPS interaktif, Cek Bansos, Pengajuan & Tracking Surat, Cetak Surat + QR, Verifikasi QR, Lapor Warga, Lembaga/Perangkat, BUMDes Checkout + WA).
    - `js/admin.js`: Dashboard Admin & Kades, formulir modal auto-ID, kalibrasi titik GPS kantor desa (*Geolocation API*), validasi PIN pengesahan Kades, tabel paginasi server, dan ekspor CSV.
    - `manifest.json` & `sw.js`: Konfigurasi PWA ringan agar warga Android dapat memasang portal sebagai ikon aplikasi di layar utama HP.
  - **Backend API & Database (Google Apps Script + Google Sheets):**
    - `setup.gs`: Inisialisasi & *Safe Migration* idempoten untuk 13 tab sheet (tanpa karakter `_`) dan data awal bersyarat hanya jika sheet baru dibuat kosong.
    - `code.gs`: Endpoint `doGet` / `doPost`, manajemen autentikasi Admin & Kades (`PropertiesService` & `CacheService`), validasi PIN Kades, paginasi/search/filter murni di server, auto-ID (`LockService`), `getDisplayValues()`, `SpreadsheetApp.flush()`.
    - `helpers.gs`: Pemetaan indeks kolom (`COL`), fungsi sensor privasi, generator nomor surat resmi, dan formatter waktu WITA (`Asia/Makassar` untuk wilayah Flores, NTT).

- **Solusi Teknis Khusus (Technical Reality Check):**
  1. **Pengesahan Digital & QR Verifikasi (Pengganti Sementara BSrE):**
     Karena TTE bersertifikat hukum penuh (BSrE/BSSN) membutuhkan integrasi resmi instansi pemerintah/Diskominfo, sistem menerapkan **Pengesahan Digital Kepala Desa + PIN Otorisasi + QR Code Verifikasi Publik**. Saat QR di-scan, halaman verifikasi mengambil data langsung dari Google Sheets untuk membuktikan keaslian nomor surat, jenis surat, tanggal sah, dan nama pejabat pengesah.
  2. **Peta Interaktif & GPS Lokasi Desa Gratis Tanpa API Key Berbayar:**
     Menggunakan peta interaktif **Leaflet.js (OpenStreetMap)** dan tautan langsung **Google Maps Directions** berdasarkan koordinat `Latitude` & `Longitude` yang disimpan di sheet `ProfilDesa`. Gratis 100% tanpa kartu kredit/API Key berbayar, serta dilengkapi tombol *"Ambil Lokasi GPS Saya"* di panel Admin (berbasis browser *Geolocation API* melalui HTTPS) agar perangkat desa dapat langsung mengkalibrasi titik koordinat kantor desa dengan presisi.
  3. **CORS-Safe POST ke Google Apps Script:**
     Frontend mengirim payload JSON via `POST` dengan `Content-Type: text/plain;charset=utf-8` (menghindari kegagalan *CORS preflight OPTIONS*), lalu `code.gs` mem-parsing lewat `JSON.parse(e.postData.contents)`.
  4. **Keamanan Kredensial:**
     Password `ADMIN`, password `KADES`, dan `PIN_KADES` disimpan di **Script Properties** Google Apps Script (bukan di file JavaScript frontend).
  5. **Alur Transaksi BUMDes:**
     Order pembeli dicatat otomatis ke sheet `PesananBUMDes` (`ORD-YYYYMM-XXX`), lalu mengarahkan ke tautan WhatsApp Admin/Unit BUMDes dengan pesan rincian pesanan otomatis untuk penyelesaian bayar (COD/Transfer).

---

### 4. Alur Kerja Aplikasi (User Flow)
1. **Pelayanan Surat Mandiri & Pengesahan Kades:**
   - Warga pilih menu **Layanan Surat** -> Pilih jenis surat (*SKU, Domisili, SKTM, Pengantar SKCK, Kematian*) -> Isi NIK, Nama, TTL, Dusun, dan Keperluan -> Klik **Ajukan Surat** -> Sistem memberi **Kode Tracking** (`SRT-202611-001`).
   - Perangkat Desa (`ADMIN`) memeriksa antrean surat -> Klik **Proses & Teruskan ke Kades** (atau **Kembalikan untuk Revisi** dengan catatan).
   - Kepala Desa (`KADES`) login -> Buka tab **Pengesahan Surat** -> Klik **Sahkan** & masukkan **PIN Otorisasi Kades** -> Sistem menetapkan Nomor Surat Resmi & mengaktifkan QR Code Verifikasi.
   - Warga cek **Kode Tracking** -> Status berubah menjadi **Disetujui** -> Klik **Unduh / Cetak Surat (PDF)** (tampil format surat resmi ber-kop **Pemerintah Kabupaten Sikka, Kecamatan Magepanda, Desa Kolisia B** + QR Code siap cetak/simpan PDF dalam hitungan detik).
2. **Peta Lokasi & GPS Desa Kolisia B:**
   - Pengunjung melihat seksyen **Lokasi & Peta GPS Desa** (menampilkan posisi **Desa Kolisia B, Kec. Magepanda, Kab. Sikka, Flores, NTT**, titik koordinat `Lat/Lng`, informasi akses wilayah, dan tombol **"Buka Rute GPS (Google Maps)"** yang langsung membuka aplikasi navigasi di HP).
   - Admin dapat memperbarui titik koordinat GPS secara manual atau otomatis lewat tombol deteksi GPS di halaman pengaturan profil desa.
3. **Pengaduan Warga (Lapor Warga):**
   - Warga buka menu **Lapor Warga** -> Pilih tujuan (**Pemerintah Desa** atau **BPD**), kategori, dan isi laporan -> Mendapat **Kode Tiket** (`ADU-202611-001`) untuk melacak tanggapan resmi Admin/BPD.
4. **Cek Bansos & Transparansi:**
   - Warga masukkan NIK -> Sistem menampilkan status program (*BLT, DTKS, Ketahanan Pangan, Stunting*) dengan NIK dan nama tersensor.
5. **BUMDes & Marketplace:**
   - Warga lihat katalog produk desa -> Klik **Pesan Produk** -> Isi jumlah, nama, nomor HP, alamat -> Order tercatat di `PesananBUMDes` & tombol WhatsApp langsung terbuka dengan detail order.
6. **Administrasi Internal (Penduduk, APBDes, Perangkat, Aset, Lembaga, Berita):**
   - Admin mengelola seluruh tabel dengan pencarian, filter, dan paginasi dari backend. Perpindahan antar tab instan (in-memory cache) dan ter-invalidate otomatis setelah tambah/ubah/hapus.

---

### 5. Desain Basis Data (13 Tab Google Sheets — Tanpa Karakter `_`)
> Seluruh pembacaan baris di backend wajib menggunakan konstanta pemetaan indeks kolom (`COL`) berbasis 0.

1. **`ProfilDesa`**
   - Kolom: `0: Kunci`, `1: Nilai`, `2: DiperbaruiPada`
   - Kunci bawaan termasuk: `NAMA_DESA` (`Desa Kolisia B`), `KECAMATAN` (`Kecamatan Magepanda`), `KABUPATEN` (`Kabupaten Sikka`), `PROVINSI` (`Nusa Tenggara Timur`), `WILAYAH_KEPULAUAN` (`Pulau Flores`), `ALAMAT`, `KOORDINAT_LAT` (`-8.5675` — dapat dikalibrasi ulang oleh Admin), `KOORDINAT_LNG` (`122.0435` — dapat dikalibrasi ulang oleh Admin), `DESKRIPSI_LOKASI`, `TELEPON`, `EMAIL`, `HERO_JUDUL`, `HERO_SUBJUDUL`, `HERO_GAMBAR_URL`, `NAMA_KADES`, `LUAS_WILAYAH`.
2. **`InfoBerita`**
   - Kolom: `0: KodeBerita` (`BRT-YYYYMM-XXX`), `1: Judul`, `2: Kategori`, `3: Ringkasan`, `4: IsiLengkap`, `5: GambarURL`, `6: TanggalTerbit`, `7: Status`
3. **`DataPenduduk`**
   - Kolom: `0: KodePenduduk` (`PDD-YYYYMM-XXX`), `1: NIK`, `2: NoKK`, `3: NamaLengkap`, `4: JenisKelamin`, `5: TempatTanggalLahir`, `6: Dusun`, `7: RT`, `8: Pekerjaan`, `9: StatusKependudukan`, `10: DiperbaruiPada`
4. **`DataAPBDes`**
   - Kolom: `0: KodeTransaksi` (`APBD-YYYYMM-XXX`), `1: TahunAnggaran`, `2: Jenis`, `3: Bidang`, `4: Uraian`, `5: Anggaran`, `6: Realisasi`, `7: TanggalCatat`
5. **`DataBansos`**
   - Kolom: `0: KodeBansos` (`BNS-YYYYMM-XXX`), `1: NIK`, `2: NamaPenerima`, `3: Dusun`, `4: ProgramBantuan` (`BLT` / `DTKS` / `Ketahanan Pangan` / `Penanganan Stunting`), `5: Periode`, `6: NominalAtauBentuk`, `7: StatusPenyaluran`, `8: DiperbaruiPada`
6. **`LayananSurat`**
   - Kolom: `0: KodeTracking` (`SRT-YYYYMM-XXX`), `1: NomorSurat`, `2: JenisSurat`, `3: NIKPemohon`, `4: NamaPemohon`, `5: TempatTanggalLahir`, `6: AlamatDusun`, `7: Keperluan`, `8: DetailTambahan`, `9: StatusSurat` (`Menunggu Verifikasi` / `Menunggu Pengesahan Kades` / `Disetujui` / `Perlu Revisi`), `10: CatatanRevisi`, `11: DisahkanOleh`, `12: TanggalPengajuan`, `13: TanggalSelesai`, `14: KodeVerifikasiQR`
7. **`PerangkatDesa`**
   - Kolom: `0: KodePerangkat` (`PRG-YYYYMM-XXX`), `1: NIPD`, `2: NamaLengkap`, `3: Jabatan`, `4: NoHP`, `5: StatusJabatan`, `6: FotoURL`
8. **`AsetDesa`**
   - Kolom: `0: KodeAset` (`AST-YYYYMM-XXX`), `1: NamaBarangAtauTanah`, `2: KategoriAset` (`Tanah Kas Desa` / `Bangunan` / `Kendaraan` / `Inventaris Kantor`), `3: Lokasi`, `4: TahunPerolehan`, `5: NilaiPerolehan`, `6: Kondisi` (`Baik` / `Rusak Ringan` / `Rusak Berat`), `7: Keterangan`
9. **`LembagaDesa`**
   - Kolom: `0: KodeLembaga` (`LMB-YYYYMM-XXX`), `1: NamaLembaga` (`PKK` / `BPD` / `Karang Taruna` / `Posyandu`), `2: Ketua`, `3: JumlahAnggota`, `4: JadwalAtauKegiatan`, `5: Kontak`, `6: Deskripsi`
10. **`PengaduanWarga`**
    - Kolom: `0: KodeTiket` (`ADU-YYYYMM-XXX`), `1: NamaPelapor`, `2: KontakPelapor`, `3: Tujuan` (`Pemerintah Desa` / `BPD`), `4: Kategori`, `5: JudulLaporan`, `6: IsiLaporan`, `7: StatusLaporan` (`Masuk` / `Ditindaklanjuti` / `Selesai`), `8: TanggapanAdmin`, `9: TanggalLapor`, `10: DiperbaruiPada`
11. **`ProdukBUMDes`**
    - Kolom: `0: KodeProduk` (`PRD-YYYYMM-XXX`), `1: NamaProduk`, `2: Kategori`, `3: Harga`, `4: Stok`, `5: Satuan`, `6: UnitAtauPenjual`, `7: NoWhatsApp`, `8: Deskripsi`, `9: GambarURL`, `10: Status` (`Tersedia` / `Habis`)
12. **`PesananBUMDes`**
    - Kolom: `0: KodeOrder` (`ORD-YYYYMM-XXX`), `1: KodeProduk`, `2: NamaProduk`, `3: Jumlah`, `4: TotalHarga`, `5: NamaPembeli`, `6: NoHPPembeli`, `7: AlamatKirim`, `8: StatusPesanan` (`Menunggu Konfirmasi` / `Diproses` / `Selesai` / `Dibatalkan`), `9: TanggalPesan`
13. **`LogAktivitas`**
    - Kolom: `0: Waktu`, `1: Aktor`, `2: Aksi`, `3: Detail`

---

### 6. Aturan Validasi & Logika Khusus
1. **Auto-ID Sekuensial (`PREFIX-YYYYMM-XXX`):**
   Menggunakan pemindaian nilai urut tertinggi (`MAX + 1`) di periode berjalan dalam blok `LockService.getScriptLock()`.
2. **Penomoran Surat Resmi Otomatis saat Pengesahan Kades:**
   Format contoh: `470/{URUT}/DESA-KLS-B/{ROMAWI_BULAN}/{TAHUN}` (dihitung atomik saat `KADES` mengesahkan dengan PIN valid).
3. **Privasi & Sensor Data Publik:**
   - Cek Bansos hanya merespons pencarian NIK persis/valid dan menyensor NIK (`5307********0001`) serta nama (`Y****** S***`).
   - Verifikasi QR (`?verify=KODE_QR`) hanya menampilkan status keaslian surat, nomor surat, jenis surat, nama pemohon ringkas, tanggal sah, dan nama pejabat pengesah.
   - Tracking surat warga menampilkan status dan tombol cetak berdasarkan kecocokan `KodeTracking` + 4 digit akhir NIK.
4. **Validasi Koordinat GPS:**
   - `KOORDINAT_LAT` (`-90` s/d `90`) dan `KOORDINAT_LNG` (`-180` s/d `180`) divalidasi numerik sebelum disimpan di `ProfilDesa`.
5. **Anti-Freeze UI & Validasi Form:**
   - Semua form memakai `event.preventDefault()`, ekstraksi nilai primitif sebelum kirim, tombol loading dengan pemulihan otomatis saat gagal, serta modal & toast kustom (tanpa `alert`/`confirm` bawaan).
   - Dilarang menggunakan *nested template literals* pada string render HTML dinamis; semua aksi baris tabel memakai `data-id` + *event delegation*.

---

### 7. Rencana Antarmuka & Gaya Visual (Adaptasi Gambar Referensi)
- **Palet Warna & Gaya (Human-Crafted Anti-AI):**
  - Latar Utama: **Warm Alabaster Cream** (`#F7F5F0`), Kartu Putih Bersih (`#FFFFFF`, border `#E8E3D9`).
  - Aksen Utama: **Warm Burnt Terracotta** (`#D16014`), Sekunder: **Deep Forest Pine** (`#213328`) & **Sage Soft Banner** (`#EAE9DE`).
  - Ikon SVG line-art seragam dan elegan (tanpa emoji berlebihan).
- **Navigasi Pintar Mobile-Friendly:**
  - Navbar atas menampilkan menu inti (*Beranda, Layanan Surat, Transparansi & Bansos, Lokasi & GPS, BUMDes*) + tombol pencarian & `Login Admin/Kades`; menu pelengkap (*Lapor Warga, Perangkat Desa, Lembaga Desa, Berita*) mudah diakses lewat menu dropdown *"Lainnya"* di desktop dan laci (*drawer*) di HP.
- **Tata Letak Halaman Utama:**
  1. **Hero Banner** dengan judul *"Selamat Datang di Desa Kolisia B"* & subjudul *"Kecamatan Magepanda, Kabupaten Sikka — Flores, Nusa Tenggara Timur"* + 2 CTA (*Ajukan Surat Online* & *Lokasi & Jelajahi Desa*).
  2. **4 Kartu Akses Cepat (Overlapping Hero):** *Layanan Surat Online*, *Cek Bantuan Sosial*, *Lapor Warga (Pemdes/BPD)*, *Marketplace BUMDes*.
  3. **Grid Berita 3 Kolom** dengan kategori badge berwarna.
  4. **Banner Ringkasan Desa (`#EAE9DE`)** dengan **3 Lingkaran Statistik** (Penduduk Terdata, Realisasi APBDes %, Layanan Surat Terbit).
  5. **Seksyen Layanan Mandiri (Surat & Tracking), Transparansi (APBDes + Bansos), Lapor Warga, Pemerintahan (Perangkat & Lembaga Desa), dan Etalase BUMDes.**
  6. **Seksyen Lokasi Geografis & Peta GPS Interaktif:** Menampilkan profil geografis **Desa Kolisia B, Kec. Magepanda, Kab. Sikka, Flores, NTT**, peta interaktif (OpenStreetMap / Leaflet dengan pin marker lokasi), koordinat GPS terkini, serta tombol **Buka Rute GPS di Google Maps**.
  7. **Dashboard Admin & Kades** (terpisah di balik login): Kartu metrik grid 2–3 kolom, tab modul rapi, pengaturan profil & kalibrasi GPS kantor desa, cetak surat A4/F4 `@media print` ber-QR Code, dan Export CSV.
  8. **Footer Deep Forest Green (`#213328`)** 4 kolom, dilengkapi badge peta wilayah **Kec. Magepanda, Kab. Sikka — Flores, NTT** di pojok kanan bawah sesuai referensi desain.

---

### 8. Kriteria Pengujian (Checklist Verifikasi Pengguna)
- [ ] `setup.gs` berhasil dijalankan berulang (*Safe Migration*) dan membentuk 13 tab sheet tanpa tanda `_`.
- [ ] Backend GAS berhasil di-deploy dan URL API terhubung ke `js/config.js`.
- [ ] Peta Lokasi & GPS Desa Kolisia B tampil interaktif di halaman publik dan tombol **Buka Rute di Google Maps** mengarah ke koordinat yang sesuai; Admin bisa memperbarui/kalibrasi koordinat GPS dari panel.
- [ ] Warga dapat mengajukan surat (SKU/Domisili/SKTM/SKCK/Kematian), melacak status, dan mencetak surat ber-kop Desa Kolisia B + QR Code setelah disahkan Kades.
- [ ] Kepala Desa dapat login dengan role `KADES` dan mengesahkan surat menggunakan **PIN Otorisasi**.
- [ ] Halaman verifikasi QR (`?verify=...`) membuktikan keaslian surat langsung dari database.
- [ ] Fitur Cek Bansos (BLT, DTKS, Ketahanan Pangan, Stunting) menyensor NIK & Nama dengan aman.
- [ ] Fitur Lapor Warga berhasil mencatat tiket pengaduan ke Pemdes/BPD dan dapat ditanggapi Admin.
- [ ] Katalog BUMDes berhasil mencatat pesanan ke `PesananBUMDes` dan membuka tautan konfirmasi WhatsApp.
- [ ] Modul internal (Penduduk, APBDes, Perangkat Desa, Aset Desa, Lembaga Desa) berjalan dengan paginasi server, Auto-ID, cache memori, dan Export CSV.
- [ ] Website tampil responsif di HP & PC sesuai referensi visual dan dapat dipasang sebagai pintasan PWA di HP.

---
## ZONA BAWAH: MASTER CONTEXT & LOGIKA SISTEM TERKINI (LIVING CONTEXT)

### 1. Status Arsitektur & Lingkungan Aktif
- **Fase Saat Ini:** Implementasi v1.0 Selesai (Frontend Statis + PWA & Backend Google Apps Script siap deploy).
- **Wilayah Administratif Resmi:** Desa Kolisia B, Kecamatan Magepanda, Kabupaten Sikka, Pulau Flores, Provinsi Nusa Tenggara Timur (WITA / `Asia/Makassar`).
- **Stack Terpilih:** Frontend Modular Statis + PWA (`index.html`, `styles.css`, `js/config.js`, `js/api.js`, `js/public.js`, `js/admin.js`, `manifest.json`, `sw.js`) + Backend Google Apps Script (`setup.gs`, `code.gs`, `helpers.gs`) + Google Sheets (13 tab).
- **Target Viewport:** Responsif Penuh (Mobile & Desktop) + Print A4/F4 Surat Resmi.

### 2. Skema Kolom Database Terkini (0-Based `COL` Mapping)
- `ProfilDesa`: `0: Kunci`, `1: Nilai`, `2: DiperbaruiPada`
- `InfoBerita`: `0: KodeBerita`, `1: Judul`, `2: Kategori`, `3: Ringkasan`, `4: IsiLengkap`, `5: GambarURL`, `6: TanggalTerbit`, `7: Status`
- `DataPenduduk`: `0: KodePenduduk`, `1: NIK`, `2: NoKK`, `3: NamaLengkap`, `4: JenisKelamin`, `5: TempatTanggalLahir`, `6: Dusun`, `7: RT`, `8: Pekerjaan`, `9: StatusKependudukan`, `10: DiperbaruiPada`
- `DataAPBDes`: `0: KodeTransaksi`, `1: TahunAnggaran`, `2: Jenis`, `3: Bidang`, `4: Uraian`, `5: Anggaran`, `6: Realisasi`, `7: TanggalCatat`
- `DataBansos`: `0: KodeBansos`, `1: NIK`, `2: NamaPenerima`, `3: Dusun`, `4: ProgramBantuan`, `5: Periode`, `6: NominalAtauBentuk`, `7: StatusPenyaluran`, `8: DiperbaruiPada`
- `LayananSurat`: `0: KodeTracking`, `1: NomorSurat`, `2: JenisSurat`, `3: NIKPemohon`, `4: NamaPemohon`, `5: TempatTanggalLahir`, `6: AlamatDusun`, `7: Keperluan`, `8: DetailTambahan`, `9: StatusSurat`, `10: CatatanRevisi`, `11: DisahkanOleh`, `12: TanggalPengajuan`, `13: TanggalSelesai`, `14: KodeVerifikasiQR`
- `PerangkatDesa`: `0: KodePerangkat`, `1: NIPD`, `2: NamaLengkap`, `3: Jabatan`, `4: NoHP`, `5: StatusJabatan`, `6: FotoURL`
- `AsetDesa`: `0: KodeAset`, `1: NamaBarangAtauTanah`, `2: KategoriAset`, `3: Lokasi`, `4: TahunPerolehan`, `5: NilaiPerolehan`, `6: Kondisi`, `7: Keterangan`
- `LembagaDesa`: `0: KodeLembaga`, `1: NamaLembaga`, `2: Ketua`, `3: JumlahAnggota`, `4: JadwalAtauKegiatan`, `5: Kontak`, `6: Deskripsi`
- `PengaduanWarga`: `0: KodeTiket`, `1: NamaPelapor`, `2: KontakPelapor`, `3: Tujuan`, `4: Kategori`, `5: JudulLaporan`, `6: IsiLaporan`, `7: StatusLaporan`, `8: TanggapanAdmin`, `9: TanggalLapor`, `10: DiperbaruiPada`
- `ProdukBUMDes`: `0: KodeProduk`, `1: NamaProduk`, `2: Kategori`, `3: Harga`, `4: Stok`, `5: Satuan`, `6: UnitAtauPenjual`, `7: NoWhatsApp`, `8: Deskripsi`, `9: GambarURL`, `10: Status`
- `PesananBUMDes`: `0: KodeOrder`, `1: KodeProduk`, `2: NamaProduk`, `3: Jumlah`, `4: TotalHarga`, `5: NamaPembeli`, `6: NoHPPembeli`, `7: AlamatKirim`, `8: StatusPesanan`, `9: TanggalPesan`
- `LogAktivitas`: `0: Waktu`, `1: Aktor`, `2: Aksi`, `3: Detail`

### 3. Logika Bisnis & Formula Hitung Berlaku
- **Auto-ID:** `PREFIX-YYYYMM-XXX` (`MAX + 1` per bulan berjalan dengan `LockService`).
- **Nomor Surat Resmi:** `470/{URUT}/DESA-KLS-B/{ROMAWI_BULAN}/{TAHUN}` diterbitkan saat pengesahan oleh `KADES` dengan PIN valid.
- **Sensor Publik Bansos:** NIK (4 awal + `********` + 4 akhir), Nama (inisial per kata).
- **CORS Safe POST:** `Content-Type: text/plain;charset=utf-8` di frontend -> `JSON.parse(e.postData.contents)` di `code.gs`.
- **Peta & Navigasi GPS:** Menggunakan Leaflet/OpenStreetMap + deep link `https://www.google.com/maps/dir/?api=1&destination={LAT},{LNG}` berbasis nilai `KOORDINAT_LAT` & `KOORDINAT_LNG` di sheet `ProfilDesa` (tanpa butuh API Key Google Maps berbayar).
- **Persentase Realisasi APBDes:** `(Total Realisasi Belanja / Total Anggaran Belanja) * 100` (1 desimal, `0%` jika anggaran `0`).
- **Total Pesanan BUMDes:** `Jumlah * Harga` dihitung ulang di sisi backend berdasarkan data `ProdukBUMDes`.

### 4. Log Pembaruan Resmi
- **2026-11-26 (v1.0 Initial Build):** Membangun frontend modular (`index.html`, `styles.css`, `js/config.js`, `js/api.js`, `js/public.js`, `js/admin.js`), aset PWA (`manifest.json`, `sw.js`, `assets/icon.svg`), dan backend Google Apps Script (`gas/setup.gs`, `gas/helpers.gs`, `gas/code.gs`) untuk 13 tab Google Sheets, Peta GPS Interaktif Desa Kolisia B, Layanan Surat + Pengesahan PIN Kades + Cetak QR, Transparansi APBDes & Bansos, Lapor Warga, Pemerintahan & Aset/Lembaga, serta BUMDes Marketplace.
