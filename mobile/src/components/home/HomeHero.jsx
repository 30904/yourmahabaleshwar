import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, MapPin, Search, ShieldCheck, Star, Users } from './icons';
import { useTranslation } from 'react-i18next';
import { fetchHomepageHeroAds, trackHomepageAdEvent } from '../../api/endpoints';
import { loadPublic } from '../../api/publicCache';
import { COLORS, FONTS } from '../../constants/theme';
import { formatCurrency } from '../../utils/format';
import { mediaUrl } from '../../utils/listing';
import { openAdListing, openCategory } from './homeNav';

const HERO_IMG = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85';

const GUEST_OPTIONS = [
    { value: '2-1', labelKey: 'search.guests2_1' },
    { value: '2-2', labelKey: 'search.guests2_2' },
    { value: '4-1', labelKey: 'search.guests4_1' },
    { value: '4-2', labelKey: 'search.guests4_2' },
];

const QUICK_LINKS = [
    { key: 'hotels', labelKey: 'home.quickHotels' },
    { key: 'resorts', labelKey: 'home.quickResorts' },
    { key: 'tents', labelKey: 'home.quickGlamping' },
];

function DateValue({ value, onChange }) {
    if (Platform.OS === 'web') {
        return React.createElement('input', {
            type: 'date',
            value,
            onChange: (event) => onChange(event.target.value),
            style: webFieldStyle,
        });
    }
    return (
        <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            style={styles.fieldValue}
        />
    );
}

function GuestValue({ value, onChange, options, t }) {
    if (Platform.OS === 'web') {
        return React.createElement(
            'select',
            {
                value,
                onChange: (event) => onChange(event.target.value),
                style: webFieldStyle,
            },
            options.map((option) => React.createElement('option', { key: option.value, value: option.value }, t(option.labelKey)))
        );
    }
    const current = options.find((option) => option.value === value) || options[0];
    return (
        <Pressable onPress={() => {
            const index = options.findIndex((option) => option.value === value);
            onChange(options[(index + 1) % options.length].value);
        }}>
            <Text style={styles.fieldValue}>{t(current.labelKey)}</Text>
        </Pressable>
    );
}

function adPlace(ad) {
    if (typeof ad.location === 'string') return ad.location;
    return ad.location?.city || 'Mahabaleshwar';
}

const webFieldStyle = {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    width: '100%',
    fontSize: 14,
    fontWeight: 500,
    color: '#0F172A',
    fontFamily: 'Inter, sans-serif',
};

