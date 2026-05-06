import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

interface UserProfile {
  userId: number;
  username: string;
  currentWeight: number | null;
  goalType: string | null;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // State for the edit form
  const [editWeight, setEditWeight] = useState('');
  const [editGoal, setEditGoal] = useState('');
  
  const router = useRouter();

  // Replace with dynamic ID from your auth state
  const currentUserId = 1; 

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`http://192.168.1.166:5226/api/User/${currentUserId}`);
      if (!response.ok) throw new Error('Failed to fetch user data');

      const data = await response.json();
      setUser(data);
      setEditWeight(data.currentWeight ? data.currentWeight.toString() : '');
      setEditGoal(data.goalType || '');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`http://192.168.1.166:5226/api/User/${currentUserId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentWeight: editWeight ? parseFloat(editWeight) : null,
          goalType: editGoal ? editGoal : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not save profile data.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logged Out', 'You have been successfully logged out.');
    router.replace('/login');
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>No user data found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedView style={styles.avatarPlaceholder}>
          <ThemedText style={styles.avatarText}>
            {user.username.charAt(0).toUpperCase()}
          </ThemedText>
        </ThemedView>
        <ThemedText style={styles.title}>Hello, {user.username}!</ThemedText>
      </ThemedView>

      <ThemedView style={styles.infoCard}>
        {isEditing ? (
          <>
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.infoLabel}>Weight (kg):</ThemedText>
              <TextInput
                style={styles.input}
                value={editWeight}
                onChangeText={setEditWeight}
                keyboardType="numeric"
                placeholder="e.g. 75.5"
                placeholderTextColor="#999"
              />
            </ThemedView>

            <ThemedView style={styles.divider} />

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.infoLabel}>Goal:</ThemedText>
              <TextInput
                style={styles.input}
                value={editGoal}
                onChangeText={setEditGoal}
                placeholder="e.g. Build Muscle, Lose Weight"
                placeholderTextColor="#999"
              />
            </ThemedView>
          </>
        ) : (
          <>
            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Current Weight:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {user.currentWeight ? `${user.currentWeight} kg` : 'Not set'}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.divider} />

            <ThemedView style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Primary Goal:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {user.goalType ? user.goalType : 'Not set'}
              </ThemedText>
            </ThemedView>
          </>
        )}
      </ThemedView>

      {isEditing ? (
        <ThemedView style={styles.actionRow}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setIsEditing(false)}>
            <ThemedText style={styles.buttonText}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveProfile}>
            <ThemedText style={styles.buttonText}>Save</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : (
        <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => setIsEditing(true)}>
          <ThemedText style={styles.buttonText}>Edit Profile</ThemedText>
        </TouchableOpacity>
      )}

      {!isEditing && (
        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <ThemedText style={styles.buttonText}>Log Out</ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    alignItems: 'center' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: { 
    alignItems: 'center', 
    marginTop: 40, 
    marginBottom: 30 
  },
  avatarPlaceholder: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#007AFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  avatarText: { 
    color: '#fff', 
    fontSize: 40, 
    fontWeight: 'bold' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold' 
  },
  infoCard: { width: '100%', 
    borderRadius: 15, 
    padding: 20, 
    backgroundColor: 'rgba(150, 150, 150, 0.1)', 
    marginBottom: 20 
  },
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 10 
  },
  inputContainer: { 
    paddingVertical: 10 
  },
  infoLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#888', 
    marginBottom: 5 
  },
  infoValue: { 
    fontSize: 16, 
    fontWeight: 'bold'
   },
  input: { 
    backgroundColor: '#fff', 
    color: '#000', 
    borderRadius: 8, 
    padding: 10, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: '#ddd' 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#ccc', 
    marginVertical: 10, 
    opacity: 0.3 
  },
  actionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%' 
  },
  button: { 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 15 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  editButton: { 
    backgroundColor: '#007AFF', 
    width: '100%' 
  },
  saveButton: { 
    backgroundColor: '#34C759', 
    flex: 0.48 
  },
  cancelButton: { 
    backgroundColor: '#8E8E93', 
    flex: 0.48 
  },
  logoutButton: { 
    backgroundColor: '#FF3B30', 
    width: '100%' 
  },
});