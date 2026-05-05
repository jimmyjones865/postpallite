const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/postpallite.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS labels (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    recipient_raw       TEXT NOT NULL,
    recipient_json      TEXT NOT NULL,
    product_id          TEXT NOT NULL,
    product_name        TEXT NOT NULL,
    price_cents         INTEGER,
    balance_after_cents INTEGER,
    pdf_data            BLOB NOT NULL,
    printer_id          TEXT NOT NULL,
    printnode_job_id    TEXT
  )
`);

function purgeOld() {
  db.prepare("DELETE FROM labels WHERE created_at < strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-30 days')").run();
}

purgeOld();
setInterval(purgeOld, 60 * 60 * 1000);

function saveLabel(data) {
  const result = db.prepare(`
    INSERT INTO labels (recipient_raw, recipient_json, product_id, product_name, price_cents, balance_after_cents, pdf_data, printer_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.recipientRaw, data.recipientJson, data.productId, data.productName,
    data.priceCents, data.balanceAfterCents, data.pdfData, data.printerId
  );
  return result.lastInsertRowid;
}

function updatePrintJobId(id, jobId) {
  db.prepare('UPDATE labels SET printnode_job_id = ? WHERE id = ?').run(String(jobId), id);
}

function getLabels() {
  return db.prepare(`
    SELECT id, created_at, recipient_raw, recipient_json, product_id, product_name,
           price_cents, balance_after_cents, printer_id, printnode_job_id
    FROM labels
    ORDER BY created_at DESC
  `).all();
}

function getLabel(id) {
  return db.prepare('SELECT * FROM labels WHERE id = ?').get(id);
}

module.exports = { saveLabel, updatePrintJobId, getLabels, getLabel };
