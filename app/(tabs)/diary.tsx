import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button } from 'react-native';

interface SavedFoodLog {
  logId: number;
  foodName: string;
  calories: number;
  proteinGrams: number;
  dateEaten: string;
}

export default function DiaryScreen() {
  const [logs, setLogs] = useState<SavedFoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      
      const response = await fetch('http://localhost:5226/api/FoodLogs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError('Could not connect to database to fetch history.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const renderLog = ({ item }: { item: SavedFoodLog }) => {
    const dateEaten = new Date(item.dateEaten).toLocaleDateString();
    const timeEaten = new Date(item.dateEaten).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.foodName}>{item.foodName}</Text>
          <Text style={styles.dateText}>{dateEaten} at {timeEaten}</Text>
        </View>
        <View style={styles.macroContainer}>
          <Text style={styles.macroText}>🔥 {item.calories} kcal</Text>
          <Text style={styles.macroText}>🥩 {item.proteinGrams}g Protein</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Food Diary</Text>
        <Button title="Refresh" onPress={fetchHistory} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.logId.toString()}
          renderItem={renderLog}
          ListEmptyComponent={<Text style={styles.emptyText}>Your diary is empty. Start logging food!</Text>}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16, backgroundColor: '#fff' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  loader: { marginTop: 50 },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, fontStyle: 'italic', color: '#666', fontSize: 16 },
  listContainer: { paddingBottom: 20 },
  card: { backgroundColor: '#f8f9fa', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: '#28a745', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  foodName: { fontSize: 18, fontWeight: 'bold', color: '#222', flex: 1 },
  dateText: { fontSize: 12, color: '#888', marginLeft: 10 },
  macroContainer: { flexDirection: 'row', gap: 15 },
  macroText: { fontSize: 15, color: '#444', fontWeight: '500' },
});