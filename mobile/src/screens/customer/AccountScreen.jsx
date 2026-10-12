import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import i18n from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../components/confirm';
import { Button, Card, Field, Muted, Screen } from '../../components/ui';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';

function roleLabel(role) {
    return String(role || '')
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MenuRow({ title, onPress, danger, last, disabled }) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={[styles.menu, !last && styles.menuBorder, disabled && styles.menuDisabled]}
        >
            <Text style={[styles.menuText, danger && styles.menuDanger]}>{title}</Text>
            {danger ? null : <Text style={styles.chevron}>›</Text>}
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

export default function AccountScreen() {
    const { t } = useTranslation();
    const { user, logout, isVendor, saveProfile } = useAuth();
    const confirm = useConfirm();
    const navigation = useNavigation();
    const route = useRoute();
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

    const signOut = () => {
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
    };

    const openPage = (page) => navigation.navigate('Content', { page });
    const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();
    const marathi = i18n.language?.startsWith('mr');
    const nextLanguage = marathi ? 'en' : 'mr';
    const guestTitle = route.name === 'Bookings'
        ? t('nav.bookings')
        : route.name === 'Saved'
            ? t('nav.savedListings')
            : t('nav.profile');

    const rows = [
        user ? {
            key: 'saved',
            title: t('account.favorites'),
            onPress: () => navigation.navigate(isVendor ? 'Favorites' : 'Saved'),
        } : null,
        user && isVendor ? {
            key: 'overview',
            title: t('nav.overview'),
            onPress: () => navigation.navigate('Overview'),
        } : null,
        ...SUPPORT_LINKS.map(([labelKey, page]) => ({
            key: page,
            title: t(labelKey),
            onPress: () => openPage(page),
        })),
        ...COMPANY_LINKS.map(([labelKey, page]) => ({
            key: page,
            title: t(labelKey),
            onPress: () => openPage(page),
        })),
    ].filter(Boolean);

    return (
        <Screen style={{ padding: 0 }}>
            <ScrollView contentContainerStyle={styles.page}>
                <View style={styles.band}>
                    <View style={styles.bandRow}>
                        <Text style={styles.pageTitle}>{user ? t('nav.profile') : guestTitle}</Text>
                        {user?.role ? (
                            <View style={styles.rolePill}>
                                <Text style={styles.rolePillText}>{roleLabel(user.role)}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {user ? (
                    <>
                        <Card style={styles.block}>
                            <View style={styles.identity}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{initial}</Text>
                                </View>
                                <View style={styles.identityText}>
                                    <Text style={styles.identityName} numberOfLines={1}>{user.name}</Text>
                                    <Text style={styles.identityMeta} numberOfLines={1}>{user.email}</Text>
                                    {user.phone ? <Text style={styles.identityMeta} numberOfLines={1}>{user.phone}</Text> : null}
                                </View>
                            </View>
                            <Field label={t('auth.name')} value={name} onChangeText={setName} autoCapitalize="words" />
                            <Field label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                            <Field label={t('auth.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                            <Button title={t('account.save')} onPress={onSave} loading={saving} style={styles.saveBtn} />
                        </Card>
                        <Card style={styles.langCard}>
                            <View style={styles.langRow}>
                                <Text style={styles.langLabel} numberOfLines={1}>
                                    {t('account.language')} · {marathi ? 'मराठी' : 'English'}
                                </Text>
                                <Pressable
                                    style={[styles.langPill, marathi && styles.langPillOn]}
                                    onPress={() => {
                                        i18n.changeLanguage(nextLanguage);
                                        if (typeof localStorage !== 'undefined') localStorage.setItem('lang', nextLanguage);
                                    }}
                                >
                                    <Text style={[styles.langPillText, marathi && styles.langPillTextOn]}>मराठी</Text>
                                </Pressable>
                            </View>
                        </Card>
                    </>
                ) : (
                    <View style={styles.guest}>
                        <Muted>{t('auth.welcome')}</Muted>
                        <Button title={t('auth.signIn')} onPress={() => navigation.navigate('Auth')} />
                        <Button title={t('auth.register')} variant="outline" onPress={() => navigation.navigate('Auth')} />
                    </View>
                )}

                <View style={styles.listCard}>
                    {rows.map((row, index) => (
                        <MenuRow
                            key={row.key}
                            title={row.title}
                            onPress={row.onPress}
                            last={!user && index === rows.length - 1}
                        />
                    ))}
                    {user ? (
                        <MenuRow
                            title={signingOut ? t('account.signingOut') : t('auth.logout')}
                            onPress={signOut}
                            danger
                            last
                            disabled={signingOut}
                        />
                    ) : null}
                </View>

                <View style={styles.credit}>
                    <Text style={styles.creditLine}>{t('footer.ventureOf')} SM Enterprise</Text>
                    <Text style={styles.creditLine}>{t('footer.poweredBy')} Celeris Venture Systems Pvt. Ltd.</Text>
                    <Text style={styles.creditCopy}>{t('footer.copyright')}</Text>
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    page: { paddingBottom: 8 },
    band: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: COLORS.primary,
    },
    bandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    pageTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 26, color: '#fff', letterSpacing: -0.4 },
    rolePill: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    rolePillText: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.primary },
    block: { marginHorizontal: 16, marginTop: 16 },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontFamily: FONTS.bold, fontSize: 22, color: '#fff' },
    identityText: { flex: 1 },
    identityName: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.text },
    identityMeta: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginTop: 2 },
    saveBtn: {
        backgroundColor: COLORS.primary,
        minHeight: 44,
        borderRadius: RADIUS.button,
        marginTop: 4,
        elevation: 0,
        shadowOpacity: 0,
        ...Platform.select({ web: { boxShadow: 'none' }, default: {} }),
    },
    langCard: { marginHorizontal: 16, paddingVertical: 12 },
    langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    langLabel: { flex: 1, fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text },
    langPill: {
        backgroundColor: '#fff',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    langPillOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    langPillText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.primary },
    langPillTextOn: { color: '#fff' },
    guest: { marginHorizontal: 16, marginTop: 16 },
    listCard: {
        marginHorizontal: 16,
        marginTop: 4,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    menu: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    menuBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    menuDisabled: { opacity: 0.6 },
    menuText: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text },
    menuDanger: { color: COLORS.danger },
    chevron: { fontFamily: FONTS.semibold, fontSize: 22, color: COLORS.muted },
    credit: { alignItems: 'center', paddingTop: 16, paddingBottom: 24, paddingHorizontal: 16 },
    creditLine: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.muted, textAlign: 'center', lineHeight: 18 },
    creditCopy: { fontFamily: FONTS.regular, fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 8 },
});
