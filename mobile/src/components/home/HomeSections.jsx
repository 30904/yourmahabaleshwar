import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, Car, CarTaxiFront, Clock, CreditCard, Gift, Headphones, Home, Hotel, Languages, Shield, Star, Tent, Trees, Users } from './icons';
import { useTranslation } from 'react-i18next';
import { listCatalog } from '../../api/endpoints';
import { Button } from '../ui';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import ListingCard from '../ListingCard';
import SectionHeader from './SectionHeader';
import { openCategory } from './homeNav';

const STRIP = [
    { key: 'hotels', labelKey: 'home.categories.hotels', countKey: 'home.categories.hotelsCount', Icon: Hotel, tint: '#EFF6FF', ink: '#003580' },
    { key: 'resorts', labelKey: 'home.categories.resorts', countKey: 'home.categories.resortsCount', Icon: Star, tint: '#FFFBEB', ink: '#B45309' },
    { key: 'homestays', labelKey: 'home.categories.homestays', countKey: 'home.categories.homestaysCount', Icon: Home, tint: '#FFF1F2', ink: '#BE123C' },
    { key: 'tents', labelKey: 'home.categories.tents', countKey: 'home.categories.tentsCount', Icon: Tent, tint: '#ECFDF5', ink: '#047857' },
    { key: 'guides', labelKey: 'home.categories.guides', countKey: 'home.categories.guidesCount', Icon: Users, tint: '#F5F3FF', ink: '#6D28D9' },
    { key: 'drivers', labelKey: 'home.categories.driver', countKey: 'home.categories.driverCount', Icon: Car, tint: '#F1F5F9', ink: '#334155' },
    { key: 'taxi', labelKey: 'home.categories.taxi', countKey: 'home.categories.taxiCount', Icon: CarTaxiFront, tint: '#F0FDFA', ink: '#0F766E' },
    { key: 'horses', labelKey: 'home.categories.horses', countKey: 'home.categories.horsesCount', Icon: Trees, tint: '#FFF7ED', ink: '#C2410C' },
];

const DEALS = [
    { id: 'monsoon', colors: ['#1D4ED8', '#1E3A8A'] },
    { id: 'weekend', colors: ['#059669', '#0F766E'] },
    { id: 'earlyBird', colors: ['#D97706', '#C2410C'] },
];

const TABS = [
    { id: 'hotels', labelKey: 'home.propertyTabs.topHotels', category: 'hotels', path: '/hotels', type: 'HOTEL', params: { type: 'HOTEL', limit: 3, featured: 'true' } },
    { id: 'resorts', labelKey: 'home.propertyTabs.luxuryResorts', category: 'resorts', path: '/hotels', type: 'RESORT', params: { type: 'RESORT', limit: 3, featured: 'true' } },
    { id: 'tents', labelKey: 'home.propertyTabs.uniqueStays', category: 'tents', path: '/tents', type: 'TENT', params: { limit: 3 } },
];

