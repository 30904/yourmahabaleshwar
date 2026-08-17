import React, { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button, Field, Screen, Title, Muted, Card } from '../../components/ui';
import { COLORS } from '../../constants/theme';
export default function LoginScreen({ navigation }) {
    const { t } = useTranslation();
    const { login, verifyOtp, resendOtp, pendingOtp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('form');
    const [devHint, setDevHint] = useState('');
    const [loading, setLoading] = useState(false);
    const onLogin = async () => {
        setLoading(true);
        try {
            const res = await login(email.trim(), password);
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
    const onVerify = async () => {
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
    };
    return (<Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={{ color: COLORS.primary, fontWeight: '900', fontSize: 28, marginTop: 24 }}>
          YOURMAHABALESHWAR
        </Text>
        <Title>{t('auth.signIn')}</Title>
        <Muted>{t('auth.welcome')}</Muted>

        {step === 'form' ? (<Card>
            <Field label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address"/>
            <Field label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry/>
            <Button title={t('auth.signIn')} onPress={onLogin} loading={loading}/>
            <Button title={t('auth.register')} onPress={() => navigation.navigate('Register')} variant="outline"/>
            <Button title={t('auth.vendorRegister')} onPress={() => navigation.navigate('VendorRegister')} variant="outline"/>
          </Card>) : (<Card>
            <Muted>{t('auth.otpHint')}</Muted>
            {(devHint || pendingOtp?.devCode) && (<Text style={{ marginTop: 8, color: COLORS.accent }}>Dev OTP: {devHint || pendingOtp?.devCode}</Text>)}
            <Field label={t('auth.otp')} value={otp} onChangeText={setOtp} keyboardType="numeric"/>
            <Button title={t('auth.verify')} onPress={onVerify} loading={loading}/>
            <Button title="Resend OTP" variant="outline" onPress={async () => {
                const r = await resendOtp();
                if (r.devCode)
                    setDevHint(r.devCode);
            }}/>
          </Card>)}
      </ScrollView>
    </Screen>);
}
