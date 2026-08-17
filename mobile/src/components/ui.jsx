import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, } from 'react-native';
import { COLORS } from '../constants/theme';
export function Screen({ children, style }) {
    return <View style={[styles.screen, style]}>{children}</View>;
}
export function Card({ children }) {
    return <View style={styles.card}>{children}</View>;
}
export function Title({ children }) {
    return <Text style={styles.title}>{children}</Text>;
}
export function Muted({ children }) {
    return <Text style={styles.muted}>{children}</Text>;
}
export function Button({ title, onPress, variant = 'primary', disabled, loading, }) {
    return (<Pressable onPress={onPress} disabled={disabled || loading} style={[
            styles.btn,
            variant === 'outline' && styles.btnOutline,
            variant === 'danger' && styles.btnDanger,
            (disabled || loading) && { opacity: 0.5 },
        ]}>
      {loading ? (<ActivityIndicator color={variant === 'outline' ? COLORS.primary : '#fff'}/>) : (<Text style={[styles.btnText, variant === 'outline' && { color: COLORS.primary }]}>{title}</Text>)}
    </Pressable>);
}
export function Field({ label, value, onChangeText, secureTextEntry, keyboardType, placeholder, }) {
    return (<View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry} keyboardType={keyboardType} placeholder={placeholder} autoCapitalize="none" style={styles.input} placeholderTextColor={COLORS.muted}/>
    </View>);
}
export function Loading() {
    return (<View style={styles.center}>
      <ActivityIndicator color={COLORS.primary} size="large"/>
    </View>);
}
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
    },
    title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
    muted: { color: COLORS.muted, fontSize: 14, lineHeight: 20 },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: COLORS.text,
    },
    btn: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.primary },
    btnDanger: { backgroundColor: COLORS.danger },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
});
