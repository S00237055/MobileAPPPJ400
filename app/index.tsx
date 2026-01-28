import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, Alert, Button, TextInput } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const API_URL = 'http://10.20.4.100:5226/api/Users/login';

  const handleLogin = async () => {
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }

    try {
      
      const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        username: username, 
        password: password,
      }),
    });

    if (response.ok) {
      const userData = await response.json();
      console.log('Login successful:', userData);

      // navigate to the main app
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login failed', 'Invalid username or password');
    }
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Error', 'An error occurred during login. Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fitness App Login</Text>
      
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