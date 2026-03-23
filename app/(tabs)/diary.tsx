import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { router } from 'expo-router';

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
  
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  
  //AI Advice State
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  
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
    
    // Start of the current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return logs.filter((log) => {
      const logTime = new Date(log.dateEaten).getTime();
      
      if (selectedPeriod === 'Daily') return logTime >= startOfToday;
      
      if (selectedPeriod === 'Monthly') return logTime >= startOfMonth;
      
      return true;
    });
  };

  const filteredLogs = getFilteredLogs();

  const getWeeklyComparisons = () => {
    const weeklyData: Record<string, { weekStart: string, calories: number, protein: number }> = {};
      
    logs.forEach(log => {
      const date = new Date(log.dateEaten);
      const day = date.getDay() || 7;
      date.setHours(-24 * (day -1), 0, 0, 0);
      const weekStart = date.toLocaleDateString();

      if (!weeklyData[weekStart]) {
        weeklyData[weekStart] = { weekStart, calories: 0, protein: 0 };
      }
      weeklyData[weekStart].calories += log.calories;
      weeklyData[weekStart].protein += log.proteinGrams;
    });

    return Object.values(weeklyData).sort((a, b) => 
      new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    );
  };

    const weeklyComparisons = getWeeklyComparisons();
  

  
    const screenWidth = Dimensions.get("window").width; // Account for padding
    const chartData = {
    labels: [...weeklyComparisons].reverse().map(w => {
      
      const parts = w.weekStart.split('/');
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : w.weekStart;
    }),
    datasets: [
      {
        data: [...weeklyComparisons].reverse().map(w => w.calories)
      }
    ]
  };

  //SUMMARY
  const totalCalories = filteredLogs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = filteredLogs.reduce((sum, log) => sum + log.proteinGrams, 0);

  const getAiDietAdvice = async () => {
    if (filteredLogs.length === 0) {
      Alert.alert("No Food", "Log some food first so the AI has something to analyze!");
      return;
    }

    

    setAiLoading(true);
    setAiAdvice(null);

   
    const foodList = filteredLogs.map(log => log.foodName).join(', ');
    
    
    const prompt = `I am tracking my nutrition. Today I ate: ${foodList}. My total intake is ${totalCalories} calories and ${totalProtein}g of protein. In 2 short sentences, tell me how I can improve this diet for better health and muscle growth.`;

    try {
    
      
      const response = await fetch('http://localhost:5226/api/Ai/DietAdvice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("BACKEND ERROR:", errorText); 
        throw new Error(errorText);
      }

     
      const data = await response.json();
      
      
      setAiAdvice(data.advice);

    } catch (error: any) {
      Alert.alert("AI Error", error.message || "Could not get advice right now.");
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

  const renderComparisonCard = ({ item }: { item: { weekStart: string, calories: number, protein: number } }) => (
    
    

  
    <TouchableOpacity 
      style={[styles.card, { borderLeftColor: '#8A2BE2' }]}
      
      onPress={() => router.push({ pathname: '/week-details', params: { date: item.weekStart } })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.foodName}>Week of {item.weekStart}</Text>
        <Text>▶️</Text>
      </View>
      <View style={styles.macroContainer}>
        <Text style={styles.macroText}>🔥 Total: {item.calories} kcal</Text>
        <Text style={styles.macroText}>🥩 Total: {item.protein.toFixed(1)}g Protein</Text>
      </View>
    </TouchableOpacity>
  );

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
            onPress={() => {
              setSelectedPeriod(period);
            setExpandedWeek(null);
            }}
          >
            <Text style={[styles.toggleText, selectedPeriod === period && styles.toggleTextActive]}>
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      

      {/* NUTRITION SUMMARY DASHBOARD */}
      {selectedPeriod !== 'Weekly' && (
        <>
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

      <View style={styles.aiContainer}>
        <TouchableOpacity 
          style={styles.aiButton} 
          onPress={getAiDietAdvice}
          disabled={aiLoading}
        >
          <Text style={styles.aiButtonText}>✨ Get AI Diet Advice ✨</Text>
        </TouchableOpacity>

        {aiLoading && <ActivityIndicator size="small" color="#8A2BE2" style={{ marginTop: 10 }} />}
        
        {aiAdvice && (
          <View style={styles.aiAdviceBox}>
            <Text style={styles.aiAdviceText}>{aiAdvice}</Text>
          </View>
        )}
      </View>
      </>
    )}
      
      

      {loading ? (
        <ActivityIndicator size="large" color="#FF9500" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : selectedPeriod === 'Weekly' ? (
        <View style={{ flex: 1 }}>
          <FlatList
            data={weeklyComparisons}
            keyExtractor={(item, index) => index.toString()}
            ListHeaderComponent={
              
              weeklyComparisons.length > 0 ? (
                <View style={{ alignItems: 'center', marginBottom: 20, backgroundColor: '#fff', borderRadius: 12, padding: 10 }}>
                  <Text style={styles.summaryTitle}>Weekly Calorie Trend</Text>
                  <BarChart
                    data={chartData}
                    width={screenWidth - 52} 
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    fromZero={true}
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(138, 43, 226, ${opacity})`, 
                      labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                    }}
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                  />
                </View>
              ) : <></>
            }
            renderItem={renderComparisonCard}
            ListEmptyComponent={<Text style={styles.emptyText}>No comparison data available.</Text>}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false} 
          />
        </View> 
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

  aiContainer: { marginBottom: 20, alignItems: 'center' },
  aiButton: { backgroundColor: '#8A2BE2', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  aiButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  aiAdviceBox: { marginTop: 15, backgroundColor: '#f0e6ff', padding: 15, borderRadius: 10, maxWidth: '100%' },
  aiAdviceText: { color: '#5a189a', fontSize: 14, fontStyle: 'italic', textAlign: 'center' },

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


  dropdownBox: { backgroundColor: '#f9f9f9', padding: 12, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 1, borderColor: '#eee', borderTopWidth: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  dropdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomColor: '#ddd' },
  dropdownFoodName: { flex: 1, color: '#333', fontWeight: '500' },
  dropdownMacros: { color: '#666', fontSize: 13 }
});