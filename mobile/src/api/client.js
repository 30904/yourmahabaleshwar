import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { isNetworkError, markOffline, markOnline, setHealthUrl } from './network';
import { clearToken, readToken, writeToken } from './tokenStore';
const fallbackDev = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
const productionApi = 'https://www.yourmahabaleshwar.com/api';
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ||
    (__DEV__ ? fallbackDev : (Constants.expoConfig?.extra?.apiUrl || productionApi));
const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
});
api.interceptors.request.use(async (config) => {
    const token = await readToken('accessToken');
    if (token)
        config.headers.Authorization = `Bearer ${token}`;
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
});
api.interceptors.response.use((res) => {
    markOnline();
    return res;
}, async (err) => {
    if (isNetworkError(err)) markOffline();
    const original = err.config;
    if (err.response?.status === 401 && original && !original._retry) {
        original._retry = true;
        const refreshToken = await readToken('refreshToken');
        if (refreshToken) {
            try {
                const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
                const accessToken = data.data.accessToken;
                await writeToken('accessToken', accessToken);
                original.headers.Authorization = `Bearer ${accessToken}`;
                return api(original);
            }
            catch (refreshErr) {
                if (!isNetworkError(refreshErr)) {
                    await clearToken('accessToken');
                    await clearToken('refreshToken');
                }
            }
        }
    }
    return Promise.reject(err);
});
setHealthUrl(`${API_BASE.replace(/\/api\/?$/, '')}/healthz`);
export default api;
