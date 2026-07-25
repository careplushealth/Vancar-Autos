// Helper utility for vehicle make normalization and deduplication

const ACRONYMS = new Set(['BMW', 'VW', 'MG', 'BYD', 'SEAT', 'GMC', 'RAM', 'BAC']);

const MULTI_WORD_MAKES = {
  'land rover': 'Land Rover',
  'alfa romeo': 'Alfa Romeo',
  'aston martin': 'Aston Martin',
  'rolls royce': 'Rolls-Royce',
  'rolls-royce': 'Rolls-Royce',
  'mercedes benz': 'Mercedes-Benz',
  'mercedes-benz': 'Mercedes-Benz',
  'great wall': 'Great Wall'
};

/**
 * Standardize vehicle make string
 * Capitalizes first letter of each word, preserves known acronyms and hyphenated names.
 */
export function normalizeMake(makeStr) {
  if (!makeStr || typeof makeStr !== 'string') return '';
  const trimmed = makeStr.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  // Check known multi-word makes
  if (MULTI_WORD_MAKES[lower]) {
    return MULTI_WORD_MAKES[lower];
  }

  // Check acronyms
  if (ACRONYMS.has(trimmed.toUpperCase())) {
    return trimmed.toUpperCase();
  }

  // General Title Case
  return trimmed
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
