import React, { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BadgeCheck, Building2, Calendar, CalendarDays, Car, CreditCard, FileText, Headphones, Heart, Home, Languages, LayoutDashboard, Megaphone, Menu, Phone, Shield, ShoppingBag, Star, Tag, Tent, Trees, User, Wallet, X } from './icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS } from '../../constants/theme';
import { AVAILABILITY_ROLES } from '../../utils/vendorAvailability';

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

const SHORTCUTS = [
    { key: 'bookings', labelKey: 'nav.myBookings', name: 'Bookings', Icon: Calendar },
    { key: 'profile', labelKey: 'nav.profile', name: 'Account', Icon: User },
    { key: 'saved', labelKey: 'nav.wishlist', name: 'Saved', Icon: Heart },
];

const DRAWER_LINKS = [
    { labelKey: 'footer.helpCentre', page: 'faq', Icon: Headphones },
    { labelKey: 'footer.contactUs', page: 'contact', Icon: Phone },
    { labelKey: 'footer.cancellation', page: 'cancel', Icon: FileText },
    { labelKey: 'footer.about', page: 'about', Icon: BadgeCheck },
    { labelKey: 'footer.blog', page: 'blogs', Icon: Megaphone },
    { labelKey: 'footer.privacy', page: 'privacy', Icon: Shield },
    { labelKey: 'footer.terms', page: 'terms', Icon: FileText },
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
    const { user, isVendor } = useAuth();
    const [open, setOpen] = useState(false);

    const openScreen = (name, params) => {
        setOpen(false);
        navigation.navigate(name, params);
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
            <View style={styles.bar}>
            <View style={styles.row}>
                <Pressable style={styles.sideBtn} onPress={() => setOpen((value) => !value)} accessibilityLabel="Menu">
                    {open ? <X size={22} color="#475569" strokeWidth={2} /> : <Menu size={22} color="#475569" strokeWidth={2} />}
                </Pressable>
                <View style={styles.logoSlot}>
                    <Pressable onPress={() => navigation.navigate(isVendor ? 'Overview' : 'HomeTab')} accessibilityLabel={isVendor ? t('nav.overview') : t('nav.home')}>
                        <Image source={logo} style={styles.logo} resizeMode="contain" />
                    </Pressable>
                </View>
                {user ? (
                    <Pressable
                        style={styles.sideBtn}
                        onPress={() => navigation.navigate('Account')}
                        accessibilityLabel={t('nav.account')}
                    >
                        <User size={22} color="#475569" strokeWidth={2} />
                    </Pressable>
                ) : (
                    <Pressable
                        style={styles.signInBtn}
                        onPress={() => navigation.navigate('Auth')}
                        accessibilityLabel={t('auth.signIn')}
                    >
                        <Text style={styles.signInText}>{t('auth.signIn')}</Text>
                    </Pressable>
                )}
            </View>
            </View>
            {open ? (
                <MenuPanel>
                    {isVendor ? (
                        <>
                            <View style={styles.shortcutRow}>
                                {[
                                    { title: t('nav.overview'), name: 'Overview', Icon: LayoutDashboard },
                                    { title: t('nav.bookings'), name: 'Bookings', Icon: Calendar },
                                    { title: t('nav.wallet'), name: 'Wallet', Icon: Wallet },
                                ].map((item) => (
                                    <Pressable key={item.name} style={styles.shortcut} onPress={() => openVendorItem(item.name)}>
                                        <item.Icon size={22} color={COLORS.primary} strokeWidth={2} />
                                        <Text style={styles.shortcutText}>{item.title}</Text>
                                    </Pressable>
                                ))}
                            </View>
                            <View style={styles.linkCard}>
                                {vendorMenu.filter((item) => !['Overview', 'Bookings', 'Wallet'].includes(item.name)).map((item, index, rows) => {
                                    const Icon = item.icon;
                                    return (
                                        <Pressable
                                            key={item.name}
                                            style={[styles.linkRow, index < rows.length - 1 && styles.linkRowBorder]}
                                            onPress={() => openVendorItem(item.name)}
                                        >
                                            <Icon size={18} color={COLORS.primary} strokeWidth={2} />
                                            <Text style={styles.linkText}>{item.title}</Text>
                                            <Text style={styles.chevron}>›</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.shortcutRow}>
                                {SHORTCUTS.map((item) => (
                                    <Pressable key={item.key} style={styles.shortcut} onPress={() => openScreen(item.name)}>
                                        <item.Icon size={22} color={COLORS.primary} strokeWidth={2} />
                                        <Text style={styles.shortcutText}>{t(item.labelKey)}</Text>
                                    </Pressable>
                                ))}
                            </View>
                            <View style={styles.linkCard}>
                                {DRAWER_LINKS.map((item, index) => (
                                    <Pressable
                                        key={item.page}
                                        style={[styles.linkRow, index < DRAWER_LINKS.length - 1 && styles.linkRowBorder]}
                                        onPress={() => openScreen('Content', { page: item.page })}
                                    >
                                        <item.Icon size={18} color={COLORS.primary} strokeWidth={2} />
                                        <Text style={styles.linkText}>{t(item.labelKey)}</Text>
                                        <Text style={styles.chevron}>›</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </>
                    )}
                </MenuPanel>
            ) : (
                <View style={styles.body}>{children}</View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    shell: { flex: 1, backgroundColor: COLORS.bg },
    body: { flex: 1 },
    bar: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(226,232,240,0.8)',
        zIndex: 20,
    },
    row: {
        position: 'relative',
        minHeight: 64,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sideBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
    signInBtn: {
        minHeight: 36,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signInText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.primary },
    logoSlot: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'box-none',
    },
    logo: { width: 148, height: 42 },
    menuFill: {
        flex: 1,
        backgroundColor: COLORS.bg,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        ...(Platform.OS === 'web' ? { overflowY: 'auto' } : null),
    },
    menu: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexGrow: 1,
        backgroundColor: COLORS.bg,
    },
    shortcutRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    shortcut: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 96,
        paddingHorizontal: 6,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    shortcutText: {
        marginTop: 8,
        fontFamily: FONTS.semibold,
        fontSize: 12,
        lineHeight: 16,
        color: COLORS.primary,
        textAlign: 'center',
    },
    linkCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    linkRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    linkText: { flex: 1, fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.primary },
    chevron: { fontFamily: FONTS.semibold, fontSize: 22, color: '#94A3B8' },
});
