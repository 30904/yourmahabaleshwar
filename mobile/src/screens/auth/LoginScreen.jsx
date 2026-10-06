import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AuthFrame, { AuthLink, DevOtp, FormError, authErrorMessage } from '../../components/AuthFrame';
import { useAuth } from '../../context/AuthContext';
import { Button, Field, Muted } from '../../components/ui';
import { FONTS, VENDOR_ROLES } from '../../constants/theme';
export default function LoginScreen({ navigation }) {
    const { t } = useTranslation();
    const { login, verifyOtp, resendOtp, pendingOtp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('form');
    const [devHint, setDevHint] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const showError = (e) => {
        const message = authErrorMessage(e);
        setError(message);
        Alert.alert(t('common.error'), message);
    };
    const goHome = () => {
        navigation.getParent()?.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'HomeTab' } }],
        }));
    };
    const finishLogin = (user) => {
        const screen = user && VENDOR_ROLES.includes(user.role) ? 'VendorTab' : 'HomeTab';
        navigation.getParent()?.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen } }],
        }));
    };
    const onLogin = async () => {
        if (!email.trim() || !password) {
            setError(t('auth.needCredentials'));
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
            showError(e);
        }
        finally {
            setLoading(false);
        }
    };
    const onVerify = async () => {
        if (!otp.trim()) {
            setError(t('auth.otp'));
            return;
        }
        setError('');
        setLoading(true);
        try {
            const user = await verifyOtp(otp.trim());
            finishLogin(user);
        }
        catch (e) {
            showError(e);
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
            showError(e);
        }
    };
    return (
        <AuthFrame
            title={t('auth.signIn')}
            subtitle={t('auth.signInSubtitle')}
            onBack={goHome}
            backLabel={t('auth.back')}
            footer={step === 'form' ? (
                <>
                    <Text style={styles.newHere}>
                        <Text style={styles.newHereMuted}>{t('auth.newHere')} </Text>
                        <Text style={styles.create} onPress={() => navigation.navigate('Register')}>{t('auth.register')}</Text>
                    </Text>
                    <View style={styles.demo}>
                        <Text style={styles.demoText}>Demo: admin@yourmahabaleshwar.com / Admin@123 (password only). Customer/vendor need OTP after password.</Text>
                    </View>
                </>
            ) : null}
        >
            {step === 'form' ? (
                <>
                    <Field label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" />
                    <Field label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry />
                    <AuthLink title={t('auth.forgotPassword')} align="right" onPress={() => navigation.navigate('ForgotPassword')} />
                    <FormError message={error} />
                    <Button title={t('common.continue')} onPress={onLogin} loading={loading} />
                </>
            ) : (
                <>
                    <Muted>{t('auth.otpHint')}</Muted>
                    <DevOtp code={devHint || pendingOtp?.devCode} />
                    <Field label={t('auth.otp')} value={otp} onChangeText={setOtp} keyboardType="numeric" maxLength={6} />
                    <FormError message={error} />
                    <Button title={t('auth.verify')} onPress={onVerify} loading={loading} />
                    <AuthLink title={t('auth.resendOtp')} onPress={onResend} />
                </>
            )}
        </AuthFrame>
    );
}

const styles = StyleSheet.create({
    newHere: { textAlign: 'center', marginTop: 24 },
    newHereMuted: { fontFamily: FONTS.regular, fontSize: 14, color: '#475569' },
    create: { fontFamily: FONTS.bold, fontSize: 14, color: '#003580' },
    demo: {
        marginTop: 16,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        padding: 12,
    },
    demoText: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 18, color: '#475569' },
});
