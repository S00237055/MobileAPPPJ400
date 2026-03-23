import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

interface SavedFoodLog {
    logId: number;
    foodName: string;
    calories: number;
    proteinGrams: number;
    dateEaten: string;  
}

export default function WeekDetailsScreen() {
    const { safeDate, displayDate } = useLocalSearchParams();
    const [logs, setLogs] = useState<SavedFoodLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(`http://localhost:5226/api/FoodLogs`);
                const data = await response.json();
                setLogs(data);
            } catch (error) {
                console.error('Error fetching food logs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const getWeeklyFoods = () => {
        if (!safeDate) return [];

        const weekStart = new Date(safeDate as string);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return logs.filter(log => {
            const logTime = new Date(log.dateEaten).getTime();
            return logTime >= weekStart.getTime() && logTime <= weekEnd.getTime();
        });
    };

    const weeklyFoods = getWeeklyFoods();

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
      {/* Custom Back Button Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>⬅ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Week of {displayDate}</Text>
        <View style={{ width: 60 }} /> {/* Empty view to center the title */}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8A2BE2" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={weeklyFoods}
          keyExtractor={(item) => item.logId.toString()}
          renderItem={renderLog}
          ListEmptyComponent={<Text style={styles.emptyText}>No data for this week.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { padding: 10, backgroundColor: '#e0e0e0', borderRadius: 8 },
  backText: { fontWeight: 'bold', color: '#333' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: '#8A2BE2', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  foodName: { fontSize: 16, fontWeight: 'bold', color: '#222', flex: 1 },
  dateText: { fontSize: 12, color: '#888', marginLeft: 10 },
  macroContainer: { flexDirection: 'row', gap: 15 },
  macroText: { fontSize: 14, color: '#555', fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 50, fontStyle: 'italic', color: '#888' }
});

