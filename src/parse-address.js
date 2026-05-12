const parseCountry = require('./parse-country');

function parseAddress(block) {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

  if (lines.length < 3) {
    throw new Error(`Mindestens 3 Zeilen erforderlich (Name, Straße, PLZ+Ort), erhalten: ${lines.length}`);
  }

  const lastLine = lines[lines.length - 1];
  const explicitCountry = parseCountry(lastLine);

  let country, postalLineIdx;
  if (explicitCountry) {
    country = explicitCountry;
    postalLineIdx = lines.length - 2;
  } else {
    // No country line — last line must be a 5-digit German postal code
    if (!/^\d{5}\s+/.test(lastLine)) {
      throw new Error(`Keine Landeszeile gefunden, und letzte Zeile „${lastLine}" ist keine deutsche Postleitzahl`);
    }
    country = 'DEU';
    postalLineIdx = lines.length - 1;
  }

  const postalLine = lines[postalLineIdx];
  const postalMatch = postalLine.match(/^(\d{4,5})\s+(.+)$/);
  if (!postalMatch) {
    throw new Error(`PLZ und Ort konnten nicht aus „${postalLine}" gelesen werden`);
  }

  if (postalLineIdx < 1) {
    throw new Error('Adresse zu kurz – Straßenzeile fehlt');
  }

  const addressLine1 = lines[postalLineIdx - 1];
  const nameLines = lines.slice(0, postalLineIdx - 1);

  if (nameLines.length === 0) {
    throw new Error('Empfängername fehlt');
  }

  return {
    name: nameLines[0],
    additionalName: nameLines.length > 1 ? nameLines.slice(1).join(' ') : undefined,
    addressLine1,
    postalCode: postalMatch[1],
    city: postalMatch[2],
    country,
  };
}

module.exports = parseAddress;
