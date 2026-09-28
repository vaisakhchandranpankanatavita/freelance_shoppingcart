import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import StockNavigator from '../modules/stock/StockNavigator';
import PurchaseNavigator from '../modules/purchase/PurchaseNavigator';
import SaleNavigator from '../modules/sale/SaleNavigator';
import MoreScreen from '../screens/MoreScreen';
import TabBar from '../components/TabBar';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

// [inactive, active] icon per tab
const ICONS = {
  Dashboard: ['grid-outline', 'grid'],
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Stock" component={StockNavigator} />
      <Tab.Screen name="Purchase" component={PurchaseNavigator} />
      <Tab.Screen name="Sale" component={SaleNavigator} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}
