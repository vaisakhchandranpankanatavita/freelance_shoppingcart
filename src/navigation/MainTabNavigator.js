import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardNavigator from './DashboardNavigator';
import StockNavigator from '../modules/stock/StockNavigator';
import PurchaseNavigator from '../modules/purchase/PurchaseNavigator';
import SaleNavigator from '../modules/sale/SaleNavigator';
import MoreNavigator from './MoreNavigator';
import TabBar from '../components/TabBar';
import QuickActionsSheet from '../components/QuickActionsSheet';
import AppHeader from '../components/AppHeader';
import { HeaderActionProvider } from '../components/AddButton';
import { colors } from '../theme';
import { SectionProvider } from '../components/Screen';

const Tab = createBottomTabNavigator();

// Each tab's stack is wrapped so every Screen inside it knows which section it belongs to and
// paints that section's background tint (theme `sectionTints`). Built once at module level so
// the component identities stay stable across renders.
const inSection = (name, Navigator) => {
  const Section = (props) => (
    <SectionProvider value={name}>
      <Navigator {...props} />
    </SectionProvider>
  );
  Section.displayName = `${name}Section`;
  return Section;
};
const DashboardTab = inSection('Dashboard', DashboardNavigator);
const StockTab = inSection('Stock', StockNavigator);
const PurchaseTab = inSection('Purchase', PurchaseNavigator);
const SaleTab = inSection('Sale', SaleNavigator);
const MoreTab = inSection('More', MoreNavigator);

// [inactive, active] icon per tab
const ICONS = {
  Dashboard: ['speedometer-outline', 'speedometer'],
  Stock: ['cube-outline', 'cube'],
  Purchase: ['cart-outline', 'cart'],
  Sale: ['pricetag-outline', 'pricetag'],
  More: ['ellipsis-horizontal', 'ellipsis-horizontal'],
};

// One persistent header + tab bar pair, rendered by the `tabBar` slot so both stay mounted
// across tab switches instead of remounting with each screen (see AppHeader.js/TabBar.js). The
// "Quick actions" tab bar item isn't a route, so it opens this sheet imperatively via ref.
function TabChrome(props) {
  const sheetRef = useRef(null);
  return (
    <>
      <AppHeader state={props.state} navigation={props.navigation} />
      <TabBar {...props} icons={ICONS} onQuickActions={() => sheetRef.current?.open()} />
      <QuickActionsSheet ref={sheetRef} navigation={props.navigation} />
    </>
  );
}

export default function MainTabNavigator() {
  return (
    <HeaderActionProvider>
    <Tab.Navigator
      screenOptions={{ headerShown: false, freezeOnBlur: true }}
      sceneContainerStyle={{ backgroundColor: colors.bg }}
      tabBar={(props) => <TabChrome {...props} />}
    >
      <Tab.Screen name="Dashboard" component={DashboardTab} />
      <Tab.Screen name="Stock" component={StockTab} />
      <Tab.Screen name="Purchase" component={PurchaseTab} />
      <Tab.Screen name="Sale" component={SaleTab} />
      <Tab.Screen name="More" component={MoreTab} />
    </Tab.Navigator>
    </HeaderActionProvider>
  );
}
