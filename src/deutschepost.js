const config = require('./config');

const AUTH_URL = 'https://api-eu.dhl.com/post/de/shipping/im/v1/user';
const CHECKOUT_URL = 'https://api-eu.dhl.com/post/de/shipping/im/v1/app/shoppingcart/pdf?directCheckout=true';

let cachedToken = null;
let tokenExpiry = 0;

async function authenticate(force = false) {
  if (!force && cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  console.log('[DP auth] user:', config.DP_PORTOKASSE_USER, '| pass length:', config.DP_PORTOKASSE_PASS.length);
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.DP_API_KEY,
      client_secret: config.DP_API_SECRET,
      username: config.DP_PORTOKASSE_USER,
      password: config.DP_PORTOKASSE_PASS,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('[DP auth] HTTP', res.status, text);
    throw new Error(formatDpError(res.status, text));
  }

  const data = JSON.parse(text);
  cachedToken = data;
  // Refresh 5 minutes before actual expiry
  tokenExpiry = Date.now() + ((data.expires_in - 300) * 1000);
  return data;
}

async function buyLabel(token, product, sender, recipient) {
  const body = {
    type: 'AppShoppingCartPDFRequest',
    total: product.price_cents,
    createShippingList: '0',
    dpi: 'DPI300',
    pageFormatId: config.DP_PAGE_FORMAT_ID,
    positions: [{
      productCode: parseInt(product.id, 10),
      imageID: 0,
      address: {
        sender: cleanAddress(sender),
        receiver: cleanAddress(recipient),
      },
      voucherLayout: 'ADDRESS_ZONE',
      positionType: 'AppShoppingCartPDFPosition',
      position: { labelX: 1, labelY: 1, page: 1 },
    }],
  };

  const res = await fetch(CHECKOUT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(formatDpError(res.status, text));
  }

  return JSON.parse(text);
}

async function downloadPdf(link) {
  const res = await fetch(link);
  if (!res.ok) {
    throw new Error(`PDF download failed (HTTP ${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function cleanAddress(addr) {
  const out = {
    name: addr.name,
    addressLine1: addr.addressLine1,
    postalCode: addr.postalCode,
    city: addr.city,
    country: addr.country,
  };
  if (addr.additionalName) out.additionalName = addr.additionalName;
  return out;
}

function formatDpError(status, body) {
  let parsed;
  try { parsed = JSON.parse(body); } catch { return `Deutsche Post error (HTTP ${status}): ${body}`; }

  // Try common DP error shapes
  const message =
    parsed.detail ||
    parsed.message ||
    parsed.title ||
    (parsed.errors && parsed.errors.map(e => e.message || e.detail || JSON.stringify(e)).join('; ')) ||
    JSON.stringify(parsed, null, 2);

  return `Deutsche Post error (HTTP ${status}): ${message}`;
}

module.exports = { authenticate, buyLabel, downloadPdf };
