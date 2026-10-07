import { Platform } from 'react-native';
import api from './client';

export async function uploadStorageFile(file, meta = {}) {
    const form = new FormData();
    if (Platform.OS === 'web') {
        form.append('file', file);
    }
    else {
        form.append('file', {
            uri: file.uri,
            name: file.name || 'document',
            type: file.mimeType || 'application/octet-stream',
        });
    }
    form.append('category', meta.category);
    Object.entries(meta).forEach(([key, value]) => {
        if (key !== 'category' && value != null && value !== '') form.append(key, String(value));
    });
    const { data } = await api.post('/storage/upload', form);
    return data.data;
}
