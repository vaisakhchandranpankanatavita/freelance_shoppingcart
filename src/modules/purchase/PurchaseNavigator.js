import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PurchaseListScreen from './PurchaseListScreen';
import AddPurchaseScreen from './AddPurchaseScreen';
import { stackScreenOptions } from '../../navigation/stackOptions';

const Stack = createNativeStackNavigator();

export default function PurchaseNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="PurchaseList" component={PurchaseListScreen} />
      <Stack.Screen name="AddPurchase" component={AddPurchaseScreen} />
    </Stack.Navigator>
  );
}
