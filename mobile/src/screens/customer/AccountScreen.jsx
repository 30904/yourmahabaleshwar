import React, { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Field, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
export default function AccountScreen() {
    const { t } = useTranslation();
    const { user, logout, isVendor, saveProfile } = useAuth();
    const navigation = useNavigation();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        setName(user?.name || '');
        setEmail(user?.email || '');
        setPhone(user?.phone || '');
    }, [user?.name, user?.email, user?.phone]);
    const onSave = async () => {
        if (!name.trim() || !email.trim()) {
            Alert.alert(t('common.error'), t('account.needProfile'));
            return;
        }
        setSaving(true);
        try {
            await saveProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() });
            Alert.alert(t('account.saved'));
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
        finally {
            setSaving(false);
        }
    };
    if (!user) {
        return (<Screen>
        <Title>{t('nav.account')}</Title>
        <Muted>{t('auth.welcome')}</Muted>
        <Button title={t('auth.signIn')} onPress={() => navigation.navigate('Auth')}/>
        <Button title={t('auth.register')} variant="outline" onPress={() => navigation.navigate('Auth')}/>
        <Button title={t('content.menu')} variant="outline" onPress={() => navigation.navigate('Content')}/>
      </Screen>);
    }
    return (<Screen>
      <Title>{t('nav.account')}</Title>
      <Card>
        <Text style={{ fontWeight: '800', fontSize: 18, color: COLORS.text }}>{t('account.profile')}</Text>
        <Field label={t('auth.name')} value={name} onChangeText={setName} autoCapitalize="words"/>
        <Field label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
        <Field label={t('auth.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
        <Muted>{user.role}</Muted>
        <Button title={t('account.save')} onPress={onSave} loading={saving}/>
      </Card>
      <Card>
        <Muted>Language</Muted>
        <Button title="English" variant={i18n.language === 'en' ? 'primary' : 'outline'} onPress={() => i18n.changeLanguage('en')}/>
        <Button title="मराठी" variant={i18n.language === 'mr' ? 'primary' : 'outline'} onPress={() => i18n.changeLanguage('mr')}/>
      </Card>
      <Button title={t('account.favorites')} variant="outline" onPress={() => navigation.navigate('Favorites')}/>
      <Button title={t('content.menu')} variant="outline" onPress={() => navigation.navigate('Content')}/>
      {isVendor && <Button title={t('nav.vendor')} onPress={() => navigation.navigate('VendorHub')}/>}
      <Button title={t('auth.logout')} variant="danger" onPress={() => logout()}/>
    </Screen>);
}
