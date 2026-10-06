import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memory = new Map();

function browserStore() {
    if (typeof localStorage !== 'undefined')
        return localStorage;
    return {
        getItem: (key) => (memory.has(key) ? memory.get(key) : null),
        setItem: (key, value) => memory.set(key, value),
        removeItem: (key) => memory.delete(key),
    };
}

export async function readToken(key) {
    if (Platform.OS === 'web')
        return browserStore().getItem(key);
    try {
        return await SecureStore.getItemAsync(key);
    }
    catch {
        return null;
    }
}

export async function writeToken(key, value) {
    if (Platform.OS === 'web') {
        browserStore().setItem(key, value);
        return;
    }
    await SecureStore.setItemAsync(key, value);
}

export async function clearToken(key) {
    if (Platform.OS === 'web') {
        browserStore().removeItem(key);
        return;
    }
    try {
        await SecureStore.deleteItemAsync(key);
    }
    catch {
        // Native store can be missing in a browser preview.
    }
}
