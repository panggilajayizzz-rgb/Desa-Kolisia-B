/**
 * js/api.js — Lapisan Komunikasi API, In-Memory Cache & Utilitas Keamanan UI
 * - POST dikirim menggunakan Content-Type: text/plain;charset=utf-8 agar bebas error CORS preflight di GAS.
 * - Menyimpan cache di memori klien agar perpindahan menu/tab instan (0 detik).
 * - Menyediakan toast, modal kustom, sanitasi HTML, dan ekspor CSV.
 */

var ApiClient = (function () {
  var memoryCache = {};

  function buildCacheKey(prefix, params) {
    return prefix + '::' + JSON.stringify(params || {});
  }

  function invalidatePrefix(prefix) {
    var keys = Object.keys(memoryCache);
    for (var i = 0; i < keys.length; i++) {
      if (!prefix || keys[i].indexOf(prefix) === 0) {
        delete memoryCache[keys[i]];
      }
    }
  }

  function getSession() {
    try {
      var raw = sessionStorage.getItem(APP_CONFIG.STORAGE_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setSession(sessionObj) {
    try {
      if (!sessionObj) {
        sessionStorage.removeItem(APP_CONFIG.STORAGE_SESSION_KEY);
      } else {
        sessionStorage.setItem(APP_CONFIG.STORAGE_SESSION_KEY, JSON.stringify(sessionObj));
      }
    } catch (e) {
      // Abaikan
    }
  }

  function requestGet(action, params, options) {
    var apiUrl = getGasApiUrl();
    if (!apiUrl) {
      return Promise.reject(new Error('URL API Google Apps Script belum dipasang.'));
    }

    var opts = options || {};
    var cacheKey = buildCacheKey('GET_' + action, params);
    if (!opts.forceRefresh && memoryCache[cacheKey]) {
      return Promise.resolve(memoryCache[cacheKey]);
    }

    var queryParts = ['action=' + encodeURIComponent(action)];
    if (params) {
      for (var k in params) {
        if (params.hasOwnProperty(k) && params[k] !== undefined && params[k] !== null && params[k] !== '') {
          queryParts.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(params[k])));
        }
      }
    }

    var fullUrl = apiUrl + (apiUrl.indexOf('?') === -1 ? '?' : '&') + queryParts.join('&');
    return fetch(fullUrl, { method: 'GET', redirect: 'follow' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (!json || !json.ok) {
          throw new Error((json && json.error) ? json.error : 'Gagal memuat data server.');
        }
        if (opts.cacheable !== false) {
          memoryCache[cacheKey] = json.data;
        }
        return json.data;
      });
  }

  function requestPost(action, payload, options) {
    var apiUrl = getGasApiUrl();
    if (!apiUrl) {
      return Promise.reject(new Error('URL API Google Apps Script belum dipasang.'));
    }

    var opts = options || {};
    var session = getSession();
    var token = session ? session.token : '';
    var cacheKey = buildCacheKey('POST_' + action, payload);

    if (opts.cacheable && !opts.forceRefresh && memoryCache[cacheKey]) {
      return Promise.resolve(memoryCache[cacheKey]);
    }

    var bodyStr = JSON.stringify({
      action: action,
      token: token,
      payload: payload || {}
    });

    // Wajib text/plain;charset=utf-8 untuk mencegah CORS preflight OPTIONS pada Google Apps Script
    return fetch(apiUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyStr
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (!json || !json.ok) {
          var errMsg = (json && json.error) ? json.error : 'Permintaan gagal diproses.';
          if (errMsg.indexOf('Sesi') !== -1) {
            setSession(null);
          }
          throw new Error(errMsg);
        }
        if (opts.cacheable) {
          memoryCache[cacheKey] = json.data;
        }
        return json.data;
      });
  }

  return {
    get: requestGet,
    post: requestPost,
    invalidate: invalidatePrefix,
    getSession: getSession,
    setSession: setSession
  };
})();

/* ============================================================================
 * UTILITAS UI BERSAMA (ESCAPE HTML, TOAST, MODAL, FORMAT RUPIAH, QR & CSV)
 * ============================================================================ */

function escapeHtml(str) {
  return String(str === null || str === undefined ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRupiah(num) {
  var n = Number(num || 0);
  if (isNaN(n)) n = 0;
  return 'Rp ' + n.toLocaleString('id-ID');
}

function showToast(message, type) {
  var container = document.getElementById('toastContainer');
  if (!container) return;
  var el = document.createElement('div');
  el.className = 'toast ' + (type === 'error' ? 'toast-error' : (type === 'success' ? 'toast-success' : ''));
  el.textContent = String(message || '');
  container.appendChild(el);
  setTimeout(function () {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 4200);
}

function openCustomModal(title, htmlContent) {
  var backdrop = document.getElementById('appModalBackdrop');
  var titleEl = document.getElementById('appModalTitle');
  var bodyEl = document.getElementById('appModalBody');
  if (!backdrop || !titleEl || !bodyEl) return;
  titleEl.textContent = title;
  bodyEl.innerHTML = htmlContent;
  backdrop.classList.remove('hidden');
}

function closeCustomModal() {
  var backdrop = document.getElementById('appModalBackdrop');
  if (backdrop) backdrop.classList.add('hidden');
}

function setButtonLoading(btn, isLoading, loadingText, idleText) {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.idleLabel = idleText || btn.textContent;
    btn.disabled = true;
    btn.textContent = loadingText || 'Memproses...';
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.idleLabel || idleText || 'Simpan';
  }
}

function renderQrSvgString(textValue, cellSize) {
  if (typeof qrcode === 'function') {
    try {
      var qr = qrcode(0, 'M');
      qr.addData(String(textValue));
      qr.make();
      return qr.createSvgTag({ cellSize: cellSize || 3, margin: 2 });
    } catch (e) {
      // Fallback di bawah
    }
  }
  return '<div style="border:1px solid #000;padding:8px;font-size:10px;">QR: ' + escapeHtml(textValue) + '</div>';
}

function downloadCsvFile(filename, headers, rows) {
  function escCsv(val) {
    var s = String(val === null || val === undefined ? '' : val);
    if (s.indexOf('"') !== -1 || s.indexOf(',') !== -1 || s.indexOf('\n') !== -1) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }
  var lines = [];
  lines.push(headers.map(escCsv).join(','));
  for (var i = 0; i < rows.length; i++) {
    lines.push(rows[i].map(escCsv).join(','));
  }
  var csvContent = '\uFEFF' + lines.join('\r\n');
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
