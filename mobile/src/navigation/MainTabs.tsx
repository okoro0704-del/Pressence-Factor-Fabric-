/**
 * PFF — Bottom tab navigator: Home (Manifesto / Vote / Vitalization) and Wallet.
 * Dedicated icons for each tab (Wallet icon at bottom tab). Tab bar is always visible.
 */

import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ManifestoFlow } from '../manifesto/ManifestoFlow';
import { VoteForVitalizationScreen } from '../vote/VoteForVitalizationScreen';
import { VitalizationFlow } from '../vitalization/VitalizationFlow';
import { SovereignWalletScreen } from '../wallet/SovereignWalletScreen';
import { TabHomeIcon } from './TabHomeIcon';
import { TabWalletIcon } from './TabWalletIcon';

const BG = '#0d0d0f';
const SURFACE = '#16161a';
const BORDER = '#2a2a2e';
const MUTED = '#6b6b70';

export type HomeStackParamList = {
  Manifesto: undefined;
  Vote: undefined;
  Vitalization: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackScreen(): React.JSX.Element {
  return (
    <HomeStack.Navigator
      initialRouteName="Manifesto"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BG },
        animation: 'fade',
      }}
    >
      <HomeStack.Screen name="Manifesto" component={ManifestoFlow} />
      <HomeStack.Screen name="Vote" component={VoteForVitalizationScreen} />
      <HomeStack.Screen name="Vitalization" component={VitalizationFlow} />
    </HomeStack.Navigator>
  );
}

export type MainTabParamList = {
  Home: undefined;
  Wallet: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + (Platform.OS === 'ios' ? insets.bottom : 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { height: tabBarHeight, paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8, paddingTop: 8 },
        ],
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: MUTED,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabHomeIcon focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={SovereignWalletScreen}
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ focused }) => <TabWalletIcon focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: SURFACE,
    borderTopColor: BORDER,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabBarItem: {
    paddingTop: 6,
  },
});
