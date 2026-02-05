/**
 * Dedicated Wallet icon for bottom tab — gold wallet outline.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const GOLD = '#D4AF37';
const MUTED = '#6b6b70';

interface TabWalletIconProps {
  focused: boolean;
  size?: number;
}

export function TabWalletIcon({ focused, size = 24 }: TabWalletIconProps): React.JSX.Element {
  const color = focused ? GOLD : MUTED;
  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M21 12V7H5a2 2 0 01-2-2c0-1.1.9-2 2-2h14v5"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M19 12H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M17 16h.01"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
