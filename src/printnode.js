const config = require('./config');

const PRINTNODE_URL = 'https://api.printnode.com/printjobs';

async function print(printerId, pdfBuffer, title = 'Label') {
  const auth = Buffer.from(`${config.PRINTNODE_API_KEY}:`).toString('base64');

  const res = await fetch(PRINTNODE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      printerId: parseInt(printerId, 10),
      title,
      contentType: 'pdf_base64',
      content: pdfBuffer.toString('base64'),
      source: 'postpallite',
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PrintNode-Fehler (HTTP ${res.status}): ${text}`);
  }

  return JSON.parse(text); // returns job ID (integer)
}

module.exports = { print };
