import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { GEOHASH_PRECISION } from '../config';
import { encodeGeohash } from './geohash';

export type AreaStatus = 'loading' | 'ready' | 'denied' | 'error';

export interface Area {
  status: AreaStatus;
  geohash?: string;
  refresh: () => void;
}

/**
 * Turns your position into a rough area code. Coordinates are read once,
 * converted, and thrown away: only the geohash is kept in memory.
 */
export function useArea(): Area {
  const [status, setStatus] = useState<AreaStatus>('loading');
  const [geohash, setGeohash] = useState<string>();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setStatus('loading');
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted) {
          if (alive) setStatus('denied');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!alive) return;
        setGeohash(encodeGeohash(pos.coords.latitude, pos.coords.longitude, GEOHASH_PRECISION));
        setStatus('ready');
      } catch {
        if (alive) setStatus('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { status, geohash, refresh };
}
