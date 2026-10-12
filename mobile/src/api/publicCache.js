import AsyncStorage from '@react-native-async-storage/async-storage';
import { isNetworkError, markOffline, subscribeReconnect } from './network';

const PREFIX = 'ymb-public:';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const memory = new Map();

function freshEntry(entry) {
    if (!entry || entry.data == null) return null;
    if (Date.now() - entry.savedAt > MAX_AGE_MS) return null;
    return entry;
}

export async function readPublicCache(key) {
    const remembered = freshEntry(memory.get(key));
    if (remembered) return remembered;
    try {
        const raw = await AsyncStorage.getItem(PREFIX + key);
        if (!raw) return null;
        const parsed = freshEntry(JSON.parse(raw));
        if (!parsed) {
            AsyncStorage.removeItem(PREFIX + key).catch(() => {});
            return null;
        }
        memory.set(key, parsed);
        return parsed;
    }
    catch {
        return null;
    }
}

export async function writePublicCache(key, data) {
    const entry = { savedAt: Date.now(), data };
    memory.set(key, entry);
    try {
        await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
    }
    catch {
        /* the in-memory copy is enough if the device store is full */
    }
}

const watchers = new Map();

subscribeReconnect(() => {
    watchers.forEach((slot) => {
        refreshPublic(slot).catch(() => {});
    });
});

async function refreshPublic(slot) {
    try {
        const data = await slot.fetcher();
        await writePublicCache(slot.key, data);
        if (slot.alive) slot.onData?.(data, { fresh: true });
        return data;
    }
    catch (error) {
        if (isNetworkError(error)) markOffline();
        throw error;
    }
}

export function loadPublic(key, fetcher, onData) {
    const slot = { key, fetcher, onData, alive: true };
    watchers.set(key, slot);
    const promise = (async () => {
        const cached = await readPublicCache(key);
        if (cached && slot.alive) onData?.(cached.data, { fresh: false });
        try {
            return await refreshPublic(slot);
        }
        catch (error) {
            if (cached) return cached.data;
            throw error;
        }
    })();
    promise.cancel = () => {
        slot.alive = false;
        if (watchers.get(key) === slot) watchers.delete(key);
    };
    return promise;
}
