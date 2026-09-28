import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import MainTabNavigator from './MainTabNavigator';
import { colors, spacing, radius } from '../theme';
import { useAuth } from '../context/AuthContext';

const Drawer = createDrawerNavigator();

const menuItems = [
  { key: 'Dashboard', label: 'Dashboard', icon: 'home-outline', target: 'Dashboard' },
  { key: 'Stock', label: 'Manage Inventory', icon: 'cube-outline', target: 'Stock' },
  { key: 'Purchase', label: 'Purchase', icon: 'cart-outline', target: 'Purchase' },
  { key: 'Sale', label: 'Sales & Billing', icon: 'pricetag-outline', target: 'Sale' },
  { key: 'Reports', label: 'Reports', icon: 'bar-chart-outline', target: 'Dashboard' },
  { key: 'Staff', label: 'Manage Staff', icon: 'people-outline', target: 'Dashboard' },
  { key: 'Refunds', label: 'Manage Refunds', icon: 'refresh-outline', target: 'Sale' },
  { key: 'Branches', label: 'Manage Branches', icon: 'business-outline', target: 'Dashboard' },
  { key: 'Settings', label: 'Settings', icon: 'settings-outline', target: 'Dashboard' },
];

function CustomDrawer(props) {
  const { user, logout } = useAuth();
  const { navigation } = props;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <View style={styles.brandCard}>
        <Text style={styles.brandText}>Grocery App</Text>
      </View>

      <View style={styles.userRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name || 'A').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
          <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'ADMIN'}</Text>
        </View>
      </View>

      <View style={{ marginTop: spacing.md }}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => {
              navigation.closeDrawer();
              navigation.navigate('Main', { screen: item.target });
            }}
          >
            <Ionicons name={item.icon} size={20} color={colors.primaryDark} />
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

export default function AppDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false, drawerStyle: { width: 280 } }}
      drawerContent={(props) => <CustomDrawer {...props} />}
    >
      <Drawer.Screen name="Main" component={MainTabNavigator} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md, backgroundColor: colors.background },
  brandCard: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  brandText: { fontSize: 22, fontWeight: '800', color: colors.primaryDark },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  userName: { fontSize: 15, fontWeight: '700', color: colors.text },
  userRole: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  menuLabel: { marginLeft: spacing.md, fontSize: 14, color: colors.text, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutText: { marginLeft: spacing.sm, color: colors.danger, fontWeight: '600' },
});
