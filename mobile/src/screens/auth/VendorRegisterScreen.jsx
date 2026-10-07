import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AuthFrame, { AuthLink, DevOtp, FormError, authErrorMessage } from '../../components/AuthFrame';
import { useAuth } from '../../context/AuthContext';
import { Button, Field, Muted } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';

const TYPES = ['HOTEL', 'RESORT', 'HOMESTAY', 'TENT', 'GUIDE', 'TAXI', 'DRIVER', 'HORSE', 'PRODUCT'];

export default function VendorRegisterScreen({ navigation }) {
    const { t } = useTranslation();
    const { registerVendor, verifyOtp, resendOtp, pendingOtp } = useAuth();
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirm: '',
        vendorType: 'HOTEL',
        businessName: '',
    });
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
    const openVendor = () => {
        const parent = navigation.getParent();
        if (form.vendorType === 'PRODUCT') {
            parent?.dispatch(CommonActions.reset({
                index: 1,
                routes: [
                    { name: 'MainTabs', params: { screen: 'Overview' } },
                    { name: 'VendorKyc' },
                ],
            }));
            return;
        }
        parent?.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'Overview' } }],
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
            const res = await registerVendor({
                name: form.name.trim(),
                email: form.email.trim(),
                phone,
                password: form.password,
                vendorType: form.vendorType,
                businessName: form.businessName.trim(),
            });
            if (res.requiresOtp) {
                setStep('otp');
                if (res.devCode)
                    setDevHint(res.devCode);
            }
            else if (res.user) {
                openVendor();
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
            openVendor();
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
            title={t('vendor.registerTitle')}
            hint={step === 'form' ? t('vendor.registerSubtitle') : null}
            footer={step === 'form' ? (
                <Text style={{ textAlign: 'center', marginTop: 16 }}>
                    <Text style={{ color: '#475569' }}>{t('auth.haveAccount')} </Text>
                    <Text style={{ color: '#003580', fontWeight: '700' }} onPress={() => navigation.navigate('Login')}>{t('auth.signIn')}</Text>
                </Text>
            ) : null}
        >
            {step === 'form' ? (
                <>
                    <Muted>{t('vendor.vendorType')}</Muted>
                    <View style={styles.types}>
                        {TYPES.map((type) => {
                            const selected = form.vendorType === type;
                            return (
                                <Pressable key={type} onPress={() => set('vendorType', type)} style={[styles.type, selected && styles.typeOn]}>
                                    <Text style={[styles.typeText, selected && styles.typeTextOn]}>{t(`vendor.types.${type}`)}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                    <Field label={t('vendor.businessName')} value={form.businessName} onChangeText={(v) => set('businessName', v)} autoCapitalize="words" />
                    <Field label={t('auth.name')} value={form.name} onChangeText={(v) => set('name', v)} autoCapitalize="words" />
                    <Field label={t('auth.email')} value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" />
                    <Field label={t('auth.phone')} value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" maxLength={10} />
                    <Field label={t('auth.password')} value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry />
                    <Field label={t('auth.confirmPassword')} value={form.confirm} onChangeText={(v) => set('confirm', v)} secureTextEntry />
                    <FormError message={error} />
                    <Button title={t('common.submit')} loading={loading} onPress={onSubmit} />
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

const styles = StyleSheet.create({
    types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 8 },
    type: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#fff',
    },
    typeOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
    typeText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.text },
    typeTextOn: { color: COLORS.primary },
});
