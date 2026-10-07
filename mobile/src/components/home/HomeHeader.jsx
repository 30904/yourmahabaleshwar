import React, { useState } from 'react';
import { Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Building2, Calendar, CalendarDays, Car, CreditCard, FileText, Home, Languages, LayoutDashboard, Megaphone, Menu, Phone, ShoppingBag, Star, Tag, Tent, Trees, Wallet, X } from './icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS } from '../../constants/theme';
import { AVAILABILITY_ROLES } from '../../utils/vendorAvailability';
import { openCategory } from './homeNav';

const LISTING_LABEL = {
    HOTEL_VENDOR: 'vendor.navHotels',
    HOMESTAY_VENDOR: 'vendor.navHomestays',
    TENT_OPERATOR: 'vendor.navTents',
    GUIDE: 'vendor.navGuides',
    TAXI_OPERATOR: 'vendor.navTaxi',
    DRIVER: 'vendor.navDriver',
    HORSE_OPERATOR: 'vendor.navHorses',
    PRODUCT_VENDOR: 'vendor.navProducts',
};
const STAY_SUBSCRIPTION = ['HOTEL_VENDOR', 'HOMESTAY_VENDOR'];
const SERVICE_SUBSCRIPTION = ['GUIDE', 'TAXI_OPERATOR', 'DRIVER', 'TENT_OPERATOR', 'HORSE_OPERATOR'];
const AD_ROLES = ['HOTEL_VENDOR', 'HOMESTAY_VENDOR', 'TENT_OPERATOR'];
const LISTING_ICON = {
    HOTEL_VENDOR: Building2,
    HOMESTAY_VENDOR: Home,
    TENT_OPERATOR: Tent,
    GUIDE: Languages,
    TAXI_OPERATOR: Car,
    DRIVER: Car,
    HORSE_OPERATOR: Trees,
    PRODUCT_VENDOR: ShoppingBag,
};

const logo = require('../../../assets/logo.png');

const MENU = [
    { key: 'hotels', labelKey: 'nav.stays' },
    { key: 'resorts', labelKey: 'nav.resorts' },
    { key: 'homestays', labelKey: 'nav.homestays' },
    { key: 'tents', labelKey: 'nav.tents' },
    { key: 'guides', labelKey: 'nav.guides' },
    { key: 'taxi', labelKey: 'nav.taxi' },
    { key: 'drivers', labelKey: 'nav.drivers' },
    { key: 'horses', labelKey: 'nav.horses' },
];

const SHOP = [
    { labelKey: 'nav.strawberries' },
    { labelKey: 'nav.mapro' },
    { labelKey: 'nav.combos' },
];

const PHONES = [
    { label: '+91 9987 6567 92', href: 'tel:+919987656792' },
    { label: '+91 9987 6866 92', href: 'tel:+919987686692' },
];

function MenuPanel({ children }) {
    return (
        <ScrollView
            style={styles.menuFill}
            contentContainerStyle={styles.menu}
            showsVerticalScrollIndicator
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
        >
            {children}
        </ScrollView>
    );
}

