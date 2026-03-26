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

    const [aiAdvice, setAiAdvice] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

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

    const getLogsForDateRange = (startDate: Date, endDate: Date) => {
        return logs.filter(log => {
            const logTime = new Date(log.dateEaten).getTime();
            return logTime >= startDate.getTime() && logTime <= endDate.getTime();
        });
    };


    const weekStart = new Date(safeDate as string);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // const getWeeklyFoods = () => {
    //     if (!safeDate) return [];

    //     const weekStart = new Date(safeDate as string);
    //     const weekEnd = new Date(weekStart);
    //     weekEnd.setDate(weekStart.getDate() + 6);
    //     weekEnd.setHours(23, 59, 59, 999);

    //     return logs.filter(log => {
    //         const logTime = new Date(log.dateEaten).getTime();
    //         return logTime >= weekStart.getTime() && logTime <= weekEnd.getTime();
    //     });
    // };

    const weeklyFoods = getLogsForDateRange(weekStart, weekEnd);


    const getAiComparison = async () => {
        if (!safeDate) return;
        setAiLoading(true);
        setAiAdvice(null);

        const thisWeekCals = weeklyFoods.reduce((sum, log) => sum + log.calories, 0);
        const thisWeekProtein = weeklyFoods.reduce((sum, log) => sum + log.proteinGrams, 0);

        const lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(weekStart.getDate() - 7);
        const lastWeekEnd = new Date(weekEnd);
        lastWeekEnd.setDate(weekEnd.getDate() - 1);
        lastWeekEnd.setHours(23, 59, 59, 999);

        const lastWeekFoods = getLogsForDateRange(lastWeekStart, lastWeekEnd);
        const lastWeekCals = lastWeekFoods.reduce((sum, log) => sum + log.calories, 0);
        const lastWeekProtein = lastWeekFoods.reduce((sum, log) => sum + log.proteinGrams, 0);

        const prompt = `Act as an expert nutritionist. Compare the following two weeks of food logs and provide insights on how to improve the user's diet.
        Last week, my total intake was ${lastWeekCals} calories and ${lastWeekProtein} grams of protein.
        This week, my total intake was ${thisWeekCals} calories and ${thisWeekProtein} grams of protein.
        Please provide specific advice on how I can improve my diet based on these numbers.`;

        try {
            const response = await fetch('http://localhost:5226/api/AiComparison', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) {
                throw new Error('Failed to get AI comparison');
            }

            const data = await response.json();
            setAiAdvice(data.advice);
        } catch (error) {
            console.error('Error fetching AI comparison:', error);
            setAiAdvice('Sorry, I was unable to get advice at this time.');
        } finally {
            setAiLoading(false);
        }
    };










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

      <View style={styles.aiContainer}>
        <TouchableOpacity
            style={styles.aiButton}
            onPress={getAiComparison}
            disabled={aiLoading}
        >
            <Text style={styles.aiButtonText}>Compare with Last Week</Text>
        </TouchableOpacity>

        {aiLoading && <ActivityIndicator size="small" color="#8A2BE2" style={{ marginTop: 10 }} />}
        {aiAdvice && (
            <View style={styles.aiAdviceBox}>
                <Text style={styles.aiAdviceText}>{aiAdvice}</Text>
            </View>
        )}
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
  
  aiContainer: { marginBottom: 20, alignItems: 'center' },
  aiButton: { backgroundColor: '#8A2BE2', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, shadowColor: '#8A2BE2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
  aiButtonText: { color: '#fff',fontSize: 16, fontWeight: 'bold' },
  aiAdviceBox: { marginTop: 15, backgroundColor: '#f3e8ff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#d8b4fe', width: '100%' },
  aiAdviceText: { color: '#4c1d95', fontSize: 15, lineHeight: 22, fontStyle: 'italic', textAlign: 'center' },

  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: '#8A2BE2', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  foodName: { fontSize: 16, fontWeight: 'bold', color: '#222', flex: 1 },
  dateText: { fontSize: 12, color: '#888', marginLeft: 10 },
  macroContainer: { flexDirection: 'row', gap: 15 },
  macroText: { fontSize: 14, color: '#555', fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 50, fontStyle: 'italic', color: '#888' }
});

