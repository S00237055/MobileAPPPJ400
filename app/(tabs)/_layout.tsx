import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      
     
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="leaf" color={color} />,
        }}
        />
        <Tabs.Screen 
        name="diary" 
        options={{ 
          title: 'Diary',
          tabBarIcon: ({ color }) => <Ionicons name="book" size={26} color={color} />
        }} 
      />

      <Tabs.Screen
        name="week-details"
        options={{
          href: null,
          headerShown: false,
        }}

        />

        <Tabs.Screen 
        name="workout" 
        options={{ 
          title: 'Workout',
          tabBarIcon: ({ color }) => <Ionicons name="barbell" size={26} color={color} />
        }} 
      />

      <Tabs.Screen 
        name="history" 
        options={{ 
          title: 'History',
          tabBarIcon: ({ color }) => <Ionicons name="time" size={26} color={color} />
        }} 
      />

      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={26} color={color} />
        }} 
      />
    
    </Tabs>
  );
}