export default function HomeHeader({ navigation, children }) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { user, isVendor } = useAuth();
    const [open, setOpen] = useState(false);
    const [enquire, setEnquire] = useState(false);

    const go = (key) => {
        setOpen(false);
        openCategory(navigation, t, key);
    };
    const openVendorItem = (name) => {
        setOpen(false);
        navigation.navigate(name);
    };
    const role = user?.role;
    const vendorMenu = !isVendor ? [] : [
        { title: t('nav.overview'), name: 'Overview', icon: LayoutDashboard },
        { title: t(LISTING_LABEL[role] || 'vendor.listings'), name: 'VendorListings', icon: LISTING_ICON[role] || Building2 },
        { title: t('vendor.pricing'), name: 'VendorPricing', icon: Tag },
        { title: t('nav.bookings'), name: 'Bookings', icon: Calendar },
        AVAILABILITY_ROLES.includes(role) ? { title: t('vendor.availability'), name: 'VendorAvailability', icon: CalendarDays } : null,
        STAY_SUBSCRIPTION.includes(role) || SERVICE_SUBSCRIPTION.includes(role)
            ? { title: STAY_SUBSCRIPTION.includes(role) ? t('staySubscription.nav') : t('serviceSubscription.title'), name: 'VendorSubscription', icon: CreditCard } : null,
        AD_ROLES.includes(role) ? { title: t('vendorAds.nav'), name: 'VendorAds', icon: Megaphone } : null,
        { title: t('vendor.reviews'), name: 'VendorReviews', icon: Star },
        { title: t('nav.wallet'), name: 'Wallet', icon: Wallet },
        { title: t('nav.kyc'), name: 'VendorKyc', icon: FileText },
    ].filter(Boolean);

    return (
        <View style={styles.shell}>
            <View style={[styles.bar, { paddingTop: insets.top }]}>
            <View style={styles.row}>
                <Pressable onPress={() => navigation.navigate('HomeTab')} accessibilityLabel="Go to homepage">
                    <Image source={logo} style={styles.logo} resizeMode="contain" />
                </Pressable>
                <View style={styles.actions}>
                    {user ? (
                        <Pressable style={styles.signIn} onPress={() => navigation.navigate('Account')}>
                            <Text style={styles.signInText} numberOfLines={1}>{user.name?.split(' ')[0] || t('nav.account')}</Text>
                        </Pressable>
                    ) : (
                        <Pressable style={styles.signIn} onPress={() => navigation.navigate('Auth')}>
                            <Text style={styles.signInText}>{t('auth.signIn')}</Text>
                        </Pressable>
                    )}
                    <Pressable style={styles.menuBtn} onPress={() => setOpen((value) => !value)} accessibilityLabel="Menu">
                        {open ? <X size={22} color="#475569" strokeWidth={2} /> : <Menu size={22} color="#475569" strokeWidth={2} />}
                    </Pressable>
                </View>
            </View>
            </View>
            {open ? (
                <MenuPanel>
                    {isVendor ? vendorMenu.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Pressable key={item.name} style={styles.menuItem} onPress={() => openVendorItem(item.name)}>
                                <Icon size={18} color="#64748B" strokeWidth={2} />
                                <Text style={styles.menuText}>{item.title}</Text>
                            </Pressable>
                        );
                    }) : (
                        <>
                            {MENU.map((item) => (
                                <Pressable key={item.key} style={styles.menuItem} onPress={() => go(item.key)}>
                                    <Text style={styles.menuText}>{t(item.labelKey)}</Text>
                                </Pressable>
                            ))}
                            <Text style={styles.shopLabel}>{t('nav.shop')}</Text>
                            {SHOP.map((item) => (
                                <Pressable
                                    key={item.labelKey}
                                    style={styles.menuItem}
                                    onPress={() => {
                                        setOpen(false);
                                        setEnquire(true);
                                    }}
                                >
                                    <Text style={styles.menuText}>
                                        {t(item.labelKey)} <Text style={styles.soon}>{t('nav.comingSoon')}</Text>
                                    </Text>
                                </Pressable>
                            ))}
                        </>
                    )}
                </MenuPanel>
            ) : (
                <View style={styles.body}>{children}</View>
            )}
            <Modal visible={enquire} transparent animationType="fade" onRequestClose={() => setEnquire(false)}>
                <Pressable style={styles.backdrop} onPress={() => setEnquire(false)}>
                    <Pressable style={styles.dialog} onPress={() => {}}>
                        <View style={styles.dialogHead}>
                            <Text style={styles.dialogTitle}>{t('nav.enquireAboutProducts')}</Text>
                            <Pressable onPress={() => setEnquire(false)} accessibilityLabel={t('nav.closeEnquire')}>
                                <X size={18} color="#94A3B8" strokeWidth={2} />
                            </Pressable>
                        </View>
                        <Text style={styles.dialogHint}>{t('nav.enquireShopHint')}</Text>
                        {PHONES.map((phone) => (
                            <Pressable key={phone.href} style={styles.phone} onPress={() => Linking.openURL(phone.href)}>
                                <Phone size={18} color={COLORS.primary} strokeWidth={2} />
                                <Text style={styles.phoneText}>{phone.label}</Text>
                            </Pressable>
                        ))}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    shell: { flex: 1, backgroundColor: '#fff' },
    body: { flex: 1 },
    bar: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(226,232,240,0.8)',
        zIndex: 20,
    },
    row: {
        minHeight: 64,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    logo: { width: 150, height: 44 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    signIn: {
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#fff',
        maxWidth: 120,
    },
    signInText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.primary },
    menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
    menuFill: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        ...(Platform.OS === 'web' ? { overflowY: 'auto' } : null),
    },
    menu: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexGrow: 1,
        backgroundColor: '#fff',
    },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 2 },
    menuText: { fontFamily: FONTS.medium, fontSize: 14, color: '#334155' },
    shopLabel: {
        marginTop: 12,
        marginBottom: 4,
        paddingHorizontal: 12,
        fontFamily: FONTS.semibold,
        fontSize: 12,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: '#94A3B8',
    },
    soon: { color: '#EF4444' },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(15,23,42,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    dialog: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 24 },
    dialogHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    dialogTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 18, color: '#0F172A' },
    dialogHint: { fontFamily: FONTS.regular, fontSize: 14, color: '#475569', marginTop: 4, marginBottom: 16 },
    phone: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
    },
    phoneText: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.primary },
});
