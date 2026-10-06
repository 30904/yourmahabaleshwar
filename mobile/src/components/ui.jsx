import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

export function Screen({ children, style }) {
    return <View style={[styles.screen, style]}>{children}</View>;
}

export function Card({ children, style }) {
    return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }) {
    return <Text style={styles.title}>{children}</Text>;
}

export function Muted({ children }) {
    return <Text style={styles.muted}>{children}</Text>;
}

export function Button({ title, onPress, variant = 'primary', disabled, loading }) {
    const outline = variant === 'outline';
    const danger = variant === 'danger';
    const [pressed, setPressed] = useState(false);
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            style={[
                styles.btn,
                outline && styles.btnOutline,
                danger && styles.btnDanger,
                pressed && !outline && !danger && styles.btnPressed,
                pressed && outline && styles.btnOutlinePressed,
                (disabled || loading) && styles.btnDisabled,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={outline ? COLORS.primary : '#fff'} />
            ) : (
                <Text style={[styles.btnText, outline && styles.btnTextOutline, pressed && outline && styles.btnTextOutlinePressed]}>
                    {title}
                </Text>
            )}
        </Pressable>
    );
}

export function Field({
    label,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType,
    placeholder,
    maxLength,
    autoCapitalize = 'none',
}) {
    const [focused, setFocused] = useState(false);
    return (
        <View style={styles.field}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <TextInput
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                placeholder={placeholder}
                maxLength={maxLength}
                autoCapitalize={autoCapitalize}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={[styles.input, focused && styles.inputFocused]}
                placeholderTextColor={COLORS.muted}
            />
        </View>
    );
}

export function Loading() {
    return (
        <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
    );
}

const cardShadow = Platform.select({
    web: { boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' },
    default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
});

const buttonShadow = Platform.select({
    web: { boxShadow: '0 2px 8px rgba(0, 113, 194, 0.35)' },
    default: {
        shadowColor: '#0071C2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 3,
    },
});

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.card,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
        ...cardShadow,
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        color: COLORS.text,
        letterSpacing: -0.4,
        marginBottom: 4,
    },
    muted: {
        fontFamily: FONTS.regular,
        color: COLORS.muted,
        fontSize: 16,
        lineHeight: 22,
    },
    field: { marginBottom: 12 },
    label: {
        fontFamily: FONTS.semibold,
        fontSize: 14,
        color: COLORS.body,
        marginBottom: 6,
    },
    input: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.input,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: COLORS.body,
    },
    inputFocused: {
        borderColor: COLORS.focus,
        ...Platform.select({
            web: { boxShadow: '0 0 0 3px rgba(0, 113, 194, 0.15)' },
            default: {},
        }),
    },
    btn: {
        backgroundColor: COLORS.action,
        borderRadius: RADIUS.button,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        minHeight: 48,
        ...buttonShadow,
    },
    btnPressed: { backgroundColor: COLORS.actionPressed },
    btnOutline: {
        backgroundColor: COLORS.card,
        borderWidth: 2,
        borderColor: COLORS.primary,
        shadowOpacity: 0,
        elevation: 0,
        ...Platform.select({ web: { boxShadow: 'none' }, default: {} }),
    },
    btnOutlinePressed: { backgroundColor: COLORS.primary },
    btnTextOutline: { color: COLORS.primary, fontFamily: FONTS.semibold },
    btnTextOutlinePressed: { color: '#fff' },
    btnDanger: {
        backgroundColor: COLORS.danger,
        ...Platform.select({
            web: { boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)' },
            default: { shadowColor: '#DC2626' },
        }),
    },
    btnDisabled: { opacity: 0.6 },
    btnText: {
        fontFamily: FONTS.bold,
        color: '#fff',
        fontSize: 14,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
});
