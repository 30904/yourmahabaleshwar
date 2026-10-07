import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { clearToken, readToken, writeToken } from '../api/tokenStore';
import Constants from 'expo-constants';
import { registerDevice, unregisterDevice } from '../api/endpoints';
import { VENDOR_ROLES } from '../constants/theme';

const PUSH_TOKEN_KEY = 'pushToken';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const vendorAppRoles = new Set([...VENDOR_ROLES, 'PRODUCT_VENDOR']);
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});
const readProjectId = () => {
    const id = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    if (id && UUID_RE.test(id)) return id;
    console.warn('[push] Set extra.eas.projectId to the Expo project UUID before a device can receive remote push');
    return null;
};

export async function registerForPushNotifications(role) {
    if (!Device.isDevice) {
        console.log('[push] Skipping — physical device required for remote push');
        return null;
    }
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
        });
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted')
        return null;
    const projectId = readProjectId();
    if (!projectId)
        return null;
    let token;
    try {
        const res = await Notifications.getExpoPushTokenAsync({ projectId });
        token = res.data;
    }
    catch (err) {
        console.warn('[push] getExpoPushTokenAsync failed', err);
        return null;
    }
    if (!token)
        return null;
    const appRole = role && vendorAppRoles.has(role) ? 'VENDOR' : 'CUSTOMER';
    try {
        await registerDevice({
            token,
            platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
            appRole,
        });
        await writeToken(PUSH_TOKEN_KEY, token);
    }
    catch (err) {
        console.warn('[push] registerDevice failed', err);
        return null;
    }
    return token;
}

export async function unregisterPushNotifications() {
    const token = await readToken(PUSH_TOKEN_KEY);
    if (!token)
        return;
    try {
        await unregisterDevice(token);
    }
    catch (err) {
        console.warn('[push] unregister failed', err);
    }
    await clearToken(PUSH_TOKEN_KEY);
}
