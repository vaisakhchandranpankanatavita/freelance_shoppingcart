import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import MetricDetailScreen from '../screens/MetricDetailScreen';
import { stackScreenOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function DashboardNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      {/* Cross-fade in: the gauge's own zoom/sweep carries the motion. */}
      <Stack.Screen name="MetricDetail" component={MetricDetailScreen} options={{ animation: 'fade' }} />
    </Stack.Navigator>
  );
}
