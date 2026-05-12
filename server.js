const express = require('express');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const config = require('./src/config');
const db = require('./src/db');
const dp = require('./src/deutschepost');
const printnode = require('./src/printnode');
const parseAddress = require('./src/parse-address');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadProducts() {
  const file = fs.readFileSync(path.join(__dirname, 'config/products.yaml'), 'utf8');
  return yaml.load(file).products;
}

app.get('/api/config', (req, res) => {
  let products;
  try {
    products = loadProducts();
  } catch (err) {
    return res.status(500).json({ error: `Produktkatalog konnte nicht geladen werden: ${err.message}` });
  }
  res.json({
    products,
    defaultProduct: config.DP_DEFAULT_PRODUCT,
    defaultPrinter: config.PRINTNODE_DEFAULT_PRINTER,
  });
});

app.get('/api/balance', async (req, res) => {
  try {
    const auth = await dp.authenticate(true);
    res.json({ balance: auth.walletBalance });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/labels', async (req, res) => {
  const { addressBlock, productId, senderOverride, printerId } = req.body;

  if (!addressBlock || !productId) {
    return res.status(400).json({ error: 'addressBlock und productId sind erforderlich' });
  }

  let products;
  try {
    products = loadProducts();
  } catch (err) {
    return res.status(500).json({ error: `Produktkatalog konnte nicht geladen werden: ${err.message}` });
  }

  const product = products.find(p => String(p.id) === String(productId));
  if (!product) {
    return res.status(400).json({ error: `Unbekanntes Produkt „${productId}"` });
  }

  let recipient;
  try {
    recipient = parseAddress(addressBlock);
  } catch (err) {
    return res.status(400).json({ error: `Adresse konnte nicht verarbeitet werden: ${err.message}` });
  }

  const sender = senderOverride || {
    name: config.DP_SENDER_NAME,
    additionalName: config.DP_SENDER_COMPANY || undefined,
    addressLine1: config.DP_SENDER_STREET,
    postalCode: config.DP_SENDER_ZIP,
    city: config.DP_SENDER_CITY,
    country: config.DP_SENDER_COUNTRY,
  };

  let auth;
  try {
    auth = await dp.authenticate();
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }

  let labelResult;
  try {
    labelResult = await dp.buyLabel(auth.access_token, product, sender, recipient);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }

  const { link, walletBallance } = labelResult;

  let pdfBuffer;
  try {
    pdfBuffer = await dp.downloadPdf(link);
  } catch (err) {
    return res.status(502).json({ error: `Label wurde gekauft, aber PDF-Download fehlgeschlagen: ${err.message}` });
  }

  const effectivePrinterId = printerId || config.PRINTNODE_DEFAULT_PRINTER;

  const labelId = db.saveLabel({
    recipientRaw: addressBlock,
    recipientJson: JSON.stringify(recipient),
    productId: String(product.id),
    productName: product.name,
    priceCents: product.price_cents,
    balanceAfterCents: walletBallance,
    pdfData: pdfBuffer,
    printerId: String(effectivePrinterId),
  });

  try {
    const jobId = await printnode.print(effectivePrinterId, pdfBuffer, `Label #${labelId}`);
    db.updatePrintJobId(labelId, jobId);
    res.json({ success: true, labelId, balance: walletBallance });
  } catch (err) {
    // Label is bought and saved — surface print failure without losing the label
    res.json({
      success: true,
      labelId,
      balance: walletBallance,
      printError: `Label purchased and saved, but printing failed: ${err.message}`,
    });
  }
});

app.get('/api/labels', (req, res) => {
  res.json(db.getLabels());
});

app.post('/api/labels/:id/print', async (req, res) => {
  const label = db.getLabel(req.params.id);
  if (!label) return res.status(404).json({ error: 'Label nicht gefunden' });

  const printerId = req.body.printerId || label.printer_id;
  try {
    const jobId = await printnode.print(printerId, label.pdf_data, `Reprint #${label.id}`);
    db.updatePrintJobId(label.id, jobId);
    res.json({ success: true, printJobId: jobId });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/labels/:id/pdf', (req, res) => {
  const label = db.getLabel(req.params.id);
  if (!label) return res.status(404).json({ error: 'Label nicht gefunden' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="label-${label.id}.pdf"`);
  res.send(label.pdf_data);
});

app.listen(config.PORT, () => {
  console.log(`postpallite running on http://localhost:${config.PORT}`);
});
