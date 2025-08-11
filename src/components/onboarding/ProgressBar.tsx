import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/theme';
import { scaleWidth, scaleHeight } from '@/utils/responsive';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressBackground}>
        <View 
          style={[
            styles.progressFill,
            { width: `${progress}%` }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: scaleHeight(12),
  },
  progressBackground: {
    height: scaleHeight(6),
    backgroundColor: theme.colors.gray['1'],
    borderRadius: scaleWidth(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.brand.primary,
    borderRadius: scaleWidth(3),
  },
});