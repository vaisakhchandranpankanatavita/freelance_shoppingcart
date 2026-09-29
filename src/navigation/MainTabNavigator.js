import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardNavigator from './DashboardNavigator';
import StockNavigator from '../modules/stock/StockNavigator';
import PurchaseNavigator from '../modules/purchase/PurchaseNavigator';
import SaleNavigator from '../modules/sale/SaleNavigator';
import MoreNavigator from './MoreNavigator';
import TabBar from '../components/TabBar';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

// [inactive, active] icon per tab
const ICONS = {
  Dashboard: ['speedometer-outline', 'speedometer'],
  Stock: ['cube-outline', 'cube'],
  Purchase: ['cart-outline', 'cart'],
  Sale: ['pricetag-outline', 'pricetag'],
  More: ['ellipsis-horizontal', 'ellipsis-horizontal'],
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      sceneContainerStyle={{ backgroundColor: colors.bg }}
      tabBar={(props) => <TabBar {...props} icons={ICONS} />}
    >
      <Tab.Screen name="Dashboard" component={DashboardNavigator} />
      <Tab.Screen name="Stock" component={StockNavigator} />
      <Tab.Screen name="Purchase" component={PurchaseNavigator} />
      <Tab.Screen name="Sale" component={SaleNavigator} />
      <Tab.Screen name="More" component={MoreNavigator} />
    </Tab.Navigator>
  );
}
