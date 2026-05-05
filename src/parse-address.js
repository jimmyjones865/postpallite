const COUNTRY_MAP = {
  'germany': 'DEU', 'deutschland': 'DEU', 'de': 'DEU', 'deu': 'DEU',
  'austria': 'AUT', 'österreich': 'AUT', 'oesterreich': 'AUT', 'at': 'AUT', 'aut': 'AUT',
};

function parseAddress(block) {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

  if (lines.length < 3) {
    throw new Error(`need at least 3 lines (name, street, postal+city), got ${lines.length}`);
  }

  const lastLine = lines[lines.length - 1];
  const explicitCountry = COUNTRY_MAP[lastLine.toLowerCase()];

  let country, postalLineIdx;
  if (explicitCountry) {
    country = explicitCountry;
    postalLineIdx = lines.length - 2;
  } else {
    // No country line — last line must be a 5-digit German postal code
    if (!/^\d{5}\s+/.test(lastLine)) {
      throw new Error(`no country line found, and last line "${lastLine}" is not a German postal code`);
    }
    country = 'DEU';
    postalLineIdx = lines.length - 1;
  }

  const postalLine = lines[postalLineIdx];
  const postalMatch = postalLine.match(/^(\d{4,5})\s+(.+)$/);
  if (!postalMatch) {
    throw new Error(`could not parse postal code and city from "${postalLine}"`);
  }

  if (postalLineIdx < 1) {
    throw new Error('address too short — missing street line');
  }

  const addressLine1 = lines[postalLineIdx - 1];
  const nameLines = lines.slice(0, postalLineIdx - 1);

  if (nameLines.length === 0) {
    throw new Error('missing recipient name');
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
