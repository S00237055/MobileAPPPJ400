import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

interface Workout {
  workoutId: number;
  userId: number;
  date: string;
  notes: string;
  workoutSets: {
    
    weightKg: number;
    reps: number;
    exercise?: {
        name: string;
    };
  }[];
}

export default function HistoryScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);
  const API_URL = 'http://10.20.4.100:5226/api'; 

  useFocusEffect(
    useCallback(() => {
    fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) { setLoading(false); return; }
      const myUserId = parseInt(userIdStr);

      // Fetch all workouts
      const response = await fetch(`${API_URL}/Workouts`); 

      if (!response.ok) {
        
        console.log("Server Error Code:", response.status);
        throw new Error("Failed to fetch");
      }

      const allWorkouts = await response.json();

      //Filter by my userId
      const myWorkouts = allWorkouts.filter((w: Workout) => w.userId === myUserId);
      
      // Sort by date
      myWorkouts.sort((a: Workout, b: Workout) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setWorkouts(myWorkouts);
      setFilteredWorkouts(myWorkouts);
      setLoading(false);
    } catch (error) {
      console.log("HISTORY ERROR:", error);
      Alert.alert("Error", "Could not load history");
      setLoading(false);
    }
  };

  const renderWorkout = ({ item }: { item: Workout }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>
          {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </Text>
      </View>
      {item.workoutSets.map((set, index) => (
        <Text key={index} style={styles.setText}>
          • {set.exercise?.name || "Unknown Exercise"}: {set.weightKg}kg x {set.reps}
        </Text>
      ))}
      {item.notes && <Text style={styles.notes}>📝😂 {item.notes}</Text>}
    </View>
  );

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text) {
        const filtered = workouts.filter(w => 
        
        w.notes?.toLowerCase().includes(text.toLowerCase()) ||
        w.workoutSets.some(set => set.exercise?.name.toLowerCase().includes(text.toLowerCase()))
        );
        setFilteredWorkouts(filtered);
    } else {
        // If empty, show everything
        setFilteredWorkouts(workouts);
    }
    };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Workout History</Text>
      
      <TextInput 
        style={styles.searchBar} 
        placeholder="Search (e.g., Bench Press)" 
        value={searchText}
        onChangeText={handleSearch}
        />

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={filteredWorkouts}
          keyExtractor={(item) => item.workoutId.toString()}
          renderItem={renderWorkout}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No workouts logged yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#f5f5f5' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  cardHeader: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 10 },
  dateText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  setText: { fontSize: 15, color: '#444', marginBottom: 4 },
  notes: { fontStyle: 'italic', color: '#666', marginTop: 8, fontSize: 14 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 },
  searchBar: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd', fontSize: 16},
});