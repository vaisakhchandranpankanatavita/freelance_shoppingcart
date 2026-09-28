import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StockListScreen from './StockListScreen';
import AddStockScreen from './AddStockScreen';
import { stackScreenOptions } from '../../navigation/stackOptions';

const Stack = createNativeStackNavigator();

export default function StockNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="StockList" component={StockListScreen} />
      <Stack.Screen name="AddStock" component={AddStockScreen} />
    </Stack.Navigator>
  );
}
