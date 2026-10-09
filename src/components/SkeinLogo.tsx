import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { colors } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SkeinLogoProps {
  size?: number;
  animated?: boolean;
}

export default function SkeinLogo({ size = 96, animated = true }: SkeinLogoProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, pulse]);

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  // Concentric radar rings
  const ringR1 = r * 0.35;
  const ringR2 = r * 0.65;
  const ringR3 = r * 0.95;

  // Nodes on the mesh perimeter
  const angles = [15, 75, 135, 195, 255, 315];
  const radiiMult = [0.65, 0.95, 0.65, 0.95, 0.65, 0.95];

  const nodes = angles.map((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    const dist = r * radiiMult[i];
    return {
      x: cx + dist * Math.cos(rad),
      y: cy + dist * Math.sin(rad),
    };
  });

  const pulseR = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [r * 0.2, r * 0.45],
  });

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.2, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Radar Rings */}
        <Circle cx={cx} cy={cy} r={ringR1} stroke={colors.fiber} strokeWidth={1.5} fill="none" />
        <Circle cx={cx} cy={cy} r={ringR2} stroke={colors.fiber} strokeWidth={1.5} fill="none" />
        <Circle cx={cx} cy={cy} r={ringR3} stroke={colors.fiber} strokeWidth={1.5} fill="none" />

        {/* Center-to-Node Spokes */}
        {[0, 2, 4].map((idx) => (
          <Line
            key={`spoke-${idx}`}
            x1={cx}
            y1={cy}
            x2={nodes[idx].x}
            y2={nodes[idx].y}
            stroke={colors.thread}
            strokeWidth={2}
            strokeOpacity={0.85}
          />
        ))}

        {/* Outer Perimeter Mesh Threads */}
        {nodes.map((n, i) => {
          const next = nodes[(i + 1) % nodes.length];
          return (
            <Line
              key={`thread-${i}`}
              x1={n.x}
              y1={n.y}
              x2={next.x}
              y2={next.y}
              stroke={colors.thread}
              strokeWidth={2}
              strokeOpacity={0.9}
            />
          );
        })}

        {/* Pulse Aura around center knot */}
        {animated && (
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={pulseR}
            fill={colors.knot}
            opacity={pulseOpacity}
          />
        )}

        {/* Outer Nodes */}
        {nodes.map((n, i) => (
          <React.Fragment key={`node-${i}`}>
            <Circle cx={n.x} cy={n.y} r={Math.max(3, size * 0.024)} fill={colors.thread} />
            <Circle cx={n.x} cy={n.y} r={Math.max(1.5, size * 0.009)} fill={colors.paper} />
          </React.Fragment>
        ))}

        {/* Center Golden Knot */}
        <Circle cx={cx} cy={cy} r={Math.max(5, size * 0.048)} fill={colors.knot} />
        <Circle cx={cx} cy={cy} r={Math.max(2, size * 0.018)} fill={colors.paper} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
