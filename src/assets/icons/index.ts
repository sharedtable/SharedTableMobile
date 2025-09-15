/**
 * Icon assets for the SharedTable app
 */

export const icons = {
  calendar: require('./calendar.png'),
  clock: require('./clock.png'),
  gift: require('./gift.png'),
} as const;

export type IconName = keyof typeof icons;