import React from 'react';
import { View, StyleSheet } from 'react-native';

// import { scaleWidth } from '@/utils/responsive';

interface GenderIconProps {
  size?: number;
  color?: string;
  isSelected?: boolean;
}

export const MaleIcon: React.FC<GenderIconProps> = ({
  size = 50,
  color = '#999999',
  isSelected = false,
}) => {
  const activeColor = isSelected ? color : '#999999';
  const circleSize = size * 0.65; // Circle is 65% of total size
  const arrowLength = size * 0.4; // Arrow length
  const strokeWidth = size * 0.06; // Line thickness

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Circle */}
      <View
        style={[
          styles.circle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderWidth: strokeWidth,
            borderColor: activeColor,
            backgroundColor: isSelected ? activeColor : 'transparent',
            left: 0,
            bottom: 0,
          },
        ]}
      />

      {/* Arrow pointing to top-right at 45 degrees - closer to circle */}
      <View
        style={[
          styles.arrowContainer,
          {
            position: 'absolute',
            top: size * 0.05,
            right: size * 0.05,
          },
        ]}
      >
        {/* Arrow line */}
        <View
          style={{
            position: 'absolute',
            width: arrowLength,
            height: strokeWidth,
            backgroundColor: activeColor,
            top: size * 0.12,
            right: -size * 0.02,
            transform: [{ rotate: '-45deg' }],
            transformOrigin: 'center',
          }}
        />

        {/* Arrow head - horizontal part */}
        <View
          style={{
            position: 'absolute',
            width: size * 0.2,
            height: strokeWidth,
            backgroundColor: activeColor,
            top: 0,
            right: 0,
          }}
        />

        {/* Arrow head - vertical part */}
        <View
          style={{
            position: 'absolute',
            width: strokeWidth,
            height: size * 0.2,
            backgroundColor: activeColor,
            top: 0,
            right: 0,
          }}
        />
      </View>
    </View>
  );
};

export const FemaleIcon: React.FC<GenderIconProps> = ({
  size = 50,
  color = '#999999',
  isSelected = false,
}) => {
  const activeColor = isSelected ? color : '#999999';
  const circleSize = size * 0.65; // Circle is 65% of total size
  const crossLength = size * 0.35; // Length of cross stem and arms
  const strokeWidth = size * 0.06; // Line thickness

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Circle positioned top-right */}
      <View
        style={[
          styles.circle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderWidth: strokeWidth,
            borderColor: activeColor,
            backgroundColor: isSelected ? activeColor : 'transparent',
            top: 0,
            right: 0,
          },
        ]}
      />

      {/* Cross pointing to bottom-left corner at 45 degrees */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.1,
          bottom: size * 0.1,
          width: crossLength,
          height: crossLength,
          transform: [{ rotate: '45deg' }],
        }}
      >
        {/* Vertical stem of cross connecting to circle */}
        <View
          style={{
            position: 'absolute',
            width: strokeWidth,
            height: crossLength * 1.4,
            backgroundColor: activeColor,
            left: (crossLength - strokeWidth) / 2,
            top: -crossLength * 0.4,
          }}
        />

        {/* Horizontal arm of cross */}
        <View
          style={{
            position: 'absolute',
            width: crossLength * 0.6,
            height: strokeWidth,
            backgroundColor: activeColor,
            left: (crossLength - crossLength * 0.6) / 2,
            top: (crossLength - strokeWidth) / 2,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  arrowContainer: {
    position: 'relative',
  },
  circle: {
    backgroundColor: 'transparent',
    position: 'absolute',
  },
  container: {
    position: 'relative',
  },
});
