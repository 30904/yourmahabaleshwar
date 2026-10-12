import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthLink, DevOtp, FormError, authErrorMessage } from '../../components/AuthFrame';
import { useAuth } from '../../context/AuthContext';
import { Button, Field, Muted, Screen } from '../../components/ui';
import { COLORS, FONTS, VENDOR_ROLES } from '../../constants/theme';
import i18n from '../../i18n';

const logo = require('../../../assets/logo.png');
const HERO = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80';

export default function LoginScreen({ navigation }) {
    const { t, i18n: i18nApi } = useTranslation();
    const insets = useSafeAreaInsets();
    const { login, verifyOtp, resendOtp, pendingOtp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('form');
    const [devHint, setDevHint] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const showError = (message) => {
        setError(message);
    };
    const finishLogin = (user) => {
        const screen = user && VENDOR_ROLES.includes(user.role) ? 'Overview' : 'HomeTab';
        navigation.getParent()?.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen } }],
        }));
    };
    const onLogin = async () => {
        if (!email.trim() || !password) {
            showError(t('auth.needCredentials'));
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await login(email.trim(), password);
            if (res.requiresOtp) {
                setStep('otp');
                if (res.devCode)
                    setDevHint(res.devCode);
            }
            else if (res.user) {
                finishLogin(res.user);
            }
        }
        catch (e) {
            showError(authErrorMessage(e));
        }
        finally {
            setLoading(false);
        }
    };
    const onVerify = async () => {
        if (!otp.trim()) {
            showError(t('auth.otp'));
            return;
        }
        setError('');
        setLoading(true);
        try {
            const user = await verifyOtp(otp.trim());
            finishLogin(user);
        }
        catch (e) {
            showError(authErrorMessage(e));
        }
        finally {
            setLoading(false);
        }
    };
    const onResend = async () => {
        setError('');
        try {
            const r = await resendOtp();
            if (r.devCode)
                setDevHint(r.devCode);
        }
        catch (e) {
            showError(authErrorMessage(e));
        }
    };
    const setLang = (code) => {
        i18n.changeLanguage(code);
        if (typeof localStorage !== 'undefined') localStorage.setItem('lang', code);
        AsyncStorage.setItem('lang', code).catch(() => {});
    };
    const language = i18nApi.language?.startsWith('mr') ? 'mr' : 'en';
    return (
        <Screen style={styles.screen}>
            <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'web' ? undefined : 'padding'}>
                <View style={[styles.hero, { marginTop: -insets.top, height: 148 + insets.top }]}>
                    <Image source={{ uri: HERO }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    <LinearGradient
                        colors={['rgba(0,26,64,0.2)', 'rgba(0,53,128,0.78)']}
                        style={StyleSheet.absoluteFill}
                    />
                </View>
                <View style={styles.sheet}>
                    <Image source={logo} style={styles.logo} resizeMode="contain" />
                    <View style={styles.middle}>
                        {step === 'form' ? (
                            <>
                                <Text style={styles.title}>{t('auth.signIn')}</Text>
                                <Text style={styles.lead}>{t('auth.signInSubtitle')}</Text>
                                <Field soft label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" />
                                <Field soft label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry reveal />
                                <AuthLink title={t('auth.forgotPassword')} align="right" onPress={() => navigation.navigate('ForgotPassword')} />
                                <FormError message={error} />
                                <Button title={t('common.continue')} onPress={onLogin} loading={loading} />
                            </>
                        ) : (
                            <>
                                <Text style={styles.title}>{t('auth.verify')}</Text>
                                <Muted>{t('auth.otpHint')}</Muted>
                                <DevOtp code={devHint || pendingOtp?.devCode} />
                                <Field soft label={t('auth.otp')} value={otp} onChangeText={setOtp} keyboardType="numeric" maxLength={6} />
                                <FormError message={error} />
                                <Button title={t('auth.verify')} onPress={onVerify} loading={loading} />
                                <AuthLink title={t('auth.resendOtp')} onPress={onResend} />
                            </>
                        )}
                    </View>
                    <View style={styles.footer}>
                        {step === 'form' ? (
                            <Text style={styles.newHere}>
                                <Text style={styles.newHereMuted}>{t('auth.newHere')} </Text>
                                <Text style={styles.create} onPress={() => navigation.navigate('Register')}>{t('auth.register')}</Text>
                            </Text>
                        ) : null}
                        <View style={styles.langRow}>
                            {[['en', 'English'], ['mr', 'मराठी']].map(([code, label]) => {
                                const on = language === code;
                                return (
                                    <Pressable key={code} onPress={() => setLang(code)} style={[styles.lang, on && styles.langOn]}>
                                        <Text style={[styles.langText, on && styles.langTextOn]}>{label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        padding: 0,
        backgroundColor: COLORS.card,
    },
    fill: { flex: 1 },
    hero: {
        backgroundColor: COLORS.primary,
        overflow: 'hidden',
    },
    sheet: {
        flex: 1,
        marginTop: -28,
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
    },
    logo: {
        width: 188,
        height: 64,
        alignSelf: 'center',
        marginBottom: 16,
    },
    middle: { flex: 1 },
    title: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        color: COLORS.text,
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    lead: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        lineHeight: 20,
        color: COLORS.muted,
        marginBottom: 16,
    },
    footer: { paddingTop: 8 },
    newHere: { textAlign: 'center' },
    newHereMuted: { fontFamily: FONTS.regular, fontSize: 14, color: '#475569' },
    create: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.primary },
    langRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 14,
    },
    lang: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#F8FAFC',
    },
    langOn: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    langText: {
        fontFamily: FONTS.semibold,
        fontSize: 13,
        color: COLORS.primary,
    },
    langTextOn: { color: '#fff' },
});
