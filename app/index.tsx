import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthGateway() {
  const router = useRouter();

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        
        const userId = await AsyncStorage.getItem('userId');
        
        if (userId) {
          
          router.replace('/(tabs)/workout'); 
        } else {
          
          router.replace('/login');
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        router.replace('/login');
      }
    };

    
    checkUserStatus();
  }, []);

 
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#0a7ea4" />
    </View>
  );
}