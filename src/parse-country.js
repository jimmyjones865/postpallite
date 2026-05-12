// Maps common spellings / ISO codes to ISO 3166-1 alpha-3. EU members only.
const MAP = {
  'de': 'DEU', 'deu': 'DEU', 'germany': 'DEU', 'deutschland': 'DEU',
  'at': 'AUT', 'aut': 'AUT', 'austria': 'AUT', 'österreich': 'AUT', 'oesterreich': 'AUT',
  'be': 'BEL', 'bel': 'BEL', 'belgium': 'BEL', 'belgien': 'BEL', 'belgique': 'BEL', 'belgië': 'BEL',
  'bg': 'BGR', 'bgr': 'BGR', 'bulgaria': 'BGR', 'bulgarien': 'BGR',
  'cy': 'CYP', 'cyp': 'CYP', 'cyprus': 'CYP', 'zypern': 'CYP',
  'cz': 'CZE', 'cze': 'CZE', 'czechia': 'CZE', 'czech republic': 'CZE', 'tschechien': 'CZE', 'česko': 'CZE',
  'dk': 'DNK', 'dnk': 'DNK', 'denmark': 'DNK', 'dänemark': 'DNK', 'danmark': 'DNK',
  'ee': 'EST', 'est': 'EST', 'estonia': 'EST', 'estland': 'EST', 'eesti': 'EST',
  'fi': 'FIN', 'fin': 'FIN', 'finland': 'FIN', 'finnland': 'FIN', 'suomi': 'FIN',
  'fr': 'FRA', 'fra': 'FRA', 'france': 'FRA', 'frankreich': 'FRA',
  'gr': 'GRC', 'grc': 'GRC', 'greece': 'GRC', 'griechenland': 'GRC',
  'hr': 'HRV', 'hrv': 'HRV', 'croatia': 'HRV', 'kroatien': 'HRV', 'hrvatska': 'HRV',
  'hu': 'HUN', 'hun': 'HUN', 'hungary': 'HUN', 'ungarn': 'HUN', 'magyarország': 'HUN',
  'ie': 'IRL', 'irl': 'IRL', 'ireland': 'IRL', 'irland': 'IRL',
  'it': 'ITA', 'ita': 'ITA', 'italy': 'ITA', 'italien': 'ITA', 'italia': 'ITA',
  'lt': 'LTU', 'ltu': 'LTU', 'lithuania': 'LTU', 'litauen': 'LTU', 'lietuva': 'LTU',
  'lu': 'LUX', 'lux': 'LUX', 'luxembourg': 'LUX', 'luxemburg': 'LUX',
  'lv': 'LVA', 'lva': 'LVA', 'latvia': 'LVA', 'lettland': 'LVA', 'latvija': 'LVA',
  'mt': 'MLT', 'mlt': 'MLT', 'malta': 'MLT',
  'nl': 'NLD', 'nld': 'NLD', 'netherlands': 'NLD', 'niederlande': 'NLD', 'nederland': 'NLD',
  'pl': 'POL', 'pol': 'POL', 'poland': 'POL', 'polen': 'POL', 'polska': 'POL',
  'pt': 'PRT', 'prt': 'PRT', 'portugal': 'PRT',
  'ro': 'ROU', 'rou': 'ROU', 'romania': 'ROU', 'rumänien': 'ROU', 'românia': 'ROU',
  'se': 'SWE', 'swe': 'SWE', 'sweden': 'SWE', 'schweden': 'SWE', 'sverige': 'SWE',
  'si': 'SVN', 'svn': 'SVN', 'slovenia': 'SVN', 'slowenien': 'SVN', 'slovenija': 'SVN',
  'sk': 'SVK', 'svk': 'SVK', 'slovakia': 'SVK', 'slowakei': 'SVK', 'slovensko': 'SVK',
  'es': 'ESP', 'esp': 'ESP', 'spain': 'ESP', 'spanien': 'ESP', 'españa': 'ESP',
};

function parseCountry(str) {
  return MAP[str.trim().toLowerCase()] ?? null;
}

module.exports = parseCountry;
