import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      
      {/* Button to go to Workout Screen */}
      
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => router.push('/(tabs)/workout')} // <--- Navigate to app/workout.tsx
      >
        <Text style={styles.btnText}>💪 Log Workout</Text>
      </TouchableOpacity>

      {/* Placeholder for Food Log */}
      <TouchableOpacity 
        style={[styles.menuButton, { backgroundColor: '#FF9500' }]} 
        onPress={() => router.push('/(tabs)/nutrition')}
      >
        <Text style={styles.btnText}>🍎 Log Food</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
  menuButton: { 
    backgroundColor: '#007AFF', padding: 20, borderRadius: 15, 
    marginBottom: 20, alignItems: 'center', shadowColor: '#000',
    shadowOpacity: 0.1, shadowRadius: 5, elevation: 3
  },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});