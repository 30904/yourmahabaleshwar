import React, { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button, Field, Screen, Title, Muted, Card } from '../../components/ui';
import { COLORS } from '../../constants/theme';
const TYPES = ['HOTEL', 'RESORT', 'HOMESTAY', 'TENT', 'GUIDE', 'TAXI', 'HORSE'];
export default function VendorRegisterScreen({ navigation }) {
    const { t } = useTranslation();
    const { registerVendor, verifyOtp, pendingOtp } = useAuth();
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        vendorType: 'HOTEL',
        businessName: '',
    });
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('form');
    const [devHint, setDevHint] = useState('');
    const [loading, setLoading] = useState(false);
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    return (<Screen>
      <ScrollView>
        <Title>{t('auth.vendorRegister')}</Title>
        <Muted>{t('vendor.kycHint')}</Muted>
        {step === 'form' ? (<Card>
            <Muted>Type (tap to cycle)</Muted>
            <Button title={form.vendorType} variant="outline" onPress={() => {
                const i = TYPES.indexOf(form.vendorType);
                set('vendorType', TYPES[(i + 1) % TYPES.length]);
            }}/>
            <Field label="Business name" value={form.businessName} onChangeText={(v) => set('businessName', v)}/>
            <Field label={t('auth.name')} value={form.name} onChangeText={(v) => set('name', v)}/>
            <Field label={t('auth.email')} value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address"/>
            <Field label={t('auth.phone')} value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad"/>
            <Field label={t('auth.password')} value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry/>
            <Button title={t('common.submit')} loading={loading} onPress={async () => {
                setLoading(true);
                try {
                    const res = await registerVendor(form);
                    if (res.requiresOtp) {
                        setStep('otp');
                        if (res.devCode)
                            setDevHint(res.devCode);
                    }
                }
                catch (e) {
                    Alert.alert(t('common.error'), e.response?.data?.message || e.message);
                }
                finally {
                    setLoading(false);
                }
            }}/>
            <Button title={t('auth.signIn')} variant="outline" onPress={() => navigation.navigate('Login')}/>
          </Card>) : (<Card>
            <Muted>{t('auth.otpHint')}</Muted>
            {(devHint || pendingOtp?.devCode) && (<Text style={{ color: COLORS.accent, marginVertical: 8 }}>Dev OTP: {devHint || pendingOtp?.devCode}</Text>)}
            <Field label={t('auth.otp')} value={otp} onChangeText={setOtp} keyboardType="numeric"/>
            <Button title={t('auth.verify')} loading={loading} onPress={async () => {
                setLoading(true);
                try {
                    await verifyOtp(otp.trim());
                }
                catch (e) {
                    Alert.alert(t('common.error'), e.response?.data?.message || e.message);
                }
                finally {
                    setLoading(false);
                }
            }}/>
          </Card>)}
      </ScrollView>
    </Screen>);
}
