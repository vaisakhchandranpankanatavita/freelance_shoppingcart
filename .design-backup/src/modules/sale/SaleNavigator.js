import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SaleListScreen from './SaleListScreen';
import NewSaleScreen from './NewSaleScreen';
import PaymentScreen from './PaymentScreen';
import CheckoutScreen from './CheckoutScreen';
import BillPreviewScreen from './BillPreviewScreen';
import SaleDetailScreen from './SaleDetailScreen';

const Stack = createNativeStackNavigator();

export default function SaleNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SaleList" component={SaleListScreen} />
      <Stack.Screen name="NewSale" component={NewSaleScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="BillPreview" component={BillPreviewScreen} />
      <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
    </Stack.Navigator>
  );
}
