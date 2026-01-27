import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  Modal, StyleSheet, Alert, ScrollView 
} from 'react-native';

export default function WorkoutScreen() {
  // Data from Server
  const [availableExercises, setAvailableExercises] = useState([]);
  
  // Data Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [workoutSets, setWorkoutSets] = useState([]); // Stores sets before saving

  // API Configuration
  const API_URL = 'http://192.168.1.166:5226/api'; 
  const USER_ID = 1; // Hardcoded for demo; replace with auth context in real app

  // Load Exercises at the Start
  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const response = await fetch(`${API_URL}/Exercises`);
      const data = await response.json();
      setAvailableExercises(data);
    } catch (error) {
      Alert.alert('Error', 'Could not load exercises');
    }
  };

  // add a Set to the List
  const handleAddSet = () => {
    if (!selectedExercise || !weight || !reps) {
      Alert.alert('Missing Info', 'Please select an exercise and enter weight/reps');
      return;
    }

    const newSet = {
      // Exercise ID from the database
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

  // Workout is saved to Database
  const handleFinishWorkout = async () => {
    if (workoutSets.length === 0) return;

    const payload = {
      userId: USER_ID,
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
        setWorkoutSets([]); // Clear the sets
        setSelectedExercise(null);
      } else {
        const err = await response.text();
        Alert.alert('Error', 'Failed to save: ' + err);
      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Log Workout</Text>

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

      {/* List of Sets Added So Far */}
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

      {/* Exercise Selection Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.header}>Pick an Exercise</Text>
          <FlatList
            data={availableExercises}
            keyExtractor={(item) => item.exerciseId.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.modalItem}
                onPress={() => {
                  setSelectedExercise(item);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalText}>{item.name}</Text>
                <Text style={styles.subText}>{item.bodyPart}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.btnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#f5f5f5' 
  },
  header: { 
    fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' 
  },
  selector: { 
    backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15,
    borderWidth: 1, borderColor: '#ddd'
  },
  selectorText: { 
    fontSize: 16, textAlign: 'center' 
  },
  row: { 
    flexDirection: 'row', gap: 10, marginBottom: 15 
  },
  input: { 
    backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' 
  },
  addButton: { 
    backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 
  },
  saveButton: { 
    backgroundColor: '#34C759', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 
  },
  btnText: { 
    color: '#fff', fontWeight: 'bold', fontSize: 16 
  },
  list: { 
    flex: 1 
  },
  setItem: { 
    backgroundColor: '#fff', padding: 15, marginBottom: 10, borderRadius: 8, 
    borderLeftWidth: 5, borderLeftColor: '#007AFF' 
  },
  setText: { 
    fontSize: 16 
  },
  modalContainer: { 
    flex: 1, padding: 20, paddingTop: 50 
  },
  modalItem: { 
    padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' 
  },
  modalText: { 
    fontSize: 18 
  },
  subText: { 
    color: '#666' 
  },
  closeButton: { 
    backgroundColor: '#FF3B30', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 
  }
});