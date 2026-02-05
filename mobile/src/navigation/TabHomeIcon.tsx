/**
 * Dedicated Home icon for bottom tab — gold house outline.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const GOLD = '#D4AF37';
const MUTED = '#6b6b70';

interface TabHomeIconProps {
  focused: boolean;
  size?: number;
}

export function TabHomeIcon({ focused, size = 24 }: TabHomeIconProps): React.JSX.Element {
  const color = focused ? GOLD : MUTED;
  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 22V12h6v10"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
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
