import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { apiPost } from '../../lib/api';
import { getUserId } from '../../lib/auth';
import { fetchWithRetry, getSafetyStatus, resolveProductName } from '../../lib/metrics';

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

  const [currentUserId, setCurrentUserId] = useState(1);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedId = await getUserId();
        if (storedId !== null) {
          setCurrentUserId(storedId); // Updates with the REAL logged-in user
        }
      } catch (error) {
        console.error('Error reading user ID from storage', error);
      }
    };
    fetchUserId();
  }, []);

  const EXAMPLE_FOODS = [
  {
    id: 'example-1',
    product_name_en: 'Apple (Raw)',
    brands: 'Generic',
    nutriments: {
      'energy-kcal_100g': 52,
      proteins_100g: 0.3,
      carbohydrates_100g: 14,
      fat_100g: 0.2,
    }
  },
  {
    id: 'example-2',
    product_name_en: 'Grilled Chicken Breast',
    brands: 'Generic',
    nutriments: {
      'energy-kcal_100g': 165,
      proteins_100g: 31,
      carbohydrates_100g: 0,
      fat_100g: 3.6,
    }
  },
  {
    id: 'example-3',
    product_name_en: 'Rolled Oats',
    brands: 'Quaker',
    nutriments: {
      'energy-kcal_100g': 389,
      proteins_100g: 16.9,
      carbohydrates_100g: 66.3,
      fat_100g: 6.9,
    }
  }
];

  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [foodInfo, setFoodInfo] = useState<any>(null);


  const [searchQuery, setSearchQuery] = useState('');
  const [nutritionData, setNutritionData] = useState<any[]>(EXAMPLE_FOODS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  



  const fetchNutritionData = async () => {
    if (!searchQuery.trim()) {
      setNutritionData(EXAMPLE_FOODS);
    
      return;
    }

    setLoading(true);
    setError(null);
    Keyboard.dismiss();

    try {
      
      const requestHeaders: any = {};

      
      if (Platform.OS !== 'web') {
        requestHeaders['User-Agent'] = 'MyFitnessApp/1.0 (kianreynolds234@gmail.com)';
        requestHeaders['Accept'] = 'application/json';
      }

      const fetchOptions = Object.keys(requestHeaders).length > 0 
        ? { headers: requestHeaders } 
        : undefined;

      const targetUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=30&fields=id,product_name,product_name_en,brands,nutriments,image_url,image_front_small_url&lc=en`;
      
      

      const fetchUrl = Platform.OS === 'web' 
  ? `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}` 
  : targetUrl;
        
      // const response = await fetch(fetchUrl, fetchOptions);
      // if (!response.ok){
      //   throw new Error(`Server Error: ${response.status}`);
      // }

      
      const data = await fetchWithRetry(fetchUrl, fetchOptions, 3, 1000);

      if (data.products && data.products.length > 0) {
        setNutritionData(data.products);
      } else {
        setNutritionData([]);
      }
    } catch (err: any) {
      console.error("Search API Error:", err.message);
      if (err.message.includes('503') || err.message.includes('502') || err.message.includes('504')) {
         setError("The food database is currently very busy. Please wait a minute and try again!");
      } else {
         setError(`Error: Could not connect to the food database.`);
      }
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

  

  

  const saveToDatabase = async (item: any) => {
    
    const foodName = resolveProductName(item);
    const calories = parseInt(item.nutriments?.['energy-kcal_100g']) || 0;
    const protein = parseFloat(item.nutriments?.proteins_100g) || 0;
    const carbs = parseFloat(item.nutriments?.carbohydrates_100g) || 0;
    const fat = parseFloat(item.nutriments?.fat_100g) || 0;
    
    const payload = {
      // The server takes the owner from the token and ignores this value.
      userId: currentUserId,
      foodName: foodName,
      calories: calories,
      proteinGrams: protein,
      carbsGrams: carbs,
      fatGrams: fat
    };

    try {
      await apiPost('/FoodLogs', payload);
      Alert.alert('Success!', `${foodName} has been saved to your diary.`);
    } catch (error: any) {
      console.error(error);
      if (error?.status) {
        Alert.alert('Error', 'Failed to save food to database.');
      } else {
        Alert.alert('Network Error', 'Could not connect to the Fitness API.');
      }
    }
  };

  

const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
  setScanned(true);
  setLoading(true);

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${data}.json`);
    const json = await response.json();

    if (json.status === 1) {
      setFoodInfo(json.product);
    } else {
      Alert.alert("Not Found", "We couldn't find this product in our database.");
      setFoodInfo(null);
    }
  } catch (error) {
    Alert.alert("Error", "Could not connect to the food database.");
  } finally {
    setLoading(false);
  }
};

