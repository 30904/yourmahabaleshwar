import { Platform, StatusBar } from 'react-native';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

function fallbackTop() {
    if (Platform.OS === 'android') {
        return StatusBar.currentHeight || initialWindowMetrics?.insets?.top || 24;
    }
    if (Platform.OS === 'ios') return initialWindowMetrics?.insets?.top || 0;
    return 0;
}

function fallbackBottom() {
    if (Platform.OS === 'android') return initialWindowMetrics?.insets?.bottom || 48;
    if (Platform.OS === 'ios') return initialWindowMetrics?.insets?.bottom || 0;
    return 0;
}

export function useDeviceInsets() {
    const insets = useSafeAreaInsets();
    return {
        top: insets.top > 0 ? insets.top : fallbackTop(),
        bottom: insets.bottom > 0 ? insets.bottom : fallbackBottom(),
        left: insets.left,
        right: insets.right,
    };
}
