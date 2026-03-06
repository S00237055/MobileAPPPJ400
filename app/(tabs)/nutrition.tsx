import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  Keyboard 
} from 'react-native';

export default function NutritionScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [nutritionData, setNutritionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNutritionData = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    Keyboard.dismiss();

    try {
      
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=10`
      );
      
      const data = await response.json();

      if (data.products && data.products.length > 0) {
        setNutritionData(data.products);
      } else {
        setNutritionData([]);
      }
    } catch (err) {
      setError('Failed to fetch nutrition data. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => {
   
    const energy = item.nutriments?.['energy-kcal_100g'] || 'N/A';
    const protein = item.nutriments?.proteins_100g || 'N/A';
    const carbs = item.nutriments?.carbohydrates_100g || 'N/A';
    const fat = item.nutriments?.fat_100g || 'N/A';

    return (
      <View style={styles.card}>
        <Text style={styles.foodName}>{item.product_name || 'Unknown Product'}</Text>
        <Text style={styles.brandText}>Brand: {item.brands || 'Unknown'}</Text>
        
        <View style={styles.macroContainer}>
          <Text style={styles.macroText}>🔥 Calories: {energy} kcal</Text>
          <Text style={styles.macroText}>🥩 Protein: {protein}g</Text>
          <Text style={styles.macroText}>🍞 Carbs: {carbs}g</Text>
          <Text style={styles.macroText}>🥑 Fat: {fat}g</Text>
        </View>

        
        {/* <Button title="Save to My Meals" onPress={() => saveToDatabase(item)} /> */}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrition Lookup</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search for a food item (e.g., Apple, Chicken)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={fetchNutritionData}
          placeholderTextColor="#888"
        />
        <Button title="Search" onPress={fetchNutritionData} />
      </View>

      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={nutritionData}
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          !loading && searchQuery ? (
            <Text style={styles.emptyText}>No results found. Try a different search.</Text>
          ) : null
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
  },
  brandText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  macroContainer: {
    marginTop: 8,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  macroText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 2,
  },
});