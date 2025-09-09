import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Colors } from '@/constants/colors';

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
            backgroundColor: isSelected ? activeColor : Colors.transparent,
          },
          styles.maleCirclePosition,
        ]}
      />

      {/* Arrow pointing to top-right at 45 degrees - closer to circle */}
      <View
        style={[
          styles.arrowContainer,
          {
            top: size * 0.05,
            right: size * 0.05,
          },
          styles.absolutePosition,
        ]}
      >
        {/* Arrow line */}
        <View
          style={[
            styles.absolutePosition,
            styles.arrowLine,
            {
              width: arrowLength,
              height: strokeWidth,
              backgroundColor: activeColor,
              top: size * 0.12,
              right: -size * 0.02,
              transform: [{ rotate: '-45deg' }],
            },
          ]}
        />

        {/* Arrow head - horizontal part */}
        <View
          style={[
            styles.absolutePosition,
            styles.arrowHeadTop,
            {
              width: size * 0.2,
              height: strokeWidth,
              backgroundColor: activeColor,
            },
          ]}
        />

        {/* Arrow head - vertical part */}
        <View
          style={[
            styles.absolutePosition,
            styles.arrowHeadTop,
            {
              width: strokeWidth,
              height: size * 0.2,
              backgroundColor: activeColor,
            },
          ]}
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
          styles.femaleCirclePosition,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderWidth: strokeWidth,
            borderColor: activeColor,
            backgroundColor: isSelected ? activeColor : Colors.transparent,
          },
        ]}
      />

      {/* Cross pointing to bottom-left corner at 45 degrees */}
      <View
        style={[
          styles.absolutePosition,
          {
          left: size * 0.1,
          bottom: size * 0.1,
          width: crossLength,
          height: crossLength,
          transform: [{ rotate: '45deg' }],
          },
        ]}
      >
        {/* Vertical stem of cross connecting to circle */}
        <View
          style={[
            styles.absolutePosition,
            {
            width: strokeWidth,
            height: crossLength * 1.4,
            backgroundColor: activeColor,
            left: (crossLength - strokeWidth) / 2,
            top: -crossLength * 0.4,
            },
          ]}
        />

        {/* Horizontal arm of cross */}
        <View
          style={[
            styles.absolutePosition,
            {
            width: crossLength * 0.6,
            height: strokeWidth,
            backgroundColor: activeColor,
            left: (crossLength - crossLength * 0.6) / 2,
            top: (crossLength - strokeWidth) / 2,
            },
          ]}
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
    backgroundColor: Colors.transparent,
    position: 'absolute',
  },
  femaleCirclePosition: {
    top: 0,
    right: 0,
  },
  maleCirclePosition: {
    left: 0,
    bottom: 0,
  },
  absolutePosition: {
    position: 'absolute' as const,
  },
  arrowLine: {
    transformOrigin: 'center' as const, // Used for web compatibility
  },
  arrowHeadTop: {
    top: 0,
    right: 0,
  },
  container: {
    position: 'relative',
  },
});
