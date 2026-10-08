const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/** Encode a coordinate to a geohash. 6 characters is about 1.2 km x 0.6 km. */
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
