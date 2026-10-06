import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { addWishlist, removeWishlist } from '../api/endpoints';
import { COLORS, FONTS, RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';
import { listingImage, listingPlace, listingPrice, scoreFromRating, scoreLabelFromRating, wishlistPath } from '../utils/listing';
import { Check, Heart, MapPin } from './home/icons';

const FALLBACK = {
    PRODUCT: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800',
    COMBO: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    DEFAULT: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
};

const STAYS = new Set(['HOTEL', 'RESORT', 'HOMESTAY', 'TENT']);

function priceParts(item, type, t) {
    if (type === 'GUIDE' && item.package6hr != null) {
        return { amount: item.package6hr, suffix: t('guide.sixHourShort') };
    }
    if ((type === 'TAXI' || type === 'DRIVER') && item.perTripPrice != null) {
        return { amount: item.perTripPrice, suffix: t('taxi.perTripShort') };
    }
    if (type === 'HORSE' && listingPrice(item) != null) {
        return { amount: listingPrice(item), suffix: t('horse.perRoute') };
    }
    if (type === 'PRODUCT' && item.price != null) {
        return { amount: item.price, suffix: item.unit ? `/ ${item.unit}` : '' };
    }
    if (type === 'COMBO' && item.comboPrice != null) {
        return {
            amount: item.comboPrice,
            original: item.originalPrice,
            save: item.originalPrice > item.comboPrice ? item.originalPrice - item.comboPrice : null,
        };
    }
    const amount = listingPrice(item);
    if (amount == null) return null;
    return {
        amount,
        original: item.originalPrice,
        suffix: STAYS.has(type) ? t('property.perNight') : '',
        taxes: STAYS.has(type),
    };
}

export default function ListingCard({ item, type, onPress }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigation = useNavigation();
    const [saved, setSaved] = useState(false);
    const canSave = Boolean(wishlistPath(type) && item?._id);
    const price = priceParts(item, type, t);
    const image = listingImage(item) || FALLBACK[type] || FALLBACK.DEFAULT;
    const stay = ['HOTEL', 'RESORT', 'HOMESTAY', 'TENT'].includes(type);
    const rating = item.rating ?? (stay ? 4 : null);
    const score = item.score ?? (rating != null ? scoreFromRating(rating) : null);
    const scoreLabel = item.scoreLabel || (rating != null ? scoreLabelFromRating(rating) : '');
    const freeCancellation = item.freeCancellation ?? stay;
    const payAtProperty = item.payAtProperty ?? stay;
    const locationText = typeof item.location === 'string' ? item.location : '';
    const place = stay
        ? (item.distance || item.address?.city || locationText || 'Mahabaleshwar')
        : listingPlace(item, type);
    const shop = type === 'PRODUCT';
    const combo = type === 'COMBO';

    const open = () => onPress();

    const toggleSave = async () => {
        if (!user) {
            Alert.alert(t('auth.signIn'), t('account.signInToSave'));
            navigation.navigate('Auth');
            return;
        }
        try {
            if (saved) {
                await removeWishlist(item._id, type);
                setSaved(false);
            }
            else {
                await addWishlist(item._id, type);
                setSaved(true);
            }
        }
        catch (error) {
            Alert.alert(t('common.error'), error.response?.data?.message || error.message);
        }
    };

    return (
        <Pressable style={styles.card} onPress={open}>
            <View>
                <Image source={{ uri: image }} style={styles.image} />
                {item.isFeatured ? <Text style={styles.featured}>{t('property.featured')}</Text> : null}
                {canSave ? (
                    <Pressable style={styles.heart} onPress={toggleSave} hitSlop={8}>
                        <Heart size={18} color={saved ? '#EF4444' : '#475569'} fill={saved ? '#EF4444' : 'none'} strokeWidth={2} />
                    </Pressable>
                ) : null}
            </View>
            <View style={styles.body}>
                <View style={styles.titleRow}>
                    <Text style={styles.name}>{item.name}</Text>
                    {score ? (
                        <View style={styles.scoreWrap}>
                            <View style={styles.score}>
                                <Text style={styles.scoreText}>{Number(score).toFixed(1)}</Text>
                            </View>
                            <View>
                                {scoreLabel ? <Text style={styles.scoreLabel}>{scoreLabel}</Text> : null}
                                {item.reviewCount != null ? (
                                    <Text style={styles.reviews}>{Number(item.reviewCount).toLocaleString('en-IN')} {t('property.reviews')}</Text>
                                ) : null}
                            </View>
                        </View>
                    ) : null}
                </View>
                {shop ? (
                    item.shortDescription ? <Text style={styles.blurb} numberOfLines={2}>{item.shortDescription}</Text> : null
                ) : combo ? (
                    item.description ? <Text style={styles.blurb} numberOfLines={2}>{item.description}</Text> : null
                ) : (
                    <View style={styles.placeRow}>
                        <MapPin size={14} color="#64748B" strokeWidth={2} />
                        <Text style={styles.place} numberOfLines={1}>{place}</Text>
                    </View>
                )}
                {freeCancellation || payAtProperty ? (
                    <View style={styles.perkRow}>
                        {freeCancellation ? (
                            <View style={styles.perk}>
                                <Check size={14} color={COLORS.success} strokeWidth={2} />
                                <Text style={styles.free}>{t('property.freeCancellation')}</Text>
                            </View>
                        ) : null}
                        {payAtProperty ? <Text style={styles.payLater}>{t('property.noPrepayment')}</Text> : null}
                    </View>
                ) : null}
                <View style={styles.footer}>
                    <View style={styles.priceBlock}>
                        {price?.original != null ? <Text style={styles.original}>{formatCurrency(price.original)}</Text> : null}
                        {price ? (
                            <Text style={styles.price}>
                                {formatCurrency(price.amount)}
                                {price.suffix && !price.taxes ? <Text style={styles.suffix}> {price.suffix}</Text> : null}
                            </Text>
                        ) : null}
                        {price?.taxes ? <Text style={styles.taxes}>{price.suffix} · {t('property.inclTaxes')}</Text> : null}
                        {price?.save ? <Text style={styles.save}>{t('shop.save')} {formatCurrency(price.save)}</Text> : null}
                    </View>
                    {!shop && !combo ? (
                        <Pressable style={styles.availability} onPress={open}>
                            <Text style={styles.availabilityText}>{t('property.seeAvailability')}</Text>
                        </Pressable>
                    ) : null}
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        marginBottom: 16,
    },
    image: { width: '100%', height: 200, backgroundColor: COLORS.primarySoft },
    featured: {
        position: 'absolute',
        left: 0,
        top: 12,
        backgroundColor: COLORS.primary,
        color: '#fff',
        fontFamily: FONTS.bold,
        fontSize: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    heart: {
        position: 'absolute',
        right: 12,
        top: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: { padding: 16 },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    name: { flex: 1, fontFamily: FONTS.bold, fontSize: 18, color: COLORS.primary },
    blurb: { fontFamily: FONTS.regular, fontSize: 14, color: '#64748B', marginTop: 4, lineHeight: 20 },
    placeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    place: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: '#64748B' },
    scoreWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    score: {
        minWidth: 36,
        backgroundColor: COLORS.primary,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 4,
        alignItems: 'center',
    },
    scoreText: { fontFamily: FONTS.bold, color: '#fff', fontSize: 13 },
    scoreLabel: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.text },
    reviews: { fontFamily: FONTS.regular, fontSize: 12, color: '#64748B' },
    perkRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 12 },
    perk: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    free: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.success },
    payLater: { fontFamily: FONTS.regular, fontSize: 12, color: '#64748B' },
    footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 16 },
    priceBlock: { flex: 1 },
    original: { fontFamily: FONTS.regular, fontSize: 13, color: '#94A3B8', textDecorationLine: 'line-through' },
    price: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    suffix: { fontFamily: FONTS.regular, fontSize: 12, color: '#64748B' },
    taxes: { fontFamily: FONTS.regular, fontSize: 12, color: '#64748B', marginTop: 2 },
    save: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.success, marginTop: 4 },
    availability: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.button,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    availabilityText: { fontFamily: FONTS.semibold, color: '#fff', fontSize: 13 },
});
