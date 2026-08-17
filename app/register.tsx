import React, {useState} from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../lib/api';
import { saveSession } from '../lib/auth';

export default function RegisterScreen() {
  const router = useRouter();

  //user input states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
 
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('Build Muscle');

  const [isLoading, setIsLoading] = useState(false);

    const [errorMessage, setErrorMessage] = useState('');
    
  const handleRegister = async () => {
    if (!username || !password) {
      setErrorMessage("Please enter both username and password");
      return;
    }


    setIsLoading(true);
    setErrorMessage('');


    try {
      const data = await apiFetch('/User/register', {
        method: 'POST',
        body: {
            username,
            password,
            currentWeight: weight ? parseFloat(weight) : null,
            goalType: goal
        },
        redirectOnUnauthorised: false,
      });

      await saveSession(data.token, data.userId);

      Alert.alert("Success", "Account created successfully!");
      router.replace('/(tabs)');
    } catch (error: any) {
        if (error?.status) {
          setErrorMessage(error.body || "Registration failed. Please try again.");
        } else {
          setErrorMessage("Could not connect to the server. Is your backend running?");
          console.error(error);
        }
        } finally {
        setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create an Account</Text>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <TextInput 
            style={styles.input} 
            placeholder="Current Weight (kg) - Optional" 
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
            />

            <Text style={{ alignSelf: 'flex-start', marginLeft: '5%', color: '#666', marginBottom: 5 }}>Primary Goal:</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%', marginBottom: 20 }}>
                
                {['Build Muscle', 'Lose Weight', 'Maintain'].map((g) => (
                <TouchableOpacity 
                    key={g}
                    style={{
                    flex: 1,
                    padding: 10,
                    marginHorizontal: 5,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: goal === g ? '#007AFF' : '#e0e0e0' // Highlights the selected one!
                    }}
                    onPress={() => setGoal(g)}
                >
                    <Text style={{ 
                    fontSize: 12, 
                    fontWeight: 'bold', 
                    color: goal === g ? '#fff' : '#555' 
                    }}>
                    {g}
                    </Text>
                </TouchableOpacity>
                ))}
            </View>
            
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

            <TouchableOpacity
                style={styles.button}
                onPress={handleRegister}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" /> 
                ) : (
                <Text style={styles.buttonText}>Register</Text>
                )}
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
                <Text style={styles.linkText}>Already have an account? Log in</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#0a7ea4',
        height: 50,
        
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        marginBottom: 15,
        textAlign: 'center',
    },
    linkText: {
        color: '#0a7ea4',
        textAlign: 'center',
        fontSize: 16,
    },
});
