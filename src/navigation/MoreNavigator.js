import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreScreen from '../screens/MoreScreen';
import EntityListScreen from '../modules/manage/EntityListScreen';
import EntityFormScreen from '../modules/manage/EntityFormScreen';
import { stackScreenOptions, sharedElementOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function MoreNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="EntityList" component={EntityListScreen} />
      <Stack.Screen name="EntityForm" component={EntityFormScreen} options={sharedElementOptions} />
    </Stack.Navigator>
  );
}
