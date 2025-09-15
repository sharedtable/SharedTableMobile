/**
 * Map area assets for location selection
 * NE - Northeast, NW - Northwest, SE - Southeast, SW - Southwest
 */

export const mapAreas = {
  northeast: require('./ne.png'),
  northwest: require('./nw.png'),
  southeast: require('./se.png'),
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