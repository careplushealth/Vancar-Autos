const ACRONYMS = new Set(['BMW', 'VW', 'MG', 'BYD', 'SEAT', 'GMC', 'RAM', 'BAC']);

const MULTI_WORD_MAKES = {
  'land rover': 'Land Rover',
  'alfa romeo': 'Alfa Romeo',
  'aston martin': 'Aston Martin',
  'rolls royce': 'Rolls-Royce',
  'rolls-royce': 'Rolls-Royce',
  'mercedes benz': 'Mercedes-Benz',
  'mercedes-benz': 'Mercedes-Benz',
  'great wall': 'Great Wall',
  'citroen': 'Citroen',
  'citroën': 'Citroen',
  'skoda': 'Skoda',
  'škoda': 'Skoda'
};

/**
 * Standardize vehicle make string
 * Capitalizes first letter of each word, preserves known acronyms and hyphenated names.
 */
export function normalizeMake(makeStr) {
  if (!makeStr || typeof makeStr !== 'string') return '';
  const trimmed = makeStr.trim();
  if (!trimmed) return '';

  const deaccented = trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lower = deaccented.toLowerCase();

  // Check known multi-word / special makes
  if (MULTI_WORD_MAKES[lower] || MULTI_WORD_MAKES[trimmed.toLowerCase()]) {
    return MULTI_WORD_MAKES[lower] || MULTI_WORD_MAKES[trimmed.toLowerCase()];
  }

  // Check acronyms
  if (ACRONYMS.has(deaccented.toUpperCase())) {
    return deaccented.toUpperCase();
  }

  // General Title Case
  return deaccented
    .split(/[\s-]+/)
    .map(word => {
      const u = word.toUpperCase();
      if (ACRONYMS.has(u)) return u;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Deduplicate an array of makes, returning a sorted list of unique normalized makes.
 */
export function deduplicateMakes(makesList = []) {
  const map = new Map();
  makesList.forEach(rawMake => {
    if (!rawMake || rawMake === 'Other' || rawMake === 'All') return;
    const normalized = normalizeMake(rawMake);
    const key = normalized.toLowerCase();
    if (!map.has(key)) {
      map.set(key, normalized);
    }
  });
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}
