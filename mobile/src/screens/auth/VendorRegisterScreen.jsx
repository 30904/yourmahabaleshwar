import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button, Field, Screen, Title, Muted, Card } from '../../components/ui';
import { COLORS } from '../../constants/theme';

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
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const openVendor = () => {
        const parent = navigation.getParent();
        if (form.vendorType === 'PRODUCT') {
            parent?.navigate('VendorKyc');
            return;
        }
        parent?.navigate('MainTabs', { screen: 'VendorTab' });
    };
    const onSubmit = async () => {
        const phone = form.phone.replace(/\D/g, '').slice(-10);
        if (!form.name.trim() || !form.email.trim() || phone.length !== 10 || !form.password) {
            return Alert.alert(t('common.error'), t('auth.needSignup'));
        }
        if (form.password.length < 6) {
            return Alert.alert(t('common.error'), t('auth.passwordMin'));
        }
        if (form.password !== form.confirm) {
            return Alert.alert(t('common.error'), t('auth.mismatch'));
        }
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
                Alert.alert(t('auth.otpSent'), t('auth.otpHint'));
            }
            else if (res.user) {
                Alert.alert(t('vendor.registerSuccess'));
                openVendor();
            }
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
        finally {
            setLoading(false);
        }
    };
    const onVerify = async () => {
        if (!otp.trim())
            return Alert.alert(t('common.error'), t('auth.otp'));
        setLoading(true);
        try {
            await verifyOtp(otp.trim());
            Alert.alert(t('vendor.registerSuccess'));
            openVendor();
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
        finally {
            setLoading(false);
        }
    };
    const onResend = async () => {
        try {
            const r = await resendOtp();
            if (r.devCode)
                setDevHint(r.devCode);
            Alert.alert(t('auth.otpSent'), t('auth.otpHint'));
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
    };
    return (<Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Title>{t('auth.vendorRegister')}</Title>
        <Muted>{t('vendor.kycHint')}</Muted>
        {step === 'form' ? (<Card>
            <Muted>{t('vendor.vendorType')}</Muted>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {TYPES.map((type) => {
                const selected = form.vendorType === type;
                return (<Pressable key={type} onPress={() => set('vendorType', type)} style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: selected ? COLORS.primary : COLORS.border,
                    backgroundColor: selected ? COLORS.primary : '#fff',
                }}>
                    <Text style={{ color: selected ? '#fff' : COLORS.text, fontWeight: '700' }}>{t(`vendor.types.${type}`)}</Text>
                  </Pressable>);
            })}
            </View>
            <Field label={t('vendor.businessName')} value={form.businessName} onChangeText={(v) => set('businessName', v)} autoCapitalize="words"/>
            <Field label={t('auth.name')} value={form.name} onChangeText={(v) => set('name', v)} autoCapitalize="words"/>
            <Field label={t('auth.email')} value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address"/>
            <Field label={t('auth.phone')} value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" maxLength={10}/>
            <Field label={t('auth.password')} value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry/>
            <Field label={t('auth.confirmPassword')} value={form.confirm} onChangeText={(v) => set('confirm', v)} secureTextEntry/>
            <Button title={t('common.submit')} loading={loading} onPress={onSubmit}/>
            <Button title={t('auth.signIn')} variant="outline" onPress={() => navigation.navigate('Login')}/>
          </Card>) : (<Card>
            <Muted>{t('auth.otpHint')}</Muted>
            {(devHint || pendingOtp?.devCode) && (<Text style={{ color: COLORS.accent, marginVertical: 8 }}>Dev OTP: {devHint || pendingOtp?.devCode}</Text>)}
            <Field label={t('auth.otp')} value={otp} onChangeText={setOtp} keyboardType="numeric" maxLength={6}/>
            <Button title={t('auth.verify')} loading={loading} onPress={onVerify}/>
            <Button title={t('auth.resendOtp')} variant="outline" onPress={onResend}/>
          </Card>)}
      </ScrollView>
    </Screen>);
}
