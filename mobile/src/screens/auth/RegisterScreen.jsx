import React, { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button, Field, Screen, Title, Muted, Card } from '../../components/ui';
export default function RegisterScreen({ navigation }) {
    const { t } = useTranslation();
    const { register, verifyOtp, pendingOtp } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('form');
    const [devHint, setDevHint] = useState('');
    const [loading, setLoading] = useState(false);
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const onSubmit = async () => {
        setLoading(true);
        try {
            const res = await register(form);
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
    };
    return (<Screen>
      <ScrollView>
        <Title>{t('auth.register')}</Title>
        <Muted>{t('home.subhead')}</Muted>
        {step === 'form' ? (<Card>
            <Field label={t('auth.name')} value={form.name} onChangeText={(v) => set('name', v)}/>
            <Field label={t('auth.email')} value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address"/>
            <Field label={t('auth.phone')} value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad"/>
            <Field label={t('auth.password')} value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry/>
            <Button title={t('auth.register')} onPress={onSubmit} loading={loading}/>
            <Button title={t('auth.signIn')} variant="outline" onPress={() => navigation.navigate('Login')}/>
          </Card>) : (<Card>
            <Muted>{t('auth.otpHint')}</Muted>
            {(devHint || pendingOtp?.devCode) && <Muted>Dev OTP: {devHint || pendingOtp?.devCode}</Muted>}
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
