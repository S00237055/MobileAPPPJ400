import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  Modal, StyleSheet, Alert, ScrollView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Exercise {
  exerciseId: number;
  name: string;
  bodyPart: string;
  description?: string;
}

interface WorkoutSet {
  exerciseId: number;
  exerciseName: string;
  setNumber: number;
  weightKg: number;
  reps: number;
}

export default function WorkoutScreen() {
 
  const [userId, setUserId] = useState<number | null>(null);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);

  
  const [modalVisible, setModalVisible] = useState(false);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  // Timer
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const [exerciseSearch, setExerciseSearch] = useState('');

  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
  const API_URL = 'http://localhost:5226/api'; 
  const USER_ID = 3; 

  useEffect(() => {
    fetchExercises();
    loadUserId();
  }, []);

  useEffect(() => {
  let interval: any;
  if (isTimerRunning) {
    interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  }
  return () => clearInterval(interval); // Cleanup when stopped
}, [isTimerRunning]);


const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

  const loadUserId = async () => {
    const id = await AsyncStorage.getItem('userId');
    if (id) setUserId(parseInt(id));
  };

  const fetchExercises = async () => {
    try {
      const response = await fetch(`${API_URL}/Exercises`);
      const data = await response.json();
      setAvailableExercises(data);
    } catch (error) {
      Alert.alert('Error', 'Could not load exercises');
    }
  };

  const handleAddSet = () => {
    if (!selectedExercise || !weight || !reps) {
      Alert.alert('Missing Info', 'Please select an exercise and enter weight/reps');
      return;
    }

    const newSet: WorkoutSet = {
      exerciseId: selectedExercise.exerciseId, 
      exerciseName: selectedExercise.name, 
      setNumber: workoutSets.length + 1,
      weightKg: parseFloat(weight),
      reps: parseInt(reps),
    };

    setWorkoutSets([...workoutSets, newSet]);
    setWeight(''); 
    setReps('');
  };

  const handleFinishWorkout = async () => {
    
    if (!userId) {
        Alert.alert("Error", "You are not logged in!");
        return;
    }

    if (workoutSets.length === 0) return;

    
    const payload = {
      userId: userId,
      date: new Date().toISOString(),
      notes: "Logged from Mobile App",
      workoutSets: workoutSets.map(s => ({
        exerciseId: s.exerciseId,
        setNumber: s.setNumber,
        weightKg: s.weightKg,
        reps: s.reps
      }))
    };

    try {
      const response = await fetch(`${API_URL}/Workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        Alert.alert('Success', 'Workout Saved!');
        setWorkoutSets([]); 
        setSelectedExercise(null);
      } else {
        const err = await response.text();
        Alert.alert('Error', 'Failed to save: ' + err);
      }
    } catch (error: any) {
      Alert.alert('Network Error', error.message || 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Log Workout</Text>

        {/* REST TIMER */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(timer)}</Text>
        <View style={styles.timerControls}>
          <TouchableOpacity 
            style={[styles.timerBtn, isTimerRunning ? styles.stopBtn : styles.startBtn]} 
            onPress={() => setIsTimerRunning(!isTimerRunning)}
          >
            <Text style={styles.timerBtnText}>{isTimerRunning ? "Stop" : "Start"}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.timerBtn, styles.resetBtn]} 
            onPress={() => { setIsTimerRunning(false); setTimer(0); }}
          >
            <Text style={styles.timerBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Exercise Selector */}
      <TouchableOpacity 
        style={styles.selector} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectorText}>
          {selectedExercise ? selectedExercise.name : "Select Exercise (Tap Here)"}
        </Text>
      </TouchableOpacity>

      {/* Inputs */}
      <View style={styles.row}>
        <TextInput 
          style={[styles.input, { flex: 1 }]} 
          placeholder="Weight (kg)" 
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />
        <TextInput 
          style={[styles.input, { flex: 1 }]} 
          placeholder="Reps" 
          keyboardType="numeric"
          value={reps}
          onChangeText={setReps}
        />
      </View>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddSet}>
        <Text style={styles.btnText}>+ Add Set</Text>
      </TouchableOpacity>

      {/* Sets Added So Far */}
      <ScrollView style={styles.list}>
        {workoutSets.map((set, index) => (
          <View key={index} style={styles.setItem}>
            <Text style={styles.setText}>
              {set.exerciseName}: {set.weightKg}kg x {set.reps}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Save Button */}
      {workoutSets.length > 0 && (
        <TouchableOpacity style={styles.saveButton} onPress={handleFinishWorkout}>
          <Text style={styles.btnText}>Finish & Save Workout</Text>
        </TouchableOpacity>
      )}

      {/* Exercise Selection */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          
          
          {!viewingExercise ? (
            <>
              <Text style={styles.header}>Pick an Exercise</Text>
              
              {/* SEARCH BAR */}
              <TextInput 
                style={styles.input} 
                placeholder="Search exercises..." 
                value={exerciseSearch}
                onChangeText={setExerciseSearch}
              />

              <FlatList
                data={availableExercises.filter(ex => 
                  ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
                )}
                keyExtractor={(item) => item.exerciseId.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.modalItem}
                    
                    onPress={() => setViewingExercise(item)}
                  >
                    <Text style={styles.modalText}>{item.name}</Text>
                    <Text style={styles.subText}>{item.bodyPart} • Tap for Info</Text>
                  </TouchableOpacity>
                )}
              />
              
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnText}>Close</Text>
              </TouchableOpacity>
            </>
          ) : (
            
            
            <View style={styles.detailsContainer}>
              <Text style={styles.header}>{viewingExercise.name}</Text>
              <Text style={styles.subHeader}>Target: {viewingExercise.bodyPart}</Text>
              
              <View style={styles.instructionBox}>
                <Text style={styles.instructionTitle}>How to do it:</Text>
                <Text style={styles.instructionText}>
                  {viewingExercise.description || "No instructions available for this exercise yet."}
                </Text>
              </View>

              {/* ACTION BUTTONS */}
              <TouchableOpacity 
                style={styles.selectButton} 
                onPress={() => {
                  setSelectedExercise(viewingExercise); 
                  setViewingExercise(null);             
                  setModalVisible(false);               
                  setExerciseSearch('');
                }}
              >
                <Text style={styles.btnText}>Select This Exercise</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setViewingExercise(null)} 
              >
                <Text style={styles.backBtnText}>Back to List</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#f5f5f5' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  selector: { 
    backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15,
    borderWidth: 1, borderColor: '#ddd'
  },
  selectorText: { fontSize: 16, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  input: { 
    backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' 
  },
  addButton: { 
    backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 
  },
  saveButton: { 
    backgroundColor: '#34C759', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  list: { flex: 1 },
  setItem: { 
    backgroundColor: '#fff', padding: 15, marginBottom: 10, borderRadius: 8, 
    borderLeftWidth: 5, borderLeftColor: '#007AFF' 
  },
  setText: { fontSize: 16 },
  modalContainer: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#fff' }, // Added white background here
  
  
  modalItem: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },

  modalText: { fontSize: 18 },
  subText: { color: '#666' },
  closeButton: { 
    backgroundColor: '#FF3B30', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 
  },

  timerContainer: { 
    alignItems: 'center', marginBottom: 20, padding: 15, 
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#ddd' 
  },
  timerText: { fontSize: 32, fontWeight: 'bold', fontFamily: 'monospace', marginBottom: 10 },
  timerControls: { flexDirection: 'row', gap: 15 },
  timerBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  startBtn: { backgroundColor: '#34C759' }, // Green
  stopBtn: { backgroundColor: '#FF9500' },   // Orange
  resetBtn: { backgroundColor: '#8E8E93' },  // Grey
  timerBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  
  detailsContainer: { flex: 1 },
  subHeader: { fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 20 },
  instructionBox: { 
    backgroundColor: '#f9f9f9', padding: 20, borderRadius: 10, marginVertical: 10,
    borderWidth: 1, borderColor: '#eee'
  },
  instructionTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 10 },
  instructionText: { fontSize: 16, lineHeight: 24, color: '#333' },
  selectButton: { 
    backgroundColor: '#007AFF', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 30 
  },
  backButton: { 
    padding: 15, alignItems: 'center', marginTop: 10 
  },
  backBtnText: { color: '#007AFF', fontSize: 16 },
});