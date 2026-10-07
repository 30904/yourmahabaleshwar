import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { uploadStorageFile } from '../../api/upload';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';

const webFileInput = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    zIndex: 2,
};

export default function DocumentUpload({ label, hint, value, onChange, category, userId, meta, types }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const send = async (file) => {
        if (!file) return;
        setError('');
        setUploading(true);
        try {
            const saved = await uploadStorageFile(file, { category, userId, ...meta });
            onChange(saved.key || saved.url || '');
        }
        catch (err) {
            setError(err.response?.data?.message || err.message || 'Upload failed');
        }
        finally {
            setUploading(false);
        }
    };

    const pickNative = async () => {
        if (uploading) return;
        const result = await DocumentPicker.getDocumentAsync({
            type: types || ['image/*', 'application/pdf'],
            copyToCacheDirectory: true,
            multiple: false,
        });
        if (result.canceled || !result.assets?.[0]) return;
        await send(result.assets[0]);
    };

    return (
        <View style={styles.wrap}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <View style={styles.box}>
                {uploading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.hint} pointerEvents="none">{value ? 'File uploaded' : hint}</Text>}
                {Platform.OS === 'web' ? React.createElement('input', {
                    type: 'file',
                    accept: (types || ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']).join(','),
                    disabled: uploading,
                    onChange: (event) => {
                        const file = event.target.files?.[0] || null;
                        event.target.value = '';
                        send(file);
                    },
                    style: webFileInput,
                }) : (
                    <Pressable style={StyleSheet.absoluteFill} onPress={pickNative} disabled={uploading} />
                )}
            </View>
            {value ? (
                <Pressable onPress={() => onChange('')}>
                    <Text style={styles.clear}>Remove file</Text>
                </Pressable>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginTop: 8 },
    label: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.body, marginBottom: 6 },
    box: {
        position: 'relative',
        minHeight: 72,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: COLORS.inputBorder,
        borderRadius: RADIUS.input,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 12,
    },
    hint: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.muted, textAlign: 'center' },
    clear: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.primary, marginTop: 6 },
    error: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.danger, marginTop: 6 },
});
