/**
 * Central export for all app assets
 */

export { icons, type IconName } from './icons';
export { mapAreas, mapAreaLabels, type MapAreaName } from './images/map-areas';

// Re-export existing icon if it exists
export const appIcon = require('./icon.png');