import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import AuthFrame, { AuthLink } from '../../components/AuthFrame';
import { forgotPassword } from '../../api/endpoints';
import { Button, Field } from '../../components/ui';

export default function ForgotPasswordScreen({ navigation }) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const onSubmit = async () => {
        if (!email.trim())
            return Alert.alert(t('common.error'), t('auth.email'));
        setLoading(true);
        try {
            await forgotPassword(email.trim());
            Alert.alert(t('auth.resetSent'));
            navigation.navigate('Login');
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
        finally {
            setLoading(false);
        }
    };
    return (
        <AuthFrame
            title={t('auth.forgotTitle')}
            hint={t('auth.forgotHint')}
            subtitle={t('auth.signInSubtitle')}
            footer={<AuthLink title={t('auth.backToLogin')} onPress={() => navigation.navigate('Login')} />}
        >
            <Field label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Button title={t('auth.sendReset')} onPress={onSubmit} loading={loading} />
        </AuthFrame>
    );
}
