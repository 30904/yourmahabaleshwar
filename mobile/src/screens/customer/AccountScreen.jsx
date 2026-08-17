import React from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
export default function AccountScreen() {
    const { t } = useTranslation();
    const { user, logout, isVendor } = useAuth();
    const navigation = useNavigation();
    if (!user) {
        return (<Screen>
        <Title>{t('nav.account')}</Title>
        <Muted>{t('auth.welcome')}</Muted>
        <Button title={t('auth.signIn')} onPress={() => navigation.navigate('Auth')}/>
        <Button title={t('auth.register')} variant="outline" onPress={() => navigation.navigate('Auth')}/>
      </Screen>);
    }
    return (<Screen>
      <Title>{t('nav.account')}</Title>
      <Card>
        <Text style={{ fontWeight: '800', fontSize: 18, color: COLORS.text }}>{user.name}</Text>
        <Muted>{user.email}</Muted>
        <Muted>{user.role}</Muted>
      </Card>
      <Card>
        <Muted>Language</Muted>
        <Button title="English" variant={i18n.language === 'en' ? 'primary' : 'outline'} onPress={() => i18n.changeLanguage('en')}/>
        <Button title="मराठी" variant={i18n.language === 'mr' ? 'primary' : 'outline'} onPress={() => i18n.changeLanguage('mr')}/>
      </Card>
      {isVendor && <Button title={t('nav.vendor')} onPress={() => navigation.navigate('VendorHub')}/>}
      <Button title={t('auth.logout')} variant="danger" onPress={() => logout()}/>
    </Screen>);
}
