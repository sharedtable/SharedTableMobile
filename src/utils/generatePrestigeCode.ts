/**
 * Generate prestigious, food-related invitation codes for Fare
 * Format: CATEGORY-WORD (e.g., MICHELIN-STAR, TRUFFLE-CLUB, CAVIAR-TABLE)
 */

const prestigeCategories = [
  // Michelin & Fine Dining
  'MICHELIN', 'STARRED', 'GOURMET', 'HAUTE',
  
  // Luxury Ingredients
  'TRUFFLE', 'CAVIAR', 'WAGYU', 'SAFFRON', 'FOIEGRAS',
  'OYSTER', 'LOBSTER', 'CHAMPAGNE', 'BORDEAUX', 'BURGUNDY',
  
  // Exclusive Dining Concepts
  'OMAKASE', 'KAISEKI', 'TASTING', 'CHEFS', 'PRIVATE',
  'SECRET', 'HIDDEN', 'RESERVE', 'CELLAR', 'VINTAGE',
  
  // Premium Culinary Terms
  'SOMMELIER', 'CONNOISSEUR', 'GOURMAND', 'EPICURE', 'ARTISAN',
  
  // Elite Status
  'FOUNDERS', 'PIONEER', 'PREMIER', 'PLATINUM', 'DIAMOND',
  'GOLDEN', 'ELITE', 'SELECT', 'EXCLUSIVE', 'PRESTIGE',
];

const prestigeSuffixes = [
  // Dining Related
  'TABLE', 'SEAT', 'PLATE', 'MENU', 'TASTE', 'FORK',
  'SPOON', 'KNIFE', 'GLASS', 'COURSE', 'PAIRING',
  
  // Exclusive Access
  'CLUB', 'SOCIETY', 'CIRCLE', 'GUILD', 'SALON',
  'LOUNGE', 'ROOM', 'PASS', 'KEY', 'ACCESS',
  
  // Fine Dining Terms
  'AMUSE', 'BOUCHE', 'PALATE', 'FEAST', 'SOIREE',
  'AFFAIR', 'EXPERIENCE', 'JOURNEY', 'VOYAGE', 'RITUAL',
  
  // Status
  'MEMBER', 'GUEST', 'HOST', 'PATRON', 'INSIDER',
];

/**
 * Generate a prestigious invitation code
 */
export function generatePrestigeCode(): string {
  const category = prestigeCategories[Math.floor(Math.random() * prestigeCategories.length)];
  const suffix = prestigeSuffixes[Math.floor(Math.random() * prestigeSuffixes.length)];
  
  return `${category}-${suffix}`;
}

/**
 * Generate a numbered series code (for limited editions)
 * Format: CATEGORY-SUFFIX-001 (e.g., MICHELIN-TABLE-001)
 */
export function generateSeriesCode(seriesNumber: number): string {
  const category = prestigeCategories[Math.floor(Math.random() * prestigeCategories.length)];
  const suffix = prestigeSuffixes[Math.floor(Math.random() * prestigeSuffixes.length)];
  const number = seriesNumber.toString().padStart(3, '0');
  
  return `${category}-${suffix}-${number}`;
}

/**
 * Generate specific themed codes for special campaigns
 */
export function generateThemedCode(theme: 'founding' | 'vip' | 'seasonal' | 'chef'): string {
  const themes = {
    founding: ['FOUNDERS-TABLE', 'PIONEER-SEAT', 'FIRST-TASTE', 'GENESIS-PLATE', 'ORIGIN-MENU'],
    vip: ['PLATINUM-ACCESS', 'DIAMOND-CLUB', 'GOLDEN-FORK', 'PRESTIGE-PASS', 'ELITE-CIRCLE'],
    seasonal: ['HARVEST-TABLE', 'VINTAGE-CELLAR', 'SEASON-MENU', 'SOLSTICE-FEAST', 'EQUINOX-TASTE'],
    chef: ['CHEFS-TABLE', 'OMAKASE-SEAT', 'TASTING-MENU', 'KITCHEN-PASS', 'ARTISAN-PLATE'],
  };
  
  const options = themes[theme];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Validate if a string is a valid prestige code format
 */
export function isValidPrestigeCode(code: string): boolean {
  if (!code) return false;
  
  const parts = code.toUpperCase().split('-');
  if (parts.length < 2 || parts.length > 3) return false;
  
  // Check if parts use our vocabulary (optional validation)
  const validWords = [...prestigeCategories, ...prestigeSuffixes];
  return parts.slice(0, 2).every(part => 
    validWords.includes(part) || part.length >= 3
  );
}

/**
 * Format a code for display
 */
export function formatPrestigeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

/**
 * Get a human-readable description of the code type
 */
export function getCodeDescription(code: string): string {
  const upperCode = code.toUpperCase();
  
  if (upperCode.includes('FOUNDER') || upperCode.includes('PIONEER')) {
    return 'Founding Member Access';
  }
  if (upperCode.includes('MICHELIN') || upperCode.includes('STARRED')) {
    return 'Michelin Circle';
  }
  if (upperCode.includes('TRUFFLE') || upperCode.includes('CAVIAR')) {
    return 'Luxury Dining Society';
  }
  if (upperCode.includes('CHEF') || upperCode.includes('OMAKASE')) {
    return "Chef's Table";
  }
  if (upperCode.includes('PLATINUM') || upperCode.includes('DIAMOND')) {
    return 'Premium Member';
  }
  
  return 'Exclusive Access';
}