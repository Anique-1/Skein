const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const BITS = [16, 8, 4, 2, 1];

export interface GeohashBounds {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
  centerLat: number;
  centerLon: number;
}

/** Encode coordinates to a geohash string with specified precision. */
export function encodeGeohash(lat: number, lon: number, precision = 6): string {
  const latR = [-90, 90];
  const lonR = [-180, 180];
  let hash = '';
  let bits = 0;
  let value = 0;
  let evenBit = true;

  while (hash.length < precision) {
    const range = evenBit ? lonR : latR;
    const v = evenBit ? lon : lat;
    const mid = (range[0] + range[1]) / 2;
    if (v >= mid) {
      value = value * 2 + 1;
      range[0] = mid;
    } else {
      value = value * 2;
      range[1] = mid;
    }
    evenBit = !evenBit;
    bits++;
    if (bits === 5) {
      hash += BASE32[value];
      bits = 0;
      value = 0;
    }
  }
  return hash;
}

/** Decode a geohash into its bounding box and center coordinate. */
export function decodeGeohash(geohash: string): GeohashBounds {
  let isEven = true;
  const latR = [-90, 90];
  const lonR = [-180, 180];

  const lower = geohash.toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    const c = lower[i];
    const cd = BASE32.indexOf(c);
    if (cd === -1) continue;

    for (let j = 0; j < 5; j++) {
      const mask = BITS[j];
      if (isEven) {
        refineInterval(lonR, cd, mask);
      } else {
        refineInterval(latR, cd, mask);
      }
      isEven = !isEven;
    }
  }

  return {
    latMin: latR[0],
    latMax: latR[1],
    lonMin: lonR[0],
    lonMax: lonR[1],
    centerLat: (latR[0] + latR[1]) / 2,
    centerLon: (lonR[0] + lonR[1]) / 2,
  };
}

function refineInterval(interval: number[], cd: number, mask: number) {
  const mid = (interval[0] + interval[1]) / 2;
  if ((cd & mask) !== 0) {
    interval[0] = mid;
  } else {
    interval[1] = mid;
  }
}

/** Return human-friendly precision label */
export function getPrecisionLabel(precision: number): string {
  switch (precision) {
    case 1:
      return 'Continent (~5000 km)';
    case 2:
      return 'Region (~1200 km)';
    case 3:
      return 'Province (~150 km)';
    case 4:
      return 'City (~38 km)';
    case 5:
      return 'District (~5 km)';
    case 6:
      return 'Neighborhood (~1.2 km)';
    case 7:
      return 'Block (~150 m)';
    default:
      return `Precision ${precision}`;
  }
}
