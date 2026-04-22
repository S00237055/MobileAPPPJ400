import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from '@/constants/theme';


export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];


  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Welcome Back!</Text>
          <Text style={[styles.subtitle, { color: theme.icon }]}>Ready to crush your goals today?</Text>
        </View>
      {/* Button to go to Workout Screen */}
      
      <TouchableOpacity 
        style={[styles.menuButton, { backgroundColor: theme.tint }]}
        onPress={() => router.push('/(tabs)/workout')} // <--- Navigate to app/workout.tsx
      >
        <Text style={styles.btnText}>💪 Log Workout</Text>
      </TouchableOpacity>

      {/* Placeholder for Food Log */}
      <TouchableOpacity 
        style={[styles.menuButton, { backgroundColor: theme.cardBackground, borderWidth: 2, borderColor: theme.tint }]} 
        onPress={() => router.push('/(tabs)/nutrition')}
        activeOpacity={0.8}
      >
        <Text style={styles.btnText}>🍎 Log Food</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
     flex: 1, 
     justifyContent: 'center', 
     padding: 24,  
    },
    headerContainer: {
      marginBottom: 40,
      alignItems: 'center',
    },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    marginBottom: 8, 
    
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuButton: { 
    paddingVertical: 18, 
    borderRadius: 16, 
    marginBottom: 16, 
    alignItems: 'center', 
    shadowColor: '#000',
    shadowOpacity: 0.15, 
    shadowRadius: 8, 
    elevation: 4,
  },
  btnText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold' 
  }
});