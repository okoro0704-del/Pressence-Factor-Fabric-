/**
 * PFF — Vitalization Flow
 * Step progress indicator.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STEPS = ['Welcome', 'Identity', 'Device', 'Done'];
const TOTAL = STEPS.length;

interface StepIndicatorProps {
  current: number;
}

export function StepIndicator({ current }: StepIndicatorProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {STEPS.map((label, i) => {
        const active = i === current;
        const past = i < current;
        return (
          <View key={label} style={styles.item}>
            <View
              style={[
                styles.dot,
                active && styles.dotActive,
                past && styles.dotPast,
              ]}
            >
              {past ? (
                <Text style={styles.check}>✓</Text>
              ) : (
                <Text style={[styles.num, active && styles.numActive]}>{i + 1}</Text>
              )}
            </View>
            {i < TOTAL - 1 && <View style={[styles.line, past && styles.linePast]} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: '#0f172a',
  },
  dotPast: {
    backgroundColor: '#0f172a',
  },
  num: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  numActive: {
    color: '#fff',
  },
  check: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  line: {
    width: 24,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 2,
  },
  linePast: {
    backgroundColor: '#0f172a',
  },
});
