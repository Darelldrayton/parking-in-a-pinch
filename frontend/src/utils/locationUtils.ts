/**
 * Utility functions for location privacy and map display
 */

// NYC Neighborhoods by Borough
export const NYC_NEIGHBORHOODS = {
  Manhattan: [
    'Financial District',
    'TriBeCa',
    'SoHo',
    'Nolita',
    'Little Italy',
    'Chinatown',
    'Lower East Side',
    'East Village',
    'NoHo',
    'Greenwich Village',
    'West Village',
    'Meatpacking District',
    'Chelsea',
    'Flatiron District',
    'Gramercy',
    'Kips Bay',
    'Murray Hill',
    'Midtown East',
    'Midtown West',
    'Times Square',
    'Hell\'s Kitchen',
    'Lincoln Square',
    'Upper West Side',
    'Upper East Side',
    'Yorkville',
    'Harlem',
    'East Harlem',
    'Washington Heights',
    'Inwood',
    'Hamilton Heights',
    'Morningside Heights'
  ],
  Brooklyn: [
    'DUMBO',
    'Brooklyn Heights',
    'Downtown Brooklyn',
    'Fort Greene',
    'Clinton Hill',
    'Bed-Stuy',
    'Crown Heights',
    'Prospect Heights',
    'Park Slope',
    'Gowanus',
    'Carroll Gardens',
    'Cobble Hill',
    'Red Hook',
    'Boerum Hill',
    'Fort Greene',
    'Williamsburg',
    'Greenpoint',
    'Bushwick',
    'East Williamsburg',
    'Ridgewood',
    'Sunset Park',
    'Bay Ridge',
    'Dyker Heights',
    'Bensonhurst',
    'Gravesend',
    'Sheepshead Bay',
    'Brighton Beach',
    'Coney Island',
    'Flatbush',
    'Midwood',
    'Marine Park',
    'Mill Basin'
  ],
  Queens: [
    'Long Island City',
    'Astoria',
    'Sunnyside',
    'Woodside',
    'Elmhurst',
    'Jackson Heights',
    'Corona',
    'Flushing',
    'Bayside',
    'Fresh Meadows',
    'Forest Hills',
    'Rego Park',
    'Middle Village',
    'Glendale',
    'Ridgewood',
    'Maspeth',
    'College Point',
    'Whitestone',
    'Beechhurst',
    'Malba',
    'Douglaston',
    'Little Neck',
    'Glen Oaks',
    'Floral Park',
    'Bellerose',
    'Queens Village',
    'Cambria Heights',
    'Laurelton',
    'Springfield Gardens',
    'Rosedale',
    'Far Rockaway',
    'Rockaway Beach'
  ],
  Bronx: [
    'Mott Haven',
    'Port Morris',
    'Melrose',
    'Morrisania',
    'Hunts Point',
    'Longwood',
    'Concourse',
    'High Bridge',
    'Morris Heights',
    'University Heights',
    'Mount Eden',
    'Claremont',
    'East Tremont',
    'West Farms',
    'Belmont',
    'Fordham',
    'Mount Hope',
    'Kingsbridge',
    'Marble Hill',
    'Riverdale',
    'Spuyten Duyvil',
    'Van Cortlandt Village',
    'Woodlawn',
    'Norwood',
    'Bedford Park',
    'Kingsbridge Heights',
    'University Heights',
    'Morris Park',
    'Pelham Parkway',
    'Allerton',
    'Pelham Gardens',
    'Eastchester',
    'Baychester',
    'Co-op City'
  ],
  'Staten Island': [
    'St. George',
    'New Brighton',
    'Stapleton',
    'Clifton',
    'Concord',
    'Grasmere',
    'Old Town',
    'Dongan Hills',
    'South Beach',
    'Midland Beach',
    'New Dorp',
    'Oakwood',
    'Bay Terrace',
    'Richmondtown',
    'Eltingville',
    'Annadale',
    'Huguenot',
    'Prince\'s Bay',
    'Pleasant Plains',
    'Charleston',
    'Rossville',
    'Woodrow',
    'Tottenville',
    'Great Kills',
    'New Springville',
    'Bull\'s Head',
    'Bloomfield',
    'Chelsea',
    'Travis',
    'West New Brighton',
    'Port Richmond',
    'Mariners Harbor',
    'Arlington'
  ]
} as const;

/**
 * Adjusts coordinates to show approximate location at nearest intersection
 * rather than exact parking spot location for privacy
 */
export function adjustToNearestIntersection(lat: number, lng: number): { lat: number; lng: number } {
  // NYC grid system approximation
  // Average block length in NYC is about 0.002 degrees lat/lng
  const blockSize = 0.002;
  
  // Round to nearest intersection (grid point)
  const adjustedLat = Math.round(lat / blockSize) * blockSize;
  const adjustedLng = Math.round(lng / blockSize) * blockSize;
  
  return {
    lat: adjustedLat,
    lng: adjustedLng
  };
}

/**
 * Gets display coordinates for map markers
 * Shows exact location for host and users who have checked in
 * Shows nearest intersection for other users
 */
export function getMapDisplayCoordinates(
  originalLat: number,
  originalLng: number,
  isHost: boolean,
  hasCheckedIn: boolean
): { lat: number; lng: number } {
  // Show exact location for hosts and users who have checked in
  if (isHost || hasCheckedIn) {
    return {
      lat: originalLat,
      lng: originalLng
    };
  }
  
  // Show approximate location for others
  return adjustToNearestIntersection(originalLat, originalLng);
}

/**
 * Gets appropriate zoom level for map based on privacy settings
 */
export function getMapZoomLevel(showExactLocation: boolean): number {
  // Higher zoom for exact locations, lower for approximate
  return showExactLocation ? 17 : 15;
}

/**
 * Formats address for display based on booking status
 * Only shows full address after check-in for privacy
 */
export function formatAddressForDisplay(
  fullAddress: string,
  borough: string,
  isHost: boolean,
  hasCheckedIn: boolean
): string {
  // Only show full address to hosts or users who have checked in
  if (isHost || hasCheckedIn) {
    return fullAddress;
  }
  
  // Extract approximate area from full address for privacy
  const parts = fullAddress.split(',');
  const streetPart = parts[0]?.trim();
  
  // If street contains numbers, show general area instead
  if (streetPart && /\d/.test(streetPart)) {
    return `${borough} • General Area`;
  }
  
  // If it's just a street name without numbers, can show it
  return `Near ${streetPart}, ${borough}`;
}