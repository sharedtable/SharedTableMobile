module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  printWidth: 100,
  useTabs: false,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'auto',
  jsxSingleQuote: false,
  proseWrap: 'preserve',
  quoteProps: 'as-needed',
  requirePragma: false,
  insertPragma: false,
  htmlWhitespaceSensitivity: 'css',
  embeddedLanguageFormatting: 'auto',
  
  // Import order configuration (with prettier-plugin-sort-imports)
  importOrder: [
    '^react$',
    '^react-native$',
    '^expo',
    '^@react-navigation',
    '^@',
    '^[./]'
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};