export default function HomeHero({ navigation }) {
    const { t } = useTranslation();
    const [destination, setDestination] = useState('Mahabaleshwar');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guestValue, setGuestValue] = useState('2-1');
    const [ads, setAds] = useState([]);

    useEffect(() => {
        let alive = true;
        const job = loadPublic('ads:homepage-hero', fetchHomepageHeroAds, (items, meta) => {
            if (!alive) return;
            const next = (items || []).slice(0, 3);
            setAds(next);
            if (meta?.fresh) {
                next.forEach((ad) => {
                    if (ad.adId) trackHomepageAdEvent(ad.adId, 'impression');
                });
            }
        });
        job.catch(() => {
            if (alive) setAds([]);
        });
        return () => {
            alive = false;
            job.cancel();
        };
    }, []);

    const [adults, rooms] = guestValue.split('-').map(Number);

    const search = () => {
        const q = destination.trim();
        if (!q) return;
        navigation.navigate('Search', {
            q,
            checkIn: checkIn || undefined,
            checkOut: checkOut || undefined,
            adults,
            rooms,
        });
    };

    return (
        <View style={styles.hero} collapsable={false}>
            <View style={styles.backdrop} pointerEvents="none">
                <LinearGradient
                    colors={['#001a40', '#003580', '#004a9e']}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <Image source={{ uri: HERO_IMG }} style={styles.heroImage} resizeMode="cover" />
                <LinearGradient
                    colors={['rgba(0, 26, 64, 0.75)', 'rgba(0, 53, 128, 0.85)', 'rgba(0, 53, 128, 0.95)']}
                    locations={[0, 0.55, 1]}
                    style={StyleSheet.absoluteFill}
                />
            </View>
            <View style={styles.content} collapsable={false}>
                <View style={styles.pills}>
                    <View style={styles.pill}>
                        <ShieldCheck size={14} color="#fff" strokeWidth={2} />
                        <Text style={styles.pillText}>{t('home.badgeTrusted')}</Text>
                    </View>
                    <View style={[styles.pill, styles.pillGold]}>
                        <Star size={14} color="#FCD34D" fill="#FCD34D" strokeWidth={2} />
                        <Text style={styles.pillText}>{t('home.badgeLoved')}</Text>
                    </View>
                </View>
                <Text style={styles.title}>{t('home.headline')}</Text>
                <Text style={styles.subtitle}>{t('home.subhead')}</Text>
                <View style={styles.stats}>
                    {[
                        ['450+', 'home.statProperties'],
                        ['12k+', 'home.statReviews'],
                        ['4.8', 'home.statRating'],
                    ].map(([value, key]) => (
                        <View key={key}>
                            <Text style={styles.statValue}>{value}</Text>
                            <Text style={styles.statLabel}>{t(key)}</Text>
                        </View>
                    ))}
                </View>

                {ads.length ? (
                    <View style={styles.ads}>
                        <Text style={styles.adsLabel}>📣  {t('home.sponsoredListings')}</Text>
                        {ads.map((ad) => (
                            <Pressable
                                key={ad.adId || ad.slug}
                                style={styles.adCard}
                                onPress={() => {
                                    if (ad.adId) trackHomepageAdEvent(ad.adId, 'click');
                                    openAdListing(navigation, ad);
                                }}
                            >
                                {ad.image ? (
                                    <Image source={{ uri: mediaUrl(ad.image) }} style={styles.adImage} />
                                ) : (
                                    <View style={[styles.adImage, styles.adFallback]} />
                                )}
                                <View style={styles.adBody}>
                                    <Text style={styles.adType}>{ad.listingType}</Text>
                                    <Text style={styles.adName} numberOfLines={1}>{ad.name}</Text>
                                    <Text style={styles.adMeta} numberOfLines={1}>
                                        {adPlace(ad)}
                                        {ad.rating != null && Number.isFinite(Number(ad.rating)) ? `  ★ ${Number(ad.rating).toFixed(1)}` : ''}
                                    </Text>
                                    {ad.priceFrom != null ? (
                                        <Text style={styles.adPrice}>{t('home.fromPrice', { price: formatCurrency(ad.priceFrom) })}</Text>
                                    ) : null}
                                </View>
                            </Pressable>
                        ))}
                    </View>
                ) : null}

                <View style={styles.search}>
                    <View style={styles.searchField}>
                        <Text style={styles.fieldLabel}>{t('search.destination')}</Text>
                        <View style={styles.fieldRow}>
                            <MapPin size={20} color={COLORS.primary} strokeWidth={2} />
                            <TextInput
                                value={destination}
                                onChangeText={setDestination}
                                placeholder={t('search.placeholderDestination')}
                                placeholderTextColor={COLORS.muted}
                                style={styles.fieldValue}
                            />
                        </View>
                    </View>
                    <View style={styles.searchField}>
                        <Text style={styles.fieldLabel}>{t('search.checkIn')}</Text>
                        <View style={styles.fieldRow}>
                            <Calendar size={18} color="#94A3B8" strokeWidth={2} />
                            <View style={styles.fieldGrow}>
                                <DateValue value={checkIn} onChange={setCheckIn} />
                            </View>
                        </View>
                    </View>
                    <View style={styles.searchField}>
                        <Text style={styles.fieldLabel}>{t('search.checkOut')}</Text>
                        <View style={styles.fieldRow}>
                            <Calendar size={18} color="#94A3B8" strokeWidth={2} />
                            <View style={styles.fieldGrow}>
                                <DateValue value={checkOut} onChange={setCheckOut} />
                            </View>
                        </View>
                    </View>
                    <View style={styles.searchField}>
                        <Text style={styles.fieldLabel}>{t('search.guestsRooms')}</Text>
                        <View style={styles.fieldRow}>
                            <Users size={18} color="#94A3B8" strokeWidth={2} />
                            <View style={styles.fieldGrow}>
                                <GuestValue value={guestValue} onChange={setGuestValue} options={GUEST_OPTIONS} t={t} />
                            </View>
                        </View>
                    </View>
                    <Pressable style={styles.searchBtn} onPress={search}>
                        <Search size={20} color="#fff" strokeWidth={2} />
                        <Text style={styles.searchBtnText}>{t('common.search')}</Text>
                    </Pressable>
                </View>

                <View style={styles.quickRow}>
                    <Text style={styles.popular}>{t('home.popular')}</Text>
                    {QUICK_LINKS.map((link) => (
                        <Pressable key={link.key} style={styles.chip} onPress={() => openCategory(navigation, t, link.key)}>
                            <Text style={styles.chipText}>{t(link.labelKey)}</Text>
                        </Pressable>
                    ))}
                    <Pressable style={styles.chip} onPress={() => navigation.navigate('Search', { freeCancellation: '1' })}>
                        <Text style={styles.chipText}>{t('home.quickFreeCancellation')}</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    hero: { backgroundColor: '#003580', position: 'relative' },
    backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 0, elevation: 0 },
    heroImage: { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
    content: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 80, position: 'relative', zIndex: 1, elevation: 1 },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    pillText: { fontFamily: FONTS.semibold, color: '#fff', fontSize: 12 },
    pillGold: { backgroundColor: 'rgba(255,183,0,0.15)', borderColor: 'rgba(255,183,0,0.35)' },
    title: {
        fontFamily: FONTS.extrabold,
        color: '#fff',
        fontSize: 32,
        letterSpacing: -0.6,
        marginTop: 18,
    },
    subtitle: {
        fontFamily: FONTS.regular,
        color: '#DBEAFE',
        fontSize: 16,
        lineHeight: 24,
        marginTop: 10,
    },
    stats: { flexDirection: 'row', gap: 22, marginTop: 22 },
    statValue: { fontFamily: FONTS.extrabold, color: '#fff', fontSize: 24 },
    statLabel: { fontFamily: FONTS.regular, color: 'rgba(219,234,254,0.9)', fontSize: 13, marginTop: 2 },
    ads: { marginTop: 22 },
    adsLabel: {
        fontFamily: FONTS.semibold,
        color: 'rgba(219,234,254,0.85)',
        fontSize: 11,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    adCard: {
        flexDirection: 'row',
        gap: 10,
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.12)',
        marginBottom: 8,
    },
    adImage: { width: 72, height: 64, borderRadius: 8, backgroundColor: 'rgba(30,41,59,0.4)' },
    adFallback: { backgroundColor: 'rgba(96,165,250,0.35)' },
    adBody: { flex: 1, justifyContent: 'center' },
    adType: { fontFamily: FONTS.semibold, color: 'rgba(253,230,138,0.95)', fontSize: 10, letterSpacing: 0.6 },
    adName: { fontFamily: FONTS.bold, color: '#fff', fontSize: 14, marginTop: 2 },
    adMeta: { fontFamily: FONTS.regular, color: 'rgba(219,234,254,0.85)', fontSize: 11, marginTop: 2 },
    adPrice: { fontFamily: FONTS.semibold, color: '#fff', fontSize: 12, marginTop: 4 },
    search: {
        marginTop: 40,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 3,
        borderColor: COLORS.accent,
        overflow: 'hidden',
        ...Platform.select({
            web: { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                elevation: 6,
            },
        }),
    },
    searchField: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    fieldLabel: {
        fontFamily: FONTS.bold,
        fontSize: 12,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: '#64748B',
    },
    fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    fieldGrow: { flex: 1 },
    fieldValue: {
        flex: 1,
        fontFamily: FONTS.medium,
        fontSize: 16,
        color: COLORS.text,
        paddingVertical: 0,
    },
    searchBtn: {
        margin: 8,
        minHeight: 52,
        borderRadius: 8,
        backgroundColor: COLORS.action,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    searchBtnText: { fontFamily: FONTS.bold, fontSize: 14, color: '#fff' },
    quickRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 14 },
    popular: { fontFamily: FONTS.medium, color: 'rgba(219,234,254,0.85)', fontSize: 12 },
    chip: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    chipText: { fontFamily: FONTS.medium, color: '#fff', fontSize: 12 },
});
