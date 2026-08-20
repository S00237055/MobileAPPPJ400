import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, Alert, Button, TextInput } from 'react-native';
import { apiFetch } from '../lib/api';
import { saveSession } from '../lib/auth';


export default function LoginScreen() {
  const router = useRouter();

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }

    try {
      const userData = await apiFetch('/User/login', {
        method: 'POST',
        body: { username: username, password: password },
        redirectOnUnauthorised: false,
      });

      await saveSession(userData.token, userData.userId);

      // navigate to the main app
      router.replace('/(tabs)/workout');
    } catch (error: any) {
      if (error?.status === 401) {
        Alert.alert('Login failed', 'Invalid username or password');
      } else {
        console.error('Error during login:', error);
        Alert.alert('Error', 'An error occurred during login. Please try again later.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fuel Track</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Login" onPress={handleLogin} />
      <View style={{ marginTop: 20 }}>
          <Button title="Go to Register" onPress={() => router.push('/register')} color="#0a7ea4" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    padding: 10, 
    marginBottom: 15, 
    borderRadius: 5 
  }
});