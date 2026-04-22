import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface FoodItem {
  id: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

export default function NutritionScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [nutritionData, setNutritionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);

  const fetchNutritionData = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    Keyboard.dismiss();

    try {
      
      const requestHeaders: any = {};

      
      if (Platform.OS !== 'web') {
        requestHeaders['User-Agent'] = 'MyFitnessApp - Android/iOS - Version 1.0';
        requestHeaders['Accept'] = 'application/json';
      }

      const fetchOptions = Object.keys(requestHeaders).length > 0 
        ? { headers: requestHeaders } 
        : undefined;

      const targetUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=30&fields=id,product_name,product_name_en,brands,nutriments&lc=en`;
      
      // const response = await fetch(
      //   `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=30&fields=id,product_name,product_name_en,brands,nutriments&lc=en`,
        
      //   fetchOptions
      // );

      const fetchUrl = Platform.OS === 'web' 
  ? `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}` 
  : targetUrl;
        
      const response = await fetch(fetchUrl, fetchOptions);
      if (!response.ok){
        throw new Error(`Server Error: ${response.status}`);
      }

      
      const data = await response.json();

      if (data.products && data.products.length > 0) {
        setNutritionData(data.products);
      } else {
        setNutritionData([]);
      }
    } catch (err: any) {
      console.error("Search API Error:", err.message);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchBarcodeData = async (barcode: string) => {
    setLoading(true);
    setError(null);
    try {
      // Open Food Facts has a specific URL just for barcodes!
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const product = data.product;
        if (!product.id) product.id = barcode; // Ensure flatlist key works
        setNutritionData([product]);
      } else {
        setNutritionData([]);
        setError('Barcode not found in the food database.');
      }
    } catch (err) {
      setError('Failed to fetch barcode data.');
    } finally {
      setLoading(false);
    }
  };

  // --- CAMERA LOGIC ---
  const startScan = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Camera access is required to scan barcodes.');
        return;
      }
    }
    setIsScanning(true);
  };

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    setIsScanning(false); // Close camera
    setSearchQuery(data); // Put the barcode numbers in the text box
    fetchBarcodeData(data); // Instantly search for the food
  };

  const saveToDatabase = async (item: any) => {
    
    const foodName = item.product_name_en || item.product_name || 'Unknown Product';
    const calories = parseInt(item.nutriments?.['energy-kcal_100g']) || 0;
    const protein = parseFloat(item.nutriments?.proteins_100g) || 0;

    
    const payload = {
      userId: 1, // Change this to the ID of the logged-in user!
      foodName: foodName,
      calories: calories,
      proteinGrams: protein
    };

    try {
      
      const response = await fetch('http://192.168.56.1/api/FoodLogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert('Success!', `${foodName} has been saved to your diary.`);
      } else {
        Alert.alert('Error', 'Failed to save food to database.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Network Error', 'Could not connect to the Fitness API.');
    }
  };

  if (isScanning) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"], // Standard food barcode types
          }}
          onBarcodeScanned={handleBarCodeScanned}
        />
        <View style={styles.cameraOverlay}>
            <Text style={styles.cameraText}>Point camera at a food barcode</Text>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsScanning(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: any) => {
   
    const energy = item.nutriments?.['energy-kcal_100g'] || 'N/A';
    const protein = item.nutriments?.proteins_100g || 'N/A';
    const carbs = item.nutriments?.carbohydrates_100g || 'N/A';
    const fat = item.nutriments?.fat_100g || 'N/A';

    return (
      <View style={styles.card}>
        <Text style={styles.foodName}>{item.product_name_en || item.product_name || 'Unknown Product'}</Text>
        <Text style={styles.brandText}>Brand: {item.brands || 'Unknown'}</Text>
        
        <View style={styles.macroContainer}>
          <Text style={styles.macroText}>🔥 Calories: {energy} kcal</Text>
          <Text style={styles.macroText}>🥩 Protein: {protein}g</Text>
          <Text style={styles.macroText}>🍞 Carbs: {carbs}g</Text>
          <Text style={styles.macroText}>🥑 Fat: {fat}g</Text>
        </View>

        
        <View style={{ marginTop: 12 }}>
          <Button title="Save to Diary" color="#28a745" onPress={() => saveToDatabase(item)} />
        </View>
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
        <TouchableOpacity style={styles.iconButton} onPress={startScan}>
          <Text style={{ fontSize: 24 }}>📷</Text>
        </TouchableOpacity>
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
  iconButton: { 
    paddingHorizontal: 10, 
    marginRight: 5, 
    justifyContent: 'center' 
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
  cameraContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'black' },
  cameraOverlay: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
  cameraText: { color: 'white', fontSize: 18, marginBottom: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, overflow: 'hidden' },
  cancelButton: { backgroundColor: '#ff3b30', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  cancelButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});