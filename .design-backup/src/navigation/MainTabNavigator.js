import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import StockNavigator from '../modules/stock/StockNavigator';
import PurchaseNavigator from '../modules/purchase/PurchaseNavigator';
import SaleNavigator from '../modules/sale/SaleNavigator';
import MoreScreen from '../screens/MoreScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const iconMap = {
  Dashboard: 'grid-outline',
  Stock: 'cube-outline',
  Purchase: 'cart-outline',
  Sale: 'pricetag-outline',
  More: 'ellipsis-horizontal-circle-outline',
};
const iconMapActive = {
  Dashboard: 'grid',
  Stock: 'cube',
  Purchase: 'cart',
  Sale: 'pricetag',
  More: 'ellipsis-horizontal-circle',
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelPosition: 'below-icon',
        tabBarAllowFontScaling: false,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: -2 },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused, color }) => (
          <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
            <Ionicons
              name={focused ? iconMapActive[route.name] : iconMap[route.name]}
              size={20}
              color={color}
            />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Stock" component={StockNavigator} />
      <Tab.Screen name="Purchase" component={PurchaseNavigator} />
      <Tab.Screen name="Sale" component={SaleNavigator} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 68,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 0,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.surfaceAlt,
  },
});
