/**
 * js/config.js — Pengaturan Koneksi Backend & Konstanta Desa Kolisia B
 *
 * CARA MENGHUBUNGKAN BACKEND:
 * 1. Deploy folder gas/ (setup.gs, helpers.gs, code.gs) sebagai Web App di Google Apps Script.
 * 2. Tempel URL Web App (.../exec) pada DEFAULT_GAS_API_URL di bawah ini, ATAU
 * 3. Gunakan tombol "Pengaturan Koneksi API" langsung di antarmuka website.
 */

var APP_CONFIG = {
  // Tempel URL Web App Google Apps Script Anda di antara tanda kutip:
  DEFAULT_GAS_API_URL: '',
  STORAGE_API_KEY: 'kolisiab_gas_api_url',
  STORAGE_SESSION_KEY: 'kolisiab_session_v1',
  DEFAULT_VILLAGE: {
    NAMA_DESA: 'Desa Kolisia B',
    KECAMATAN: 'Kecamatan Magepanda',
    KABUPATEN: 'Kabupaten Sikka',
    PROVINSI: 'Nusa Tenggara Timur',
    KOORDINAT_LAT: '-8.567500',
    KOORDINAT_LNG: '122.043500'
  }
};

function getGasApiUrl() {
  try {
    var saved = localStorage.getItem(APP_CONFIG.STORAGE_API_KEY);
    if (saved && saved.indexOf('https://') === 0) {
      return saved.trim();
    }
  } catch (e) {
    // Abaikan jika storage diblokir
  }
  return (APP_CONFIG.DEFAULT_GAS_API_URL || '').trim();
}

function setGasApiUrl(url) {
  var cleaned = String(url || '').trim();
  try {
    if (!cleaned) {
      localStorage.removeItem(APP_CONFIG.STORAGE_API_KEY);
    } else {
      localStorage.setItem(APP_CONFIG.STORAGE_API_KEY, cleaned);
    }
  } catch (e) {
    // Abaikan jika storage diblokir
  }
}
