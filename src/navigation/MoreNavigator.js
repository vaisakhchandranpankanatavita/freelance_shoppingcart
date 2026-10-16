import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreScreen from '../screens/MoreScreen';
import EntityListScreen from '../modules/manage/EntityListScreen';
import EntityFormScreen from '../modules/manage/EntityFormScreen';
import StockLedgerScreen from '../modules/stock/StockLedgerScreen';
import PurchaseRequestListScreen from '../modules/purchaseRequest/PurchaseRequestListScreen';
import PurchaseRequestFormScreen from '../modules/purchaseRequest/PurchaseRequestFormScreen';
import SupplierPaymentListScreen from '../modules/supplierPayment/SupplierPaymentListScreen';
import SupplierPaymentFormScreen from '../modules/supplierPayment/SupplierPaymentFormScreen';
import ReportsHomeScreen from '../modules/reports/ReportsHomeScreen';
import ReportListScreen from '../modules/reports/ReportListScreen';
import { stackScreenOptions, sharedElementOptions, bottomSheetScreenOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function MoreNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="EntityList" component={EntityListScreen} />
      <Stack.Screen
        name="EntityForm"
        component={EntityFormScreen}
        options={({ route }) => {
          if (route.params?.entity !== 'shop' && route.params?.id == null) return bottomSheetScreenOptions;
          return route.params?.id != null ? sharedElementOptions : undefined;
        }}
      />
      <Stack.Screen name="StockLedger" component={StockLedgerScreen} />
      <Stack.Screen name="PurchaseRequestList" component={PurchaseRequestListScreen} />
      <Stack.Screen
        name="PurchaseRequestForm"
        component={PurchaseRequestFormScreen}
        options={({ route }) => (route.params?.requestId == null ? bottomSheetScreenOptions : sharedElementOptions)}
      />
      <Stack.Screen name="SupplierPaymentList" component={SupplierPaymentListScreen} />
      <Stack.Screen
        name="SupplierPaymentForm"
        component={SupplierPaymentFormScreen}
        options={({ route }) => (route.params?.paymentId == null ? bottomSheetScreenOptions : sharedElementOptions)}
      />
      <Stack.Screen name="ReportsHome" component={ReportsHomeScreen} />
      <Stack.Screen name="ReportDetail" component={ReportListScreen} />
    </Stack.Navigator>
  );
}