const DESTINATIONS = [
    { name: 'Mahabaleshwar', countKey: 'home.destinations.mahabaleshwarCount', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' },
    { name: 'Panchgani', countKey: 'home.destinations.panchganiCount', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80' },
    { name: 'Tapola', countKey: 'home.destinations.tapolaCount', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80' },
    { name: 'Pratapgad', countKey: 'home.destinations.pratapgadCount', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' },
];

const TRUST = [
    { Icon: Shield, titleKey: 'trust.secureTitle', descKey: 'trust.secureDesc' },
    { Icon: BadgeCheck, titleKey: 'trust.verifiedTitle', descKey: 'trust.verifiedDesc' },
    { Icon: Headphones, titleKey: 'trust.supportTitle', descKey: 'trust.supportDesc' },
    { Icon: CreditCard, titleKey: 'trust.paymentTitle', descKey: 'trust.paymentDesc' },
];

function catalogItems(data) {
    if (Array.isArray(data)) return data;
    return data?.items || data?.hotels || data?.tents || [];
}

export function HomeCategoryStrip({ navigation }) {
    const { t } = useTranslation();
    return (
        <View style={styles.stripWrap}>
            <View style={styles.grid}>
                {STRIP.map((item) => (
                    <Pressable key={item.key} style={styles.categoryCard} onPress={() => openCategory(navigation, t, item.key)}>
                        <View style={[styles.categoryIcon, { backgroundColor: item.tint }]}>
                            <item.Icon size={22} color={item.ink} strokeWidth={2} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.categoryName}>{t(item.labelKey)}</Text>
                            <Text style={styles.categoryCount}>{t(item.countKey)}</Text>
                        </View>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

export function HomeDeals({ navigation }) {
    const { t } = useTranslation();
    return (
        <View style={styles.section}>
            <SectionHeader
                eyebrow={t('home.deals.eyebrow')}
                title={t('home.deals.title')}
                subtitle={t('home.deals.subtitle')}
                linkLabel={t('home.deals.seeAll')}
                onPress={() => openCategory(navigation, t, 'hotels')}
            />
            {DEALS.map((deal) => (
                <Pressable key={deal.id} style={[styles.deal, { backgroundColor: deal.colors[0] }]} onPress={() => openCategory(navigation, t, 'hotels')}>
                    <Text style={styles.dealSpark}>✦</Text>
                    <Text style={styles.dealDiscount}>{t(`home.deals.${deal.id}.discount`)}</Text>
                    <Text style={styles.dealTitle}>{t(`home.deals.${deal.id}.title`)}</Text>
                    <Text style={styles.dealDesc}>{t(`home.deals.${deal.id}.desc`)}</Text>
                    <Text style={styles.dealCta}>{t('home.deals.bookNow')} →</Text>
                </Pressable>
            ))}
        </View>
    );
}

export function HomePropertyTabs({ navigation }) {
    const { t } = useTranslation();
    const [active, setActive] = useState('hotels');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const tab = TABS.find((item) => item.id === active) || TABS[0];

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setItems([]);
        listCatalog(tab.path, tab.params)
            .then((data) => {
                if (alive) setItems(catalogItems(data).slice(0, 3));
            })
            .catch(() => {
                if (alive) setItems([]);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [tab]);

    return (
        <View style={styles.section}>
            <SectionHeader
                eyebrow={t('home.propertyTabs.eyebrow')}
                title={t('home.propertyTabs.title')}
                subtitle={t('home.propertyTabs.subtitle')}
                linkLabel={t('common.viewAll')}
                onPress={() => openCategory(navigation, t, tab.category)}
            />
            <View style={styles.tabs}>
                {TABS.map((item) => {
                    const on = item.id === active;
                    return (
                        <Pressable key={item.id} onPress={() => setActive(item.id)} style={[styles.chip, on && styles.chipOn]}>
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>{t(item.labelKey)}</Text>
                        </Pressable>
                    );
                })}
            </View>
            {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} /> : null}
            {!loading && !items.length ? <Text style={styles.empty}>{t('common.empty')}</Text> : null}
            <View style={styles.propertyList}>
                {items.map((item) => (
                    <ListingCard
                        key={item._id || item.slug}
                        item={item}
                        type={tab.type}
                        onPress={() => navigation.navigate('ListingDetail', { path: tab.path, slug: item.slug, type: tab.type })}
                    />
                ))}
            </View>
        </View>
    );
}

export function HomePromo({ navigation }) {
    const { t } = useTranslation();
    return (
        <View style={styles.section}>
            <LinearGradient
                colors={['#00224F', '#003580', '#004A9E']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.promo}
            >
                <View style={styles.promoRow}>
                    <View style={styles.promoBadge}>
                        <Gift size={24} color="#FCD34D" strokeWidth={2} />
                    </View>
                    <View style={styles.promoCopy}>
                        <Text style={styles.promoEyebrow}>{t('home.promo.eyebrow')}</Text>
                        <Text style={styles.promoTitle}>{t('home.promo.title')}</Text>
                        <Text style={styles.promoSub}>{t('home.promo.subtitle')}</Text>
                    </View>
                </View>
                <Pressable style={styles.promoBtn} onPress={() => navigation.navigate('Auth', { screen: 'VendorRegister' })}>
                    <Text style={styles.promoBtnText}>{t('home.promo.cta')}</Text>
                </Pressable>
            </LinearGradient>
        </View>
    );
}

export function HomeDestinations({ navigation }) {
    const { t } = useTranslation();
    return (
        <View style={[styles.section, styles.destinations]}>
            <SectionHeader
                eyebrow={t('home.destinations.eyebrow')}
                title={t('home.destinations.title')}
                subtitle={t('home.destinations.subtitle')}
                linkLabel={t('common.viewAll')}
                onPress={() => openCategory(navigation, t, 'hotels')}
            />
            <View style={styles.grid}>
                {DESTINATIONS.map((place) => (
                    <Pressable key={place.name} style={styles.destination} onPress={() => openCategory(navigation, t, 'hotels')}>
                        <Image source={{ uri: place.image }} style={styles.destinationImage} />
                        <View style={styles.destinationShade} />
                        <View style={styles.destinationCopy}>
                            <Text style={styles.destinationName}>{place.name}</Text>
                            <Text style={styles.destinationCount}>{t(place.countKey)}</Text>
                        </View>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

export function HomeServices({ navigation }) {
    const { t } = useTranslation();
    return (
        <View style={styles.section}>
            <SectionHeader
                eyebrow={t('home.services.eyebrow')}
                title={t('home.services.title')}
                subtitle={t('home.services.subtitle')}
                linkLabel={t('common.viewAll')}
                onPress={() => openCategory(navigation, t, 'guides')}
            />
            <Pressable style={styles.service} onPress={() => openCategory(navigation, t, 'guides')}>
                <View style={[styles.serviceBand, { backgroundColor: '#6D28D9' }]}>
                    <Users size={40} color="rgba(255,255,255,0.9)" strokeWidth={1.75} />
                </View>
                <View style={styles.serviceBody}>
                    <Text style={styles.serviceTag}>{t('home.services.localGuide')}</Text>
                    <Text style={styles.serviceTitle}>{t('serviceBooking.guideTitle')}</Text>
                    <View style={styles.serviceMetaRow}>
                        <Languages size={14} color="#64748B" />
                        <Text style={styles.serviceMeta}>{t('serviceBooking.guideFeature1')}</Text>
                    </View>
                    <Text style={styles.serviceNote}>{t('serviceBooking.noVendorPick')}</Text>
                    <Text style={styles.see}>{t('serviceBooking.bookNow')} →</Text>
                </View>
            </Pressable>
            <Pressable style={styles.service} onPress={() => openCategory(navigation, t, 'taxi')}>
                <View style={[styles.serviceBand, { backgroundColor: COLORS.primary }]}>
                    <Car size={40} color="rgba(255,255,255,0.9)" strokeWidth={1.75} />
                </View>
                <View style={styles.serviceBody}>
                    <Text style={styles.serviceTag}>{t('home.services.taxiCab')}</Text>
                    <Text style={styles.serviceTitle}>{t('serviceBooking.taxiTitle')}</Text>
                    <View style={styles.serviceMetaRow}>
                        <Car size={14} color="#64748B" />
                        <Text style={styles.serviceMeta}>{t('serviceBooking.taxiFeature1')}</Text>
                    </View>
                    <View style={styles.serviceMetaRow}>
                        <Clock size={14} color="#475569" />
                        <Text style={styles.serviceNote}>{t('home.services.hourlyTrips')}</Text>
                    </View>
                    <Text style={styles.see}>{t('serviceBooking.bookNow')} →</Text>
                </View>
            </Pressable>
            <Button title={t('home.services.browseGuides')} variant="outline" onPress={() => openCategory(navigation, t, 'guides')} />
            <Button title={t('home.services.bookCab')} variant="outline" onPress={() => openCategory(navigation, t, 'taxi')} />
        </View>
    );
}

export function HomeWhyBook() {
    const { t } = useTranslation();
    return (
        <View style={[styles.section, styles.why]}>
            <SectionHeader
                eyebrow={t('home.whyBook.eyebrow')}
                title={t('home.whyBook.title')}
                subtitle={t('home.whyBook.subtitle')}
            />
            {TRUST.map((item) => (
                <View key={item.titleKey} style={styles.trust}>
                    <item.Icon size={28} color={COLORS.primary} strokeWidth={2} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.trustTitle}>{t(item.titleKey)}</Text>
                        <Text style={styles.trustDesc}>{t(item.descKey)}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    section: { paddingHorizontal: 16, paddingTop: 28 },
    stripWrap: { marginTop: -28, paddingHorizontal: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    categoryCard: {
        width: '48%',
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderRadius: RADIUS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
    },
    categoryIcon: { width: 48, height: 48, borderRadius: RADIUS.button, alignItems: 'center', justifyContent: 'center' },
    categoryName: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text },
    categoryCount: { fontFamily: FONTS.regular, fontSize: 12, color: '#64748B', marginTop: 2 },
    deal: { borderRadius: RADIUS.card, padding: 22, marginTop: 12, minHeight: 180 },
    dealSpark: { color: 'rgba(255,255,255,0.9)', fontSize: 18 },
    dealDiscount: { fontFamily: FONTS.extrabold, color: '#fff', fontSize: 28, marginTop: 8, letterSpacing: -0.4 },
    dealTitle: { fontFamily: FONTS.bold, color: '#fff', fontSize: 18 },
    dealDesc: { fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
    dealCta: { fontFamily: FONTS.bold, color: '#fff', fontSize: 14, marginTop: 18 },
    tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
    chip: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    chipOn: { borderColor: COLORS.action, backgroundColor: '#E8F4FC' },
    chipText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.body },
    chipTextOn: { fontFamily: FONTS.semibold, color: COLORS.action },
    propertyList: { marginTop: 16 },
    empty: { fontFamily: FONTS.regular, color: COLORS.muted, marginTop: 16 },
    see: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.primary, marginTop: 8 },
    promo: {
        borderRadius: RADIUS.button,
        padding: 24,
        overflow: 'hidden',
    },
    promoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
    promoBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    promoCopy: { flex: 1 },
    promoEyebrow: { fontFamily: FONTS.bold, color: '#FDE68A', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },
    promoTitle: { fontFamily: FONTS.bold, color: '#fff', fontSize: 18, marginTop: 2 },
    promoSub: { fontFamily: FONTS.regular, color: '#DBEAFE', fontSize: 14, lineHeight: 20, marginTop: 4 },
    promoBtn: {
        marginTop: 16,
        backgroundColor: '#FFB700',
        borderRadius: RADIUS.button,
        paddingHorizontal: 24,
        paddingVertical: 12,
        alignItems: 'center',
    },
    promoBtnText: { fontFamily: FONTS.bold, color: COLORS.primary, fontSize: 14 },
    destinations: { backgroundColor: '#fff', paddingBottom: 8, marginTop: 28 },
    destination: { width: '48%', marginBottom: 12, aspectRatio: 4 / 3, borderRadius: RADIUS.card, overflow: 'hidden' },
    destinationImage: { width: '100%', height: '100%' },
    destinationShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
    destinationCopy: { position: 'absolute', left: 12, right: 12, bottom: 12 },
    destinationName: { fontFamily: FONTS.bold, color: '#fff', fontSize: 16 },
    destinationCount: { fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 },
    service: {
        backgroundColor: '#fff',
        borderRadius: RADIUS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        marginTop: 12,
    },
    serviceBand: { height: 88, alignItems: 'center', justifyContent: 'center' },
    serviceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    serviceBody: { padding: 16 },
    serviceTag: {
        alignSelf: 'flex-start',
        fontFamily: FONTS.bold,
        fontSize: 11,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: COLORS.action,
        backgroundColor: '#E8F4FC',
        borderRadius: 999,
        overflow: 'hidden',
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    serviceTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text, marginTop: 8 },
    serviceMeta: { fontFamily: FONTS.regular, fontSize: 14, color: '#64748B', flex: 1 },
    serviceNote: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, flex: 1, lineHeight: 20 },
    why: { paddingBottom: 28 },
    trust: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#fff',
        borderRadius: RADIUS.button,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 14,
        marginTop: 12,
    },
    trustIcon: { fontSize: 22, color: COLORS.primary, width: 28 },
    trustTitle: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text },
    trustDesc: { fontFamily: FONTS.regular, fontSize: 12, color: '#64748B', marginTop: 2 },
});
