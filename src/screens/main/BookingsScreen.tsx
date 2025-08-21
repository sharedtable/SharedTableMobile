import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

import { theme } from '@/theme';
import { scaleHeight, scaleFont } from '@/utils/responsive';

export function BookingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>Your upcoming dining reservations</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: scaleFont(16),
    textAlign: 'center',
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: scaleFont(28),
    fontWeight: '700',
    marginBottom: scaleHeight(8),
    textAlign: 'center',
  },
});
