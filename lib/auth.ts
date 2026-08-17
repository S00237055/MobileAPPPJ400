import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'authToken';
const USER_ID_KEY = 'userId';

const useSecureStore = Platform.OS !== 'web';

async function setItem(key: string, value: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (useSecureStore) {
    return await SecureStore.getItemAsync(key);
  }
  return await AsyncStorage.getItem(key);
}

async function removeItem(key: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

export async function saveSession(token: string, userId: number): Promise<void> {
  await setItem(TOKEN_KEY, token);
  await setItem(USER_ID_KEY, userId.toString());
}

export async function getToken(): Promise<string | null> {
  return await getItem(TOKEN_KEY);
}

export async function getUserId(): Promise<number | null> {
  const stored = await getItem(USER_ID_KEY);
  if (!stored) return null;

  const parsed = parseInt(stored, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function clearSession(): Promise<void> {
  await removeItem(TOKEN_KEY);
  await removeItem(USER_ID_KEY);

  try {
    await AsyncStorage.removeItem(USER_ID_KEY);
  } catch {

  }
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  return token !== null && token.length > 0;
}
