const balanceEl = document.getElementById('balance');
const resultEl = document.getElementById('result');
const buyBtn = document.getElementById('buy-btn');
const historyBody = document.getElementById('history-body');
const addressEl = document.getElementById('address');

let allProducts = [];
let selectedProductId = null;

// ── Country detection ──────────────────────────────────────────────────────────

const DE_STRINGS = new Set(['germany', 'deutschland', 'de', 'deu']);
const INT_STRINGS = new Set(['austria', 'österreich', 'oesterreich', 'at', 'aut']);

function detectCountry(block) {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return 'empty';

  const last = lines[lines.length - 1];
  if (DE_STRINGS.has(last.toLowerCase())) return 'de';
  if (INT_STRINGS.has(last.toLowerCase())) return 'intl';
  if (/^\d{5}\s+/.test(last)) return 'implicit-de'; // 5-digit zip, no country line
  return 'unknown';
}

// ── Product buttons ────────────────────────────────────────────────────────────

function selectProduct(id) {
  selectedProductId = id;
  document.querySelectorAll('.product-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.id === id);
  });
  updateBuyBtn();
}

function updateProductButtons() {
  const country = detectCountry(addressEl.value);

  let domesticOk, intlOk;
  if (country === 'empty') {
    domesticOk = true;
    intlOk = true;
  } else if (country === 'de' || country === 'implicit-de') {
    domesticOk = true;
    intlOk = false;
  } else if (country === 'intl') {
    domesticOk = false;
    intlOk = true;
  } else { // unknown
    domesticOk = false;
    intlOk = false;
  }

  document.querySelectorAll('.product-btn').forEach(btn => {
    const isDomestic = btn.dataset.domestic === 'true';
    const allowed = isDomestic ? domesticOk : intlOk;
    btn.disabled = !allowed;
    if (!allowed && btn.dataset.id === selectedProductId) {
      selectedProductId = null;
      btn.classList.remove('selected');
    }
  });

  updateBuyBtn();
}

function updateBuyBtn() {
  buyBtn.disabled = !selectedProductId;
}

function renderProducts(products, defaultProductId) {
  const domesticEl = document.getElementById('domestic-products');
  const intlEl = document.getElementById('intl-products');

  products.forEach(p => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'product-btn';
    btn.dataset.id = p.id;
    btn.dataset.domestic = String(p.domestic);
    btn.innerHTML = `<span class="btn-name">${esc(p.name)}</span><span class="btn-price">${formatBalance(p.price_cents)}</span>`;
    btn.addEventListener('click', () => selectProduct(p.id));

    if (p.domestic) {
      domesticEl.appendChild(btn);
    } else {
      intlEl.appendChild(btn);
    }
  });

  if (defaultProductId) selectProduct(String(defaultProductId));
  updateProductButtons();
}

// ── Balance ────────────────────────────────────────────────────────────────────

async function refreshBalance() {
  balanceEl.textContent = '…';
  try {
    const res = await fetch('/api/balance');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    balanceEl.textContent = formatBalance(data.balance);
  } catch (err) {
    balanceEl.textContent = 'error';
    console.error('Balance refresh failed:', err.message);
  }
}

// ── Config ─────────────────────────────────────────────────────────────────────

async function loadConfig() {
  const res = await fetch('/api/config');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  allProducts = data.products;
  renderProducts(allProducts, data.defaultProduct);
}

// ── History ────────────────────────────────────────────────────────────────────

async function loadHistory() {
  try {
    const res = await fetch('/api/labels');
    const labels = await res.json();

    if (labels.length === 0) {
      historyBody.innerHTML = '<tr><td colspan="5" class="empty-state">No labels yet</td></tr>';
      return;
    }

    historyBody.innerHTML = '';
    labels.forEach(label => {
      const r = JSON.parse(label.recipient_json);
      const tr = document.createElement('tr');

      const nameParts = [
        `<span class="recipient-name">${esc(r.name)}</span>`,
        r.additionalName ? `<br><span class="recipient-sub">${esc(r.additionalName)}</span>` : '',
        `<br><span class="recipient-sub">${esc(r.postalCode)} ${esc(r.city)}</span>`,
      ].join('');

      tr.innerHTML = `
        <td>${formatDate(label.created_at)}</td>
        <td>${nameParts}</td>
        <td>${esc(label.product_name)}</td>
        <td>${label.price_cents != null ? formatBalance(label.price_cents) : '—'}</td>
        <td>
          <button class="action-btn" onclick="reprint(${label.id})">↺ Reprint</button>
          <a class="action-btn" href="/api/labels/${label.id}/pdf" download="label-${label.id}.pdf">⬇ PDF</a>
        </td>
      `;
      historyBody.appendChild(tr);
    });
  } catch {
    historyBody.innerHTML = '<tr><td colspan="5" class="empty-state">Failed to load history</td></tr>';
  }
}

async function reprint(id) {
  const printerId = document.getElementById('printer-override').value.trim() || null;
  try {
    const res = await fetch(`/api/labels/${id}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printerId }),
    });
    const data = await res.json();
    showResult(res.ok ? `Reprinted label #${id}` : data.error, res.ok ? 'success' : 'error');
  } catch (err) {
    showResult(`Network error: ${err.message}`, 'error');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Form submit ────────────────────────────────────────────────────────────────

document.getElementById('buy-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedProductId) return;

  hideResult();
  buyBtn.disabled = true;
  buyBtn.textContent = 'Buying…';

  const addressBlock = addressEl.value.trim();
  const printerId = document.getElementById('printer-override').value.trim() || null;

  const senderName = document.getElementById('sender-name').value.trim();
  let senderOverride = null;
  if (senderName) {
    senderOverride = {
      name: senderName,
      additionalName: document.getElementById('sender-company').value.trim() || undefined,
      addressLine1: document.getElementById('sender-street').value.trim(),
      postalCode: document.getElementById('sender-zip').value.trim(),
      city: document.getElementById('sender-city').value.trim(),
      country: document.getElementById('sender-country').value.trim() || 'DEU',
    };
  }

  try {
    const res = await fetch('/api/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressBlock, productId: selectedProductId, senderOverride, printerId }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      balanceEl.textContent = formatBalance(data.balance);
      addressEl.value = '';
      updateProductButtons(); // re-evaluate now address is cleared
      await loadHistory();

      if (data.printError) {
        showResult(`Label #${data.labelId} bought — balance now ${formatBalance(data.balance)}\n\n⚠ ${data.printError}`, 'warning');
      } else {
        showResult(`Label #${data.labelId} bought and sent to printer — balance now ${formatBalance(data.balance)}`, 'success');
      }
    } else {
      showResult(data.error || 'Unknown error', 'error');
    }
  } catch (err) {
    showResult(`Network error: ${err.message}`, 'error');
  }

  buyBtn.disabled = !selectedProductId;
  buyBtn.textContent = 'Buy & Print';
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function showResult(text, type) {
  resultEl.textContent = text;
  resultEl.className = type;
  resultEl.style.display = 'block';
}

function hideResult() {
  resultEl.style.display = 'none';
}

function formatBalance(cents) {
  return '€' + (cents / 100).toFixed(2);
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
}

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Init ───────────────────────────────────────────────────────────────────────

addressEl.addEventListener('input', updateProductButtons);
document.getElementById('refresh-balance').addEventListener('click', refreshBalance);

(async () => {
  await Promise.all([loadConfig(), refreshBalance()]);
  await loadHistory();
})();