const handleSearchChange = (text: string) => {
  setSearchQuery(text);
  
  if (text.trim() === '') {
    setNutritionData(EXAMPLE_FOODS);
    setError(null);
  }
}
const openScanner = () => {
  if (!permission?.granted) {
    requestPermission();
  }
  setIsScannerVisible(true);
};

  const renderItem = ({ item }: any) => {
   
    const energy = item.nutriments?.['energy-kcal_100g'] || 'N/A';
    const protein = item.nutriments?.proteins_100g || 'N/A';
    const carbs = item.nutriments?.carbohydrates_100g || 'N/A';
    const fat = item.nutriments?.fat_100g || 'N/A';

    const imageUrl = item.image_url || item.image_front_small_url || item.image_front_thumb_url;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.listImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={{ fontSize: 24 }}>🍽️</Text>
            </View>
          )}
        
          <View style={styles.cardInfo}>
            <Text style={styles.foodName}>{item.product_name_en || item.product_name || 'Unknown Product'}</Text>
            <Text style={styles.brandText}>Brand: {item.brands || 'Unknown'}</Text>
          </View>
        </View>

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
          onChangeText={handleSearchChange}
          onSubmitEditing={fetchNutritionData}
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.iconButton} onPress={openScanner}>
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
    
      
      


      
      <Modal visible={isScannerVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          
         
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => { setIsScannerVisible(false); setFoodInfo(null); setScanned(false); }}
          >
            <Text style={styles.closeButtonText}>Close ✖</Text>
          </TouchableOpacity>

          
          {foodInfo ? (
            <View style={styles.resultContainer}>
              {foodInfo.image_url && <Image source={{ uri: foodInfo.image_url }} style={styles.productImage} />}
              <Text style={styles.productName}>{foodInfo.product_name || "Unknown Product"}</Text>
              
              <View style={[styles.badge, { backgroundColor: getSafetyStatus(foodInfo.nova_group).color }]}>
                <Text style={styles.badgeText}>{getSafetyStatus(foodInfo.nova_group).label}</Text>
              </View>

              <View style={styles.statsContainer}>
                <Text style={styles.statText}>🔥 Calories: {parseInt(foodInfo.nutriments?.['energy-kcal_100g']) || 0} kcal</Text>
                <Text style={styles.statText}>🥩 Protein: {parseFloat(foodInfo.nutriments?.proteins_100g) || 0}g</Text>
                <Text style={styles.statText}>🧪 Additives: {foodInfo.additives_n || 0}</Text>
                <Text style={styles.statText}>📊 Nutri-Score: {foodInfo.nutriscore_grade?.toUpperCase() || "N/A"}</Text>

              </View>

              <TouchableOpacity 
                style={[styles.scanAgainButton, { backgroundColor: '#28a745', marginBottom: 15 }]} 
                onPress={() => saveToDatabase(foodInfo)}
              >
                <Text style={styles.scanAgainText}>💾 Save to Diary</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.scanAgainButton} onPress={() => { setFoodInfo(null); setScanned(false); }}>
                <Text style={styles.scanAgainText}>Scan Another</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraWrapper}>
              {permission?.granted ? (
                <CameraView 
                  style={styles.camera} 
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
                >
                  <View style={styles.overlay}>
                    <View style={styles.scanTarget} />
                    <Text style={styles.scanInstructions}>Point camera at a barcode</Text>
                  </View>
                </CameraView>
              ) : (
                <Text style={{textAlign: 'center', marginTop: 50}}>Need camera permission.</Text>
              )}
              
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.loadingText}>Analyzing...</Text>
                </View>
              )}
            </View>
          )}

        </View>
      </Modal>

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


  openScannerButton: { backgroundColor: '#8A2BE2', padding: 15, borderRadius: 10, alignItems: 'center', marginVertical: 10 },
  openScannerText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  modalContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  closeButton: { padding: 20, paddingTop: 50, backgroundColor: '#eee', alignItems: 'flex-end' },
  closeButtonText: { fontSize: 16, color: '#333', fontWeight: 'bold' },
  
  cameraWrapper: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  scanTarget: { width: 250, height: 150, borderWidth: 2, borderColor: '#007AFF', borderRadius: 10, marginBottom: 20 },
  scanInstructions: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white', marginTop: 10, fontSize: 16, fontWeight: 'bold' },
  
  resultContainer: { flex: 1, alignItems: 'center', padding: 20 },
  productImage: { width: 150, height: 150, resizeMode: 'contain', borderRadius: 10, marginBottom: 20 },
  productName: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  badge: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, marginBottom: 20 },
  badgeText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  statsContainer: { backgroundColor: 'white', padding: 20, borderRadius: 12, width: '100%', marginBottom: 30, elevation: 3 },
  statText: { fontSize: 18, marginBottom: 10, color: '#555' },
  scanAgainButton: { backgroundColor: '#007AFF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
  scanAgainText: { color: 'white', fontSize: 16, fontWeight: 'bold' },


  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  listImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
});