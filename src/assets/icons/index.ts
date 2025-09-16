/**
 * Icon assets for the SharedTable app
 */

// Using require for static assets in React Native
export const icons = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  calendar: require('./calendar.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  clock: require('./clock.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  gift: require('./gift.png'),
} as const;

export type IconName = keyof typeof icons;