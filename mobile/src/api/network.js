import { AppState, Platform } from 'react-native';

let online = true;
let probing = false;
let healthUrl = '';
const listeners = new Set();

export function setHealthUrl(url) {
    healthUrl = url;
}

export function isNetworkError(error) {
    if (!error || error.response) return false;
    return true;
}

export function subscribeReconnect(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function markOffline() {
    online = false;
    ensureProbe();
}

export function markOnline() {
    if (online) return;
    online = true;
    listeners.forEach((listener) => {
        try {
            listener();
        }
        catch {
            /* a screen refresh should not stop the others */
        }
    });
}

function ensureProbe() {
    if (probing || !healthUrl) return;
    probing = true;
    const tick = async () => {
        if (online) {
            probing = false;
            return;
        }
        try {
            const response = await fetch(healthUrl, { method: 'GET' });
            if (response.ok) {
                probing = false;
                markOnline();
                return;
            }
        }
        catch {
            /* still offline */
        }
        setTimeout(tick, 4000);
    };
    tick();
}

if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('offline', () => {
        online = false;
    });
    window.addEventListener('online', () => ensureProbe());
}

AppState.addEventListener('change', (state) => {
    if (state === 'active' && !online) ensureProbe();
});
