import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors, fonts } from '../theme';
import { decodeGeohash, encodeGeohash, getPrecisionLabel } from '../location/geohash';

interface GeohashMapPickerProps {
  visible: boolean;
  initialGeohash?: string;
  onSelect: (geohash: string) => void;
  onClose: () => void;
}

export default function GeohashMapPicker({
  visible,
  initialGeohash = '9q',
  onSelect,
  onClose,
}: GeohashMapPickerProps) {
  const [selectedHash, setSelectedHash] = useState(initialGeohash);
  const [precision, setPrecision] = useState(Math.max(2, initialGeohash.length || 2));
  const webViewRef = useRef<any>(null);

  const RNWebView = WebView as any;

  const bounds = useMemo(() => {
    try {
      return decodeGeohash(selectedHash);
    } catch {
      return decodeGeohash('9q');
    }
  }, [selectedHash]);

  const mapHtml = useMemo(() => {
    const lat = bounds.centerLat || 34.0522;
    const lon = bounds.centerLon || -118.2437;
    const zoom = precision <= 2 ? 5 : precision <= 4 ? 9 : 13;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body, #map { width: 100%; height: 100%; background: #15111F; }
          .geohash-label {
            background: transparent;
            border: none;
            box-shadow: none;
            color: #F6D186;
            font-weight: 800;
            font-size: 16px;
            font-family: monospace;
            text-shadow: 0 0 6px rgba(0,0,0,0.8), 0 0 2px #15111F;
          }
          .leaflet-control-attribution {
            background: rgba(21, 17, 31, 0.75) !important;
            color: #B9AFD0 !important;
            font-size: 9px !important;
          }
          .leaflet-control-attribution a { color: #F2A7C3 !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
          const BITS = [16, 8, 4, 2, 1];

          function encodeGeohash(lat, lon, precision) {
            const latR = [-90, 90];
            const lonR = [-180, 180];
            let hash = '';
            let bits = 0, value = 0, evenBit = true;
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

          function decodeGeohash(geohash) {
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
                  const mid = (lonR[0] + lonR[1]) / 2;
                  if ((cd & mask) !== 0) lonR[0] = mid; else lonR[1] = mid;
                } else {
                  const mid = (latR[0] + latR[1]) / 2;
                  if ((cd & mask) !== 0) latR[0] = mid; else latR[1] = mid;
                }
                isEven = !isEven;
              }
            }
            return {
              latMin: latR[0], latMax: latR[1],
              lonMin: lonR[0], lonMax: lonR[1],
              centerLat: (latR[0] + latR[1]) / 2,
              centerLon: (lonR[0] + lonR[1]) / 2
            };
          }

          const map = L.map('map', {
            zoomControl: false,
            attributionControl: true
          }).setView([${lat}, ${lon}], ${zoom});

          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }).addTo(map);

          let currentPrecision = ${precision};
          let boxLayer = null;
          let labelMarker = null;

          function updateHash() {
            const center = map.getCenter();
            const hash = encodeGeohash(center.lat, center.lng, currentPrecision);
            const b = decodeGeohash(hash);

            if (boxLayer) map.removeLayer(boxLayer);
            if (labelMarker) map.removeLayer(labelMarker);

            const bounds = [[b.latMin, b.lonMin], [b.latMax, b.lonMax]];
            boxLayer = L.rectangle(bounds, {
              color: '#F2A7C3',
              weight: 2.5,
              fillColor: '#F6D186',
              fillOpacity: 0.12,
              dashArray: '4, 4'
            }).addTo(map);

            const labelIcon = L.divIcon({
              className: 'geohash-label',
              html: '#' + hash,
              iconSize: [80, 24],
              iconAnchor: [40, 12]
            });
            labelMarker = L.marker([b.centerLat, b.centerLon], { icon: labelIcon, interactive: false }).addTo(map);

            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'GEOHASH_CHANGED',
                geohash: hash,
                precision: currentPrecision
              }));
            }
          }

          map.on('moveend', updateHash);
          map.on('zoomend', updateHash);

          window.changePrecision = function(delta) {
            currentPrecision = Math.max(2, Math.min(7, currentPrecision + delta));
            updateHash();
          };

          window.zoomIn = function() { map.zoomIn(); };
          window.zoomOut = function() { map.zoomOut(); };
          window.setTarget = function(tLat, tLon, p) {
            currentPrecision = p || currentPrecision;
            map.setView([tLat, tLon], currentPrecision <= 2 ? 5 : currentPrecision <= 4 ? 9 : 13);
          };

          updateHash();
        </script>
      </body>
      </html>
    `;
  }, [bounds, precision]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'GEOHASH_CHANGED' && data.geohash) {
        setSelectedHash(data.geohash);
        if (data.precision) setPrecision(data.precision);
      }
    } catch {
      // ignore message parse errors
    }
  };

  const handleZoom = (delta: number) => {
    const nextP = Math.max(2, Math.min(7, precision + delta));
    setPrecision(nextP);
    webViewRef.current?.injectJavaScript(`
      if (window.changePrecision) {
        window.changePrecision(${delta});
      }
      if (${delta} > 0 && window.zoomIn) window.zoomIn();
      if (${delta} < 0 && window.zoomOut) window.zoomOut();
      true;
    `);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.root}>
        {/* Top Header Banner */}
        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <View style={styles.banner}>
            <Text style={styles.bannerText}>pan and zoom to select a geohash</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Map View */}
        <View style={styles.mapContainer}>
          <RNWebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            onMessage={handleMessage}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>

        {/* Bottom Selection Toolbar */}
        <View style={styles.bottomToolbar}>
          {/* Active Geohash Badge */}
          <View style={styles.badgeWrapper}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>#{selectedHash}</Text>
            </View>
            <Text style={styles.precisionLabel}>{getPrecisionLabel(precision)}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => handleZoom(-1)}
              style={styles.zoomBtn}
              accessibilityRole="button"
              accessibilityLabel="Zoom out / Larger area"
            >
              <Text style={styles.zoomText}>−</Text>
            </Pressable>

            <Pressable
              onPress={() => handleZoom(1)}
              style={styles.zoomBtn}
              accessibilityRole="button"
              accessibilityLabel="Zoom in / Smaller area"
            >
              <Text style={styles.zoomText}>+</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onSelect(selectedHash);
                onClose();
              }}
              style={styles.selectBtn}
              accessibilityRole="button"
            >
              <Text style={styles.selectCheck}>✓</Text>
              <Text style={styles.selectText}>select</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.ink,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.wool,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.fiber,
  },
  closeText: {
    color: colors.paper,
    fontSize: 16,
    fontWeight: '700',
  },
  banner: {
    backgroundColor: colors.wool,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.fiber,
  },
  bannerText: {
    color: colors.mist,
    fontFamily: fonts.display,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 36,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  map: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  bottomToolbar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: colors.ink,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.fiber,
    alignItems: 'center',
    gap: 12,
  },
  badgeWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    backgroundColor: colors.wool,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.knot,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeText: {
    color: colors.knot,
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  precisionLabel: {
    color: colors.mist,
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  zoomBtn: {
    width: 58,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.wool,
    borderWidth: 1.5,
    borderColor: colors.fiber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    color: colors.paper,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 28,
  },
  selectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.thread,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  selectCheck: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  selectText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
