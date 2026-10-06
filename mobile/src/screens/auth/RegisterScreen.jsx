import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AuthFrame, { AuthLink, DevOtp, FormError, authErrorMessage } from '../../components/AuthFrame';
import { useAuth } from '../../context/AuthContext';
import { Button, Field, Muted } from '../../components/ui';
export default function RegisterScreen({ navigation }) {
    const { t } = useTranslation();
    const { register, verifyOtp, resendOtp, pendingOtp } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('form');
    const [devHint, setDevHint] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const showError = (e) => {
        const message = typeof e === 'string' ? e : authErrorMessage(e);
        setError(message);
        Alert.alert(t('common.error'), message);
    };
    const goHome = () => {
        navigation.getParent()?.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'HomeTab' } }],
        }));
    };
    const onSubmit = async () => {
        const phone = form.phone.replace(/\D/g, '').slice(-10);
        if (!form.name.trim() || !form.email.trim() || phone.length !== 10 || !form.password) {
            showError(t('auth.needSignup'));
            return;
        }
        if (form.password.length < 6) {
            showError(t('auth.passwordMin'));
            return;
        }
        if (form.password !== form.confirm) {
            showError(t('auth.mismatch'));
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await register({
                name: form.name.trim(),
                email: form.email.trim(),
                phone,
                password: form.password,
            });
            if (res.requiresOtp) {
                setStep('otp');
                if (res.devCode)
                    setDevHint(res.devCode);
                Alert.alert(t('auth.otpSent'), t('auth.otpHint'));
            }
            else if (res.user) {
                Alert.alert(t('auth.accountCreated'));
                goHome();
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
            showError(t('auth.otp'));
            return;
        }
        setError('');
        setLoading(true);
        try {
            await verifyOtp(otp.trim());
            goHome();
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
            title={t('auth.register')}
            hint={step === 'form' ? t('auth.registerSubtitle') : null}
            footer={step === 'form' ? (
                <Text style={{ textAlign: 'center', marginTop: 16 }}>
                    <Text style={{ color: '#475569' }}>{t('auth.haveAccount')} </Text>
                    <Text style={{ color: '#003580', fontWeight: '700' }} onPress={() => navigation.navigate('Login')}>{t('auth.signIn')}</Text>
                </Text>
            ) : null}
        >
            {step === 'form' ? (
                <>
                    <Field label={t('auth.name')} value={form.name} onChangeText={(v) => set('name', v)} autoCapitalize="words" />
                    <Field label={t('auth.email')} value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" />
                    <Field label={t('auth.phone')} value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" maxLength={10} />
                    <Field label={t('auth.password')} value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry />
                    <Field label={t('auth.confirmPassword')} value={form.confirm} onChangeText={(v) => set('confirm', v)} secureTextEntry />
                    <FormError message={error} />
                    <Button title={t('auth.register')} onPress={onSubmit} loading={loading} />
                </>
            ) : (
                <>
                    <Muted>{t('auth.otpHint')}</Muted>
                    <DevOtp code={devHint || pendingOtp?.devCode} />
                    <Field label={t('auth.otp')} value={otp} onChangeText={setOtp} keyboardType="numeric" maxLength={6} />
                    <FormError message={error} />
                    <Button title={t('auth.verify')} loading={loading} onPress={onVerify} />
                    <AuthLink title={t('auth.resendOtp')} onPress={onResend} />
                </>
            )}
        </AuthFrame>
    );
}
