import React, { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '../../api/endpoints';
import { Button, Field, Screen, Title, Muted, Card } from '../../components/ui';

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
    return (<Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Title>{t('auth.forgotPassword')}</Title>
        <Muted>{t('auth.forgotHint')}</Muted>
        <Card>
          <Field label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address"/>
          <Button title={t('auth.sendReset')} onPress={onSubmit} loading={loading}/>
          <Button title={t('auth.signIn')} variant="outline" onPress={() => navigation.navigate('Login')}/>
        </Card>
      </ScrollView>
    </Screen>);
}
