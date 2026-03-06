import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';

interface SavedFoodLog {
  logId: number;
  foodName: string;
  calories: number;
  proteinGrams: number;
  dateEaten: string;
}

type Period = 'Daily' | 'Weekly' | 'Monthly';

export default function DiaryScreen() {
  const [logs, setLogs] = useState<SavedFoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Daily');

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

  //Filtering
  const getFilteredLogs = () => {
    const now = new Date();
    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    // Start of the week
    const startOfWeek = startOfToday - (6 * 24 * 60 * 60 * 1000);
    // Start of the current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return logs.filter((log) => {
      const logTime = new Date(log.dateEaten).getTime();
      
      if (selectedPeriod === 'Daily') return logTime >= startOfToday;
      if (selectedPeriod === 'Weekly') return logTime >= startOfWeek;
      if (selectedPeriod === 'Monthly') return logTime >= startOfMonth;
      
      return true;
    });
  };

  const filteredLogs = getFilteredLogs();

  //SUMMARY
  const totalCalories = filteredLogs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = filteredLogs.reduce((sum, log) => sum + log.proteinGrams, 0);

  const renderLog = ({ item }: { item: SavedFoodLog }) => {
    const dateEaten = new Date(item.dateEaten).toLocaleDateString();
    const timeEaten = new Date(item.dateEaten).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.foodName}>{item.foodName}</Text>
          <Text style={styles.dateText}>{dateEaten} {timeEaten}</Text>
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
        <TouchableOpacity style={styles.refreshButton} onPress={fetchHistory}>
          <Text style={styles.refreshText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      {/*PERIOD BUTTONS*/}
      <View style={styles.toggleContainer}>
        {(['Daily', 'Weekly', 'Monthly'] as Period[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.toggleButton, selectedPeriod === period && styles.toggleButtonActive]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[styles.toggleText, selectedPeriod === period && styles.toggleTextActive]}>
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* NUTRITION SUMMARY DASHBOARD */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>{selectedPeriod} Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Calories</Text>
            <Text style={styles.summaryValue}>{totalCalories} <Text style={styles.summaryUnit}>kcal</Text></Text>
          </View>
          <View style={[styles.summaryBox, { borderLeftWidth: 1, borderColor: '#eee' }]}>
            <Text style={styles.summaryLabel}>Protein</Text>
            <Text style={styles.summaryValue}>{totalProtein.toFixed(1)} <Text style={styles.summaryUnit}>g</Text></Text>
          </View>
        </View>
      </View>

      
      {loading ? (
        <ActivityIndicator size="large" color="#FF9500" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.logId.toString()}
          renderItem={renderLog}
          ListEmptyComponent={<Text style={styles.emptyText}>No food logged for this period.</Text>}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16, backgroundColor: '#f5f5f5' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  refreshButton: { backgroundColor: '#e0e0e0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  refreshText: { color: '#333', fontWeight: '600' },
  
  toggleContainer: { flexDirection: 'row', backgroundColor: '#e9ecef', borderRadius: 8, padding: 4, marginBottom: 20 },
  toggleButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  toggleButtonActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '500', color: '#666' },
  toggleTextActive: { color: '#FF9500', fontWeight: 'bold' },

  summaryContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryBox: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  summaryUnit: { fontSize: 14, fontWeight: 'normal', color: '#666' },

  loader: { marginTop: 50 },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, fontStyle: 'italic', color: '#888', fontSize: 16 },
  listContainer: { paddingBottom: 20 },
  
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: '#FF9500', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  foodName: { fontSize: 16, fontWeight: 'bold', color: '#222', flex: 1 },
  dateText: { fontSize: 12, color: '#888', marginLeft: 10 },
  macroContainer: { flexDirection: 'row', gap: 15 },
  macroText: { fontSize: 14, color: '#555', fontWeight: '500' },
});