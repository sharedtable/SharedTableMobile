/**
 * Generate fun, memorable food-based referral codes
 * Format: WORD-WORD-WORD (e.g., TASTY-MANGO-FEAST)
 */

const adjectives = [
  // Taste & Flavor
  'TASTY', 'YUMMY', 'SPICY', 'SWEET', 'CRISPY', 'ZESTY', 'TANGY', 'SAVORY',
  'FRESH', 'JUICY', 'CREAMY', 'GOLDEN', 'SMOKY', 'TENDER', 'FLAKY', 'SILKY',
  'SALTY', 'MINTY', 'NUTTY', 'BUTTERY', 'HERBY', 'CITRUS', 'RICH', 'MILD',
  
  // Experience & Vibe
  'HAPPY', 'COZY', 'FANCY', 'DIVINE', 'LOVELY', 'DREAMY', 'JOLLY', 'SUPER',
  'EPIC', 'WILD', 'ROYAL', 'MAGIC', 'SUNNY', 'GROOVY', 'FUNKY', 'BUZZY',
  'COOL', 'WARM', 'BRIGHT', 'BOLD', 'LUCKY', 'PRIME', 'GRAND', 'ULTRA',
  'MEGA', 'MICRO', 'COSMIC', 'STELLAR', 'LUNAR', 'TURBO', 'HYPER', 'CHILL',
];

const foods = [
  // Fruits
  'MANGO', 'PEACH', 'BERRY', 'APPLE', 'LEMON', 'CHERRY', 'MELON', 'GRAPE',
  'ORANGE', 'BANANA', 'KIWI', 'PLUM', 'PEAR', 'FIG', 'DATE', 'GUAVA',
  
  // Dishes & Mains
  'PASTA', 'PIZZA', 'SUSHI', 'TACOS', 'RAMEN', 'CURRY', 'SALAD', 'BURGER',
  'PAELLA', 'PESTO', 'RISOTTO', 'NOODLE', 'DUMPLING', 'WAFFLE', 'PANCAKE',
  'KEBAB', 'GYOZA', 'BIBIMBAP', 'POKE', 'FALAFEL', 'QUINOA', 'TOFU', 'STEAK',
  
  // Desserts & Treats
  'COOKIE', 'MUFFIN', 'DONUT', 'MOUSSE', 'GELATO', 'TRUFFLE', 'CANDY',
  'HONEY', 'MAPLE', 'FUDGE', 'TOFFEE', 'BISCUIT', 'CUPCAKE', 'BROWNIE',
  'TART', 'PIE', 'CAKE', 'PUDDING', 'SORBET', 'SUNDAE', 'PARFAIT', 'ECLAIR',
  
  // Ingredients & Flavors
  'BASIL', 'THYME', 'GINGER', 'GARLIC', 'PEPPER', 'VANILLA', 'COCOA',
  'BUTTER', 'CHEESE', 'OLIVE', 'TOMATO', 'COCONUT', 'ALMOND', 'PEANUT',
  'SAGE', 'MINT', 'DILL', 'CUMIN', 'PAPRIKA', 'SESAME', 'CASHEW', 'PECAN',
  'WALNUT', 'PISTACHIO', 'HAZELNUT', 'CHILI', 'WASABI', 'TRUFFLE', 'SAFFRON',
];

const actions = [
  // Dining Actions
  'FEAST', 'BITES', 'EATS', 'SHARE', 'TASTE', 'SERVE', 'DINE', 'MUNCH',
  'SAVOR', 'ENJOY', 'CHEFS', 'COOKS', 'GRILLS', 'BAKES', 'ROAST', 'TOAST',
  'BLEND', 'WHISK', 'STIR', 'CHOP', 'SLICE', 'DICE', 'BREW', 'STEAM',
  
  // Social & Fun
  'PARTY', 'VIBES', 'SQUAD', 'CREW', 'GANG', 'CLUB', 'TIME', 'HOUR',
  'NIGHT', 'BRUNCH', 'LUNCH', 'TABLE', 'PLATE', 'FORK', 'SPOON', 'BOWL',
  'FEST', 'RAVE', 'BASH', 'MIXER', 'SOCIAL', 'MEETUP', 'HANGOUT', 'CHILL',
  'BREAK', 'SNACK', 'TREAT', 'DELIGHT', 'MOMENT', 'BLISS', 'JOY', 'FUN',
];

/**
 * Generate a unique food-based referral code
 * Now with optional number suffix for more uniqueness
 */
export function generateFoodCode(includeNumber: boolean = false): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const food = foods[Math.floor(Math.random() * foods.length)];
  const action = actions[Math.floor(Math.random() * actions.length)];
  
  if (includeNumber) {
    // Add a random 2-digit number for more uniqueness
    const num = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${adj}-${food}-${action}${num}`;
  }
  
  return `${adj}-${food}-${action}`;
}

/**
 * Generate multiple unique codes
 */
export function generateUniqueFoodCodes(count: number): string[] {
  const codes = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 100; // Prevent infinite loop
  
  while (codes.size < count && attempts < maxAttempts) {
    // After 50 attempts, start adding numbers for more uniqueness
    const includeNumber = attempts > 50;
    codes.add(generateFoodCode(includeNumber));
    attempts++;
  }
  
  return Array.from(codes);
}

/**
 * Validate if a string is a valid food code format
 */
export function isValidFoodCode(code: string): boolean {
  if (!code) return false;
  
  // Remove any trailing numbers first
  const codeWithoutNumbers = code.replace(/\d+$/, '');
  const parts = codeWithoutNumbers.toUpperCase().split('-');
  
  if (parts.length !== 3) return false;
  
  return parts.every(part => part.length >= 3 && part.length <= 10);
}

/**
 * Format a code for display (ensure uppercase and proper spacing)
 */
export function formatFoodCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9-]/g, '');
}