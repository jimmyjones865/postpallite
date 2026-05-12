const balanceEl = document.getElementById('balance');
const resultEl = document.getElementById('result');
const buyBtn = document.getElementById('buy-btn');
const historyBody = document.getElementById('history-body');
const addressEl = document.getElementById('address');

let allProducts = [];
let selectedProductId = null;

// ── Product buttons ────────────────────────────────────────────────────────────

function selectProduct(id) {
  selectedProductId = id;
  document.querySelectorAll('.product-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.id === id);
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
  updateBuyBtn();
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
    balanceEl.textContent = 'Fehler';
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
      historyBody.innerHTML = '<tr><td colspan="5" class="empty-state">Noch keine Labels</td></tr>';
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
          <button class="action-btn" onclick="reprint(${label.id})">↺ Neu drucken</button>
          <a class="action-btn" href="/api/labels/${label.id}/pdf" download="label-${label.id}.pdf">⬇ PDF</a>
        </td>
      `;
      historyBody.appendChild(tr);
    });
  } catch {
    historyBody.innerHTML = '<tr><td colspan="5" class="empty-state">Fehler beim Laden der Historie</td></tr>';
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
    showResult(res.ok ? `Label #${id} neu gedruckt` : data.error, res.ok ? 'success' : 'error');
  } catch (err) {
    showResult(`Netzwerkfehler: ${err.message}`, 'error');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Form submit ────────────────────────────────────────────────────────────────

document.getElementById('buy-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedProductId) return;

  hideResult();
  buyBtn.disabled = true;
  buyBtn.textContent = 'Kaufe…';

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
      await loadHistory();

      if (data.printError) {
        showResult(`Label #${data.labelId} gekauft — Kontostand jetzt ${formatBalance(data.balance)}\n\n⚠ ${data.printError}`, 'warning');
      } else {
        showResult(`Label #${data.labelId} gekauft und an Drucker gesendet — Kontostand jetzt ${formatBalance(data.balance)}`, 'success');
      }
    } else {
      showResult(data.error || 'Unbekannter Fehler', 'error');
    }
  } catch (err) {
    showResult(`Netzwerkfehler: ${err.message}`, 'error');
  }

  buyBtn.disabled = !selectedProductId;
  buyBtn.textContent = 'Label kaufen & drucken';
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

document.getElementById('refresh-balance').addEventListener('click', refreshBalance);

(async () => {
  await Promise.all([loadConfig(), refreshBalance()]);
  await loadHistory();
})();
