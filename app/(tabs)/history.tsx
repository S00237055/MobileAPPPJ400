import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';

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

const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [activeChart, setActiveChart] = useState<'Volume' | 'Reps'>('Volume');

  const API_URL = 'https://my-fitness-api-123-f5gcbyb0bzaggwdm.italynorth-01.azurewebsites.net/api'; 

  const screenWidth = Dimensions.get("window").width;

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

  const getAiWorkoutAdvice = async () => {
    if (filteredWorkouts.length === 0) {
      Alert.alert("No Workouts", "Log some workouts first so the AI can analyze your progress!");
      return;
    }

    setAiLoading(true);
    setAiAdvice(null);

    // Grab the 5 most recent workouts so the prompt isn't too massive
    const recentWorkouts = filteredWorkouts.slice(0, 5);
    
    // Format them into a text string for the AI to read
    let workoutSummary = recentWorkouts.map(w => {
        let setsStr = w.workoutSets.map(s => `${s.exercise?.name || 'Unknown'}: ${s.weightKg}kg x ${s.reps}`).join(', ');
        return `Date: ${new Date(w.date).toLocaleDateString()}. Exercises: ${setsStr}. Notes: ${w.notes || 'None'}`;
    }).join('\n');

    const prompt = `I am tracking my gym workouts. Here are my most recent sessions:\n${workoutSummary}\nAct as an expert personal trainer. In 2 or 3 short sentences, analyze my routine and give me a specific tip to improve my strength, form, or workout split.`;

    try {
      const response = await fetch(`${API_URL}/Ai/WorkoutAdvice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      setAiAdvice(data.advice);

    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes("503")) {
         Alert.alert("AI Trainer Busy", "The AI trainer is currently helping too many people! Please wait a minute and try again.");
      } else {
         Alert.alert("AI Error", "Could not connect to the AI service right now.");
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text) {
        const filtered = workouts.filter(w => 
        
        w.notes?.toLowerCase().includes(text.toLowerCase()) ||
        w.workoutSets.some(set => set.exercise?.name.toLowerCase().includes(text.toLowerCase()))
        );
        setFilteredWorkouts(filtered);
    } else {
        
        setFilteredWorkouts(workouts);
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

  const renderListHeader = () => {
    
    const recentWorkouts = [...filteredWorkouts].slice(0, 7).reverse();

    if (recentWorkouts.length === 0) return null;

    
    const chartLabels = recentWorkouts.map(w => {
      const d = new Date(w.date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });

    
    const volumeData = recentWorkouts.map(w => 
      w.workoutSets.reduce((sum, set) => sum + (set.weightKg * set.reps), 0)
    );

    
    const repsData = recentWorkouts.map(w => 
      w.workoutSets.reduce((sum, set) => sum + set.reps, 0)
    );

    const dataToDisplay = activeChart === 'Volume' ? volumeData : repsData;
    const chartColor = activeChart === 'Volume' ? '#007AFF' : '#FF9500';

  
   

  return (
      <View style={styles.headerContainer}>
        
        <View style={styles.aiContainer}>
          <TouchableOpacity 
            style={styles.aiButton} 
            onPress={getAiWorkoutAdvice}
            disabled={aiLoading}
          >
            <Text style={styles.aiButtonText}>✨ Get AI Trainer Advice ✨</Text>
          </TouchableOpacity>
          {aiLoading && <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 10 }} />}
          
          {aiAdvice && (
            <View style={styles.aiAdviceBox}>
              <Text style={styles.aiAdviceText}>{aiAdvice}</Text>
            </View>
          )}
        </View>

        
        <View style={styles.chartWrapper}>
          <Text style={styles.chartTitle}>Recent Workout {activeChart}</Text>
          <BarChart
            data={{
              labels: chartLabels.length > 0 ? chartLabels : ['No Data'],
              datasets: [{ data: dataToDisplay.length > 0 ? dataToDisplay : [0] }]
            }}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero={true}
            showBarTops={false}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => activeChart === 'Volume' ? `rgba(0, 122, 255, ${opacity})` : `rgba(255, 149, 0, ${opacity})`,
              fillShadowGradientOpacity: 1, 
              labelColor: () => `rgba(50, 50, 50, 1)`,
              style: { borderRadius: 12 },
              barPercentage: 0.6,
            }}
            style={{ marginVertical: 8, borderRadius: 12 }}
          />

          
          <View style={styles.toggleGroup}>
            <TouchableOpacity 
              style={[styles.toggleBtn, activeChart === 'Volume' && { backgroundColor: '#007AFF' }]}
              onPress={() => setActiveChart('Volume')}
            >
              <Text style={[styles.toggleBtnText, activeChart === 'Volume' && styles.toggleBtnTextActive]}>
                Volume
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toggleBtn, activeChart === 'Reps' && { backgroundColor: '#FF9500' }]}
              onPress={() => setActiveChart('Reps')}
            >
              <Text style={[styles.toggleBtnText, activeChart === 'Reps' && styles.toggleBtnTextActive]}>
                Reps
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
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
          ListHeaderComponent={renderListHeader()}
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


  headerContainer: { marginBottom: 10 },

  aiContainer: { marginBottom: 20, alignItems: 'center' },
  aiButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
  aiButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  aiAdviceBox: { marginTop: 15, backgroundColor: '#e6f2ff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#b3d9ff', width: '100%' },
  aiAdviceText: { color: '#004080', fontSize: 15, lineHeight: 22, fontStyle: 'italic', textAlign: 'center' },


  chartWrapper: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#333' },

  toggleGroup: { flexDirection: 'row', marginTop: 15, width: '100%', justifyContent: 'space-evenly' },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 25, borderRadius: 20, backgroundColor: '#e0e0e0' },
  toggleBtnText: { fontWeight: 'bold', color: '#555' },
  toggleBtnTextActive: { color: '#fff' },

  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  cardHeader: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 10 },
  dateText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  setText: { fontSize: 15, color: '#444', marginBottom: 4 },
  notes: { fontStyle: 'italic', color: '#666', marginTop: 8, fontSize: 14 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 },
  searchBar: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd', fontSize: 16},
});