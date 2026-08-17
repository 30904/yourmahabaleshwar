import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
const fallbackDev = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
const productionApi = 'https://www.yourmahabaleshwar.com/api';
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ||
    Constants.expoConfig?.extra?.apiUrl ||
    (__DEV__ ? fallbackDev : productionApi);
const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
});
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token)
        config.headers.Authorization = `Bearer ${token}`;
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
});
api.interceptors.response.use((res) => res, async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && original && !original._retry) {
        original._retry = true;
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
            try {
                const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
                const accessToken = data.data.accessToken;
                await SecureStore.setItemAsync('accessToken', accessToken);
                original.headers.Authorization = `Bearer ${accessToken}`;
                return api(original);
            }
            catch {
                await SecureStore.deleteItemAsync('accessToken');
                await SecureStore.deleteItemAsync('refreshToken');
            }
        }
    }
    return Promise.reject(err);
});
export default api;
