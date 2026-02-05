/**
 * PFF — App navigation. Bottom tabs: Home (Manifesto → Vote → Vitalization) and Wallet.
 */

import React from 'react';
import { MainTabs } from './MainTabs';

export type RootStackParamList = {
  Manifesto: undefined;
  Vote: undefined;
  Vitalization: undefined;
};

export function AppNavigator(): React.JSX.Element {
  return <MainTabs />;
}
