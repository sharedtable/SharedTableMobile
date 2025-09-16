/**
 * Map area assets for location selection
 * NE - Northeast, NW - Northwest, SE - Southeast, SW - Southwest
 */

// Using require for static assets in React Native
export const mapAreas = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  northeast: require('./ne.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  northwest: require('./nw.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  southeast: require('./se.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  southwest: require('./sw.png'),
} as const;

export type MapAreaName = keyof typeof mapAreas;

// Map area display names
export const mapAreaLabels: Record<MapAreaName, string> = {
  northeast: 'Northeast',
  northwest: 'Northwest',
  southeast: 'Southeast',
  southwest: 'Southwest',
};