import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Screen } from './ui';
import { COLORS, FONTS } from '../constants/theme';

const logo = require('../../assets/logo.png');

export default function AuthFrame({ title, hint, subtitle, footer, children, onBack, backLabel }) {
    return (
        <Screen style={styles.screen}>
            <ScrollView contentContainerStyle={styles.page}>
                <View style={styles.band}>
                    {onBack ? (
                        <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
                            <Text style={styles.backText}>← {backLabel}</Text>
                        </Pressable>
                    ) : null}
                    <Image source={logo} style={styles.logo} resizeMode="contain" />
                    {subtitle ? <Text style={styles.bandHint}>{subtitle}</Text> : null}
                </View>
                <View style={styles.body}>
                    <Card style={styles.card}>
                        <Text style={styles.title}>{title}</Text>
                        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
                        <View style={{ marginTop: hint ? 16 : 32 }}>
                            {children}
                        </View>
                        {footer}
                    </Card>
                </View>
            </ScrollView>
        </Screen>
    );
}

export function AuthLink({ title, onPress, align = 'center' }) {
    return (
        <Pressable onPress={onPress} style={[styles.linkWrap, align === 'right' && styles.linkRight]}>
            <Text style={styles.link}>{title}</Text>
        </Pressable>
    );
}

export function authErrorMessage(error) {
    const data = error?.response?.data;
    if (Array.isArray(data?.errors) && data.errors.length) {
        const msgs = data.errors.map((item) => item.msg).filter(Boolean);
        if (msgs.length)
            return msgs.join(' ');
    }
    return data?.message || error?.message || 'Something went wrong';
}

export function FormError({ message }) {
    if (!message)
        return null;
    return <Text style={styles.error}>{message}</Text>;
}

export function DevOtp({ code }) {
    if (!code) return null;
    return (
        <View style={styles.dev}>
            <Text style={styles.devText}>Dev OTP: {code}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { padding: 0, backgroundColor: '#F5F7FA' },
    page: { paddingBottom: 48 },
    band: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 16,
    },
    back: { alignSelf: 'flex-start', marginBottom: 8 },
    backText: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.primary },
    logo: { width: 260, height: 96 },
    bandHint: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: '#64748B',
        marginTop: 12,
        textAlign: 'center',
    },
    body: { paddingHorizontal: 16, paddingTop: 48 },
    card: { padding: 32, marginBottom: 0 },
    title: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        color: COLORS.text,
        letterSpacing: -0.3,
    },
    hint: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.muted,
        marginTop: 6,
        lineHeight: 20,
    },
    linkWrap: { marginTop: 16, alignItems: 'center' },
    linkRight: { alignItems: 'flex-end', marginTop: 0, marginBottom: 4 },
    link: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.primary },
    dev: {
        backgroundColor: '#FFFBEB',
        borderRadius: 8,
        padding: 10,
        marginTop: 12,
    },
    devText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.warning },
    error: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.danger,
        marginTop: 12,
    },
});
