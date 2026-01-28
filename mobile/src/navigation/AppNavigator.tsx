/**
 * PFF — App navigation. Manifesto (primary onboarding) → Presence Check → Vitalization.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ManifestoFlow } from '../manifesto/ManifestoFlow';
import { VoteForVitalizationScreen } from '../vote/VoteForVitalizationScreen';
import { VitalizationFlow } from '../vitalization/VitalizationFlow';

export type RootStackParamList = {
  Manifesto: undefined;
  Vote: undefined;
  Vitalization: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Manifesto"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0d0d0f' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Manifesto" component={ManifestoFlow} />
      <Stack.Screen name="Vote" component={VoteForVitalizationScreen} />
      <Stack.Screen name="Vitalization" component={VitalizationFlow} />
    </Stack.Navigator>
  );
}
