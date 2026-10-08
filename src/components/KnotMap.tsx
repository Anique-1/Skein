import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';
import { Peer } from '../mesh/types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const HEIGHT = 190;

interface Placed {
  peer: Peer;
  x: number;
  y: number;
}

/**
 * You are the gold knot in the middle. Each ring is one more hop away.
 * Threads show which neighbour a message would travel through.
 */
export default function KnotMap({ peers, width }: { peers: Peer[]; width: number }) {
  const cx = width / 2;
  const cy = HEIGHT / 2;
  const rx = width / 2 - 34;
  const ry = HEIGHT / 2 - 26;
  const maxRing = Math.min(Math.max(2, ...peers.map((p) => p.hops)), 7);

  const placed = useMemo<Placed[]>(() => {
    const byRing = new Map<number, Peer[]>();
    peers.forEach((p) => {
      const ring = Math.min(p.hops, maxRing);
      byRing.set(ring, [...(byRing.get(ring) ?? []), p]);
    });
    const out: Placed[] = [];
    byRing.forEach((list, ring) => {
      const f = 0.3 + (0.7 * (ring - 1)) / Math.max(1, maxRing - 1);
      list.forEach((peer, i) => {
        const a = ((i + 0.5) / list.length) * Math.PI * 2 + ring * 0.9 - Math.PI / 2;
        out.push({ peer, x: cx + Math.cos(a) * rx * f, y: cy + Math.sin(a) * ry * f });
      });
    });
    return out;
  }, [peers, maxRing, cx, cy, rx, ry]);

  // Pulse around "you": the one moving thing on the screen.
  const pulse = useRef(new Animated.Value(0)).current;
  const [still, setStill] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
  }, []);
  useEffect(() => {
    if (still) return;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 2600, useNativeDriver: false }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, still]);

  const pulseR = pulse.interpolate({ inputRange: [0, 1], outputRange: [9, 26] });
  const pulseO = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  const parentOf = (p: Placed): { x: number; y: number } => {
    if (p.peer.hops <= 1) return { x: cx, y: cy };
    const candidates = placed.filter((q) => q.peer.hops < p.peer.hops);
    if (candidates.length === 0) return { x: cx, y: cy };
    return candidates.reduce((best, q) =>
      Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(best.x - p.x, best.y - p.y) ? q : best,
    );
  };

  return (
    <View accessible accessibilityLabel={`${peers.length} people nearby`}>
      <Svg width={width} height={HEIGHT}>
        {Array.from({ length: maxRing }, (_, i) => {
          const f = 0.3 + (0.7 * i) / Math.max(1, maxRing - 1);
          return (
            <Ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={rx * f}
              ry={ry * f}
              stroke={colors.fiber}
              strokeWidth={1}
              strokeDasharray="3 5"
              fill="none"
            />
          );
        })}
        {placed.map((p) => {
          const from = parentOf(p);
          return (
            <Line
              key={`l-${p.peer.id}`}
              x1={from.x}
              y1={from.y}
              x2={p.x}
              y2={p.y}
              stroke={colors.thread}
              strokeOpacity={0.5}
              strokeWidth={1.5}
            />
          );
        })}
        {placed.map((p) => (
          <React.Fragment key={p.peer.id}>
            <Circle cx={p.x} cy={p.y} r={5.5} fill={colors.thread} />
            <SvgText x={p.x} y={p.y + 18} fontSize={10} fill={colors.mist} textAnchor="middle">
              {p.peer.name}
            </SvgText>
          </React.Fragment>
        ))}
        {!still && <AnimatedCircle cx={cx} cy={cy} r={pulseR} fill={colors.knot} opacity={pulseO} />}
        <Circle cx={cx} cy={cy} r={8} fill={colors.knot} />
        <SvgText x={cx} y={cy + 24} fontSize={10} fill={colors.knot} textAnchor="middle">
          you
        </SvgText>
      </Svg>
    </View>
  );
}
