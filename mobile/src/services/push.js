import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerDevice } from '../api/endpoints';
import { VENDOR_ROLES } from '../constants/theme';
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});
export async function registerForPushNotifications(role) {
    if (!Device.isDevice) {
        console.log('[push] Skipping — physical device required for remote push');
        return null;
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted')
        return null;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;
    let token;
    try {
        const res = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        token = res.data;
    }
    catch (err) {
        console.warn('[push] getExpoPushTokenAsync failed', err);
        return null;
    }
    if (!token)
        return null;
    const appRole = role && VENDOR_ROLES.includes(role) ? 'VENDOR' : 'CUSTOMER';
    try {
        await registerDevice({
            token,
            platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
            appRole,
        });
    }
    catch (err) {
        console.warn('[push] registerDevice failed', err);
    }
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
        });
    }
    return token;
}
