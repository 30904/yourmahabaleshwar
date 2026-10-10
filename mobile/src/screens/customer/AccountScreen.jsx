import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import i18n from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../components/confirm';
import { Button, Card, Field, Muted, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';

function roleLabel(role) {
    return String(role || '')
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MenuRow({ title, onPress }) {
    return (
        <Pressable onPress={onPress} style={styles.menu}>
            <Text style={styles.menuText}>{title}</Text>
            <Text style={styles.chevron}>›</Text>
        </Pressable>
    );
}

const SUPPORT_LINKS = [
    ['footer.helpCentre', 'faq'],
    ['footer.contactUs', 'contact'],
    ['footer.cancellation', 'cancel'],
];

const COMPANY_LINKS = [
    ['footer.about', 'about'],
    ['footer.blog', 'blogs'],
    ['footer.privacy', 'privacy'],
    ['footer.terms', 'terms'],
];

function AccountLinks({ navigation, t }) {
    const openPage = (page) => navigation.navigate('Content', { page });
    return (
        <View>
            <Text style={styles.sectionLabel}>{t('footer.support')}</Text>
            {SUPPORT_LINKS.map(([labelKey, page]) => (
                <MenuRow key={page} title={t(labelKey)} onPress={() => openPage(page)} />
            ))}
            <Text style={styles.sectionLabel}>{t('footer.company')}</Text>
            {COMPANY_LINKS.map(([labelKey, page]) => (
                <MenuRow key={page} title={t(labelKey)} onPress={() => openPage(page)} />
            ))}
            <View style={styles.credit}>
                <Text style={styles.creditLine}>{t('footer.ventureOf')} SM Enterprise</Text>
                <Text style={styles.creditLine}>{t('footer.poweredBy')} Celeris Venture Systems Pvt. Ltd.</Text>
                <Text style={styles.creditCopy}>{t('footer.copyright')}</Text>
            </View>
        </View>
    );
}

export default function AccountScreen() {
    const { t } = useTranslation();
    const { user, logout, isVendor, saveProfile } = useAuth();
    const confirm = useConfirm();
    const navigation = useNavigation();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [saving, setSaving] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

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
        return (
            <Screen style={styles.screen}>
                <ScrollView contentContainerStyle={styles.inner}>
                    <Text style={styles.pageTitle}>{t('nav.account')}</Text>
                    <Muted>{t('auth.welcome')}</Muted>
                    <Button title={t('auth.signIn')} onPress={() => navigation.navigate('Auth')} />
                    <Button title={t('auth.register')} variant="outline" onPress={() => navigation.navigate('Auth')} />
                    <AccountLinks navigation={navigation} t={t} />
                </ScrollView>
            </Screen>
        );
    }

    return (
        <Screen style={styles.screen}>
            <ScrollView contentContainerStyle={styles.page}>
                <View style={styles.inner}>
                <Text style={styles.pageTitle}>{t('nav.account')}</Text>
                <Card>
                    <Text style={styles.cardTitle}>{t('account.profile')}</Text>
                    <Field label={t('auth.name')} value={name} onChangeText={setName} autoCapitalize="words" />
                    <Field label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                    <Field label={t('auth.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                    {user.role ? (
                        <View style={styles.role}>
                            <Text style={styles.roleText}>{roleLabel(user.role)}</Text>
                        </View>
                    ) : null}
                    <Button title={t('account.save')} onPress={onSave} loading={saving} />
                </Card>
                <Card>
                    <Text style={styles.cardTitle}>{t('account.language')}</Text>
                    <View style={styles.langRow}>
                        {[['en', 'English'], ['mr', 'मराठी']].map(([code, label]) => {
                            const on = i18n.language?.startsWith(code);
                            return (
                                <Pressable key={code} onPress={() => { i18n.changeLanguage(code); if (typeof localStorage !== 'undefined') localStorage.setItem('lang', code); }} style={[styles.lang, on && styles.langOn]}>
                                    <Text style={[styles.langText, on && styles.langTextOn]}>{label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </Card>
                <MenuRow title={t('account.favorites')} onPress={() => navigation.navigate(isVendor ? 'Favorites' : 'Saved')} />
                {isVendor ? <MenuRow title={t('nav.overview')} onPress={() => navigation.navigate('Overview')} /> : null}
                <Button title={t('auth.logout')} variant="danger" loading={signingOut} onPress={() => {
                    confirm({
                        title: t('auth.logout'),
                        message: t('account.signOutAsk'),
                        cancelText: t('common.cancel'),
                        confirmText: t('auth.logout'),
                        destructive: true,
                        loadingText: t('account.signingOut'),
                        loadingMs: 1200,
                        onConfirm: async () => {
                            setSigningOut(true);
                            try {
                                await logout();
                            }
                            finally {
                                setSigningOut(false);
                            }
                        },
                    });
                }} />
                <AccountLinks navigation={navigation} t={t} />
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { padding: 0 },
    page: { paddingBottom: 0 },
    inner: { padding: 16, paddingBottom: 0 },
    pageTitle: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        color: COLORS.text,
        letterSpacing: -0.4,
        marginBottom: 12,
    },
    cardTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text, marginBottom: 12 },
    role: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.primarySoft,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginTop: 2,
    },
    roleText: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.primary, letterSpacing: 0.2 },
    langRow: { flexDirection: 'row', gap: 8 },
    lang: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: '#fff',
    },
    langOn: { backgroundColor: COLORS.action, borderColor: COLORS.action },
    langText: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.primary },
    langTextOn: { color: '#fff' },
    menu: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
    },
    menuText: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.primary },
    chevron: { fontFamily: FONTS.semibold, fontSize: 22, color: COLORS.muted },
    sectionLabel: {
        fontFamily: FONTS.semibold,
        fontSize: 13,
        color: COLORS.muted,
        marginTop: 8,
        marginBottom: 8,
    },
    credit: { alignItems: 'center', paddingTop: 8, paddingBottom: 24 },
    creditLine: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.muted, textAlign: 'center', lineHeight: 18 },
    creditCopy: { fontFamily: FONTS.regular, fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 8 },
});
