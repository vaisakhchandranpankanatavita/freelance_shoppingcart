import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PurchaseListScreen from './PurchaseListScreen';
import AddPurchaseScreen from './AddPurchaseScreen';

const Stack = createNativeStackNavigator();

export default function PurchaseNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PurchaseList" component={PurchaseListScreen} />
      <Stack.Screen name="AddPurchase" component={AddPurchaseScreen} />
    </Stack.Navigator>
  );
}
