/**
 * Geocoding Utility — Pincode-first strategy for placing map markers.
 *
 * Priority order for resolving coordinates:
 *  1. Pre-stored lat/lng from the database (fastest — no API call needed)
 *  2. Extract 6-digit Indian PIN code from location string → Nominatim geocode
 *  3. Full address string → Nominatim geocode
 *  4. Fallback to a real Chennai neighbourhood coordinate
 */

// In-memory cache to avoid repeated API calls for same pincodes/addresses
const geocodeCache: Record<string, { lat: number; lng: number } | null> = {};

// Real Chennai neighbourhood fallback coordinates
export const CHENNAI_FALLBACK_LOCATIONS = [
  { lat: 13.0827, lng: 80.2707, area: 'Chennai Central' },
  { lat: 13.0674, lng: 80.2376, area: 'T. Nagar' },
  { lat: 13.0100, lng: 80.2341, area: 'Adyar' },
  { lat: 13.1186, lng: 80.2324, area: 'Anna Nagar' },
  { lat: 13.0569, lng: 80.2425, area: 'Mylapore' },
  { lat: 13.0550, lng: 80.2707, area: 'Triplicane' },
  { lat: 13.0418, lng: 80.2341, area: 'Velachery' },
  { lat: 12.9249, lng: 80.1000, area: 'Tambaram' },
  { lat: 13.1104, lng: 80.1594, area: 'Ambattur' },
  { lat: 13.0900, lng: 80.2800, area: 'Royapuram' },
  { lat: 13.1389, lng: 80.2325, area: 'Villivakkam' },
  { lat: 13.0357, lng: 80.2110, area: 'Guindy' },
];

export const CHENNAI_DEFAULT = { lat: 13.0827, lng: 80.2707 };

/** Deterministically picks a real Chennai neighbourhood for a given ID string */
export function getFallbackLocation(id: string): { lat: number; lng: number } {
  const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CHENNAI_FALLBACK_LOCATIONS[seed % CHENNAI_FALLBACK_LOCATIONS.length];
}

/** Extracts a 6-digit Indian PIN code from a location string */
export function extractPincode(location: string): string | null {
  const match = location?.match(/\b[1-9][0-9]{5}\b/);
  return match ? match[0] : null;
}

/** Geocodes a 6-digit Indian PIN code via OpenStreetMap Nominatim */
async function geocodePincodeViaOSM(pincode: string): Promise<{ lat: number; lng: number } | null> {
  const cacheKey = `pin_${pincode}`;
  if (cacheKey in geocodeCache) return geocodeCache[cacheKey];

  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'HopeRise-FoodRedistribution/1.0' } });
    const data = await res.json();

    if (data && data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache[cacheKey] = result;
      return result;
    }
  } catch (e) {
    console.warn(`Pincode geocode failed for ${pincode}:`, e);
  }

  geocodeCache[cacheKey] = null;
  return null;
}

/** Geocodes a full address string via OpenStreetMap Nominatim */
async function geocodeAddressViaOSM(address: string): Promise<{ lat: number; lng: number } | null> {
  const cacheKey = `addr_${address}`;
  if (cacheKey in geocodeCache) return geocodeCache[cacheKey];

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'HopeRise-FoodRedistribution/1.0' } });
    const data = await res.json();

    if (data && data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache[cacheKey] = result;
      return result;
    }
  } catch (e) {
    console.warn(`Address geocode failed for "${address}":`, e);
  }

  geocodeCache[cacheKey] = null;
  return null;
}

/**
 * Main resolver — given a record with optional pre-stored lat/lng and a location string,
 * returns the best available coordinates following the priority order.
 */
export async function resolveCoordinates(
  storedLat: number | null | undefined,
  storedLng: number | null | undefined,
  location: string | null | undefined,
  fallbackId: string
): Promise<{ lat: number; lng: number }> {
  // 1. Use pre-stored coordinates (backend already geocoded)
  if (storedLat && storedLng) {
    return { lat: storedLat, lng: storedLng };
  }

  // 2. Extract PIN code from location string and geocode it
  if (location) {
    const pincode = extractPincode(location);
    if (pincode) {
      const pincodeCoords = await geocodePincodeViaOSM(pincode);
      if (pincodeCoords) return pincodeCoords;
    }

    // 3. Try full address geocoding
    const addressCoords = await geocodeAddressViaOSM(location);
    if (addressCoords) return addressCoords;
  }

  // 4. Final fallback: real Chennai neighbourhood
  return getFallbackLocation(fallbackId);
}
