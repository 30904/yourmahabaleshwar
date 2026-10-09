import React, { useEffect, useState } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fetchServiceHubImages } from '../../api/endpoints';
import { loadPublic } from '../../api/publicCache';
import { Button, Card, Screen } from '../../components/ui';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import { mediaUrl } from '../../utils/listing';

const PHONES = [
    { label: '+91 9987 6567 92', href: 'tel:+919987656792' },
    { label: '+91 9987 6866 92', href: 'tel:+919987686692' },
];

const HUBS = {
    GUIDE: {
        titleKey: 'serviceBooking.guideTitle',
        descKey: 'serviceBooking.guideHubDesc',
        features: ['serviceBooking.guideFeature1', 'serviceBooking.guideFeature2', 'serviceBooking.guideFeature3'],
        enquireLabelKey: 'serviceBooking.enquireAboutGuide',
        enquireHintKey: 'serviceBooking.enquireGuideHint',
    },
    TAXI: {
        titleKey: 'serviceBooking.taxiTitle',
        descKey: 'serviceBooking.taxiHubDesc',
        features: ['serviceBooking.taxiFeature1', 'serviceBooking.taxiFeature2', 'serviceBooking.taxiFeature3'],
        enquireLabelKey: 'serviceBooking.enquireAboutTaxi',
        enquireHintKey: 'serviceBooking.enquireTaxiHint',
    },
    DRIVER: {
        titleKey: 'serviceBooking.driverTitle',
        descKey: 'serviceBooking.driverHubDesc',
        features: ['serviceBooking.driverFeature1', 'serviceBooking.driverFeature2', 'serviceBooking.driverFeature3'],
        enquireLabelKey: 'serviceBooking.enquireAboutDriver',
        enquireHintKey: 'serviceBooking.enquireDriverHint',
    },
    HORSE: {
        titleKey: 'serviceBooking.horseTitle',
        descKey: 'serviceBooking.horseHubDesc',
        features: ['serviceBooking.horseFeature1', 'serviceBooking.horseFeature2', 'serviceBooking.horseFeature3'],
        enquireLabelKey: 'serviceBooking.enquireAboutHorse',
        enquireHintKey: 'serviceBooking.enquireHorseHint',
    },
};

function imageUrl(item) {
    if (!item) return '';
    if (typeof item === 'string') return mediaUrl(item);
    return mediaUrl(item.url || item.src || item.key || '');
}

function HubGallery({ images }) {
    const [index, setIndex] = useState(null);
    if (!images.length) return null;
    const [hero, ...rest] = images;
    const open = index != null;
    const shift = (step) => setIndex((current) => (current + step + images.length) % images.length);
    return (
        <View style={styles.gallery}>
            <Pressable onPress={() => setIndex(0)}>
                <Image source={{ uri: hero }} style={styles.hero} />
            </Pressable>
            {rest.length ? (
                <View style={styles.grid}>
                    {rest.map((uri, i) => (
                        <Pressable key={`${uri}-${i}`} style={styles.tile} onPress={() => setIndex(i + 1)}>
                            <Image source={{ uri }} style={styles.tileImage} />
                        </Pressable>
                    ))}
                </View>
            ) : null}
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setIndex(null)}>
                <View style={styles.lightbox}>
                    <Pressable style={styles.lightboxBackdrop} onPress={() => setIndex(null)} />
                    {open ? <Image source={{ uri: images[index] }} style={styles.lightboxImage} resizeMode="contain" /> : null}
                    <View style={styles.lightboxBar}>
                        {images.length > 1 ? (
                            <Pressable onPress={() => shift(-1)} style={styles.lightboxBtn}>
                                <Text style={styles.lightboxBtnText}>‹</Text>
                            </Pressable>
                        ) : null}
                        <Text style={styles.lightboxCount}>{open ? `${index + 1} / ${images.length}` : ''}</Text>
                        {images.length > 1 ? (
                            <Pressable onPress={() => shift(1)} style={styles.lightboxBtn}>
                                <Text style={styles.lightboxBtnText}>›</Text>
                            </Pressable>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

export default function ServiceHubScreen({ type, navigation }) {
    const { t } = useTranslation();
    const config = HUBS[type] || HUBS.GUIDE;
    const [images, setImages] = useState([]);
    const [enquireOpen, setEnquireOpen] = useState(false);

    useEffect(() => {
        navigation.setOptions({ title: '' });
        let alive = true;
        const job = loadPublic('service-hub-images', fetchServiceHubImages, (data) => {
            if (!alive) return;
            const list = Array.isArray(data?.images?.[type]) ? data.images[type] : [];
            setImages(list.map(imageUrl).filter(Boolean));
        });
        job.catch(() => {
            if (alive) setImages([]);
        });
        return () => {
            alive = false;
            job.cancel();
        };
    }, [navigation, type]);

    const openForm = () => navigation.navigate('ServiceBook', { type });
    const steps = [
        t('serviceBooking.step1'),
        t('serviceBooking.step2'),
        t('serviceBooking.step3'),
    ];

    return (
        <Screen style={styles.screen}>
            <ScrollView contentContainerStyle={styles.page}>
                <View style={styles.copy}>
                    <Text style={styles.title}>{t(config.titleKey)}</Text>
                    <Text style={styles.desc}>{t(config.descKey)}</Text>
                    <Text style={styles.note}>{t('serviceBooking.noVendorPick')}</Text>
                    <View style={styles.actions}>
                        <Button title={t('serviceBooking.bookNow')} onPress={openForm} style={styles.bookBtn} />
                        <Button title={t(config.enquireLabelKey)} variant="outline" onPress={() => setEnquireOpen(true)} style={styles.bookBtn} />
                    </View>
                </View>
                <HubGallery images={images} />
                <Card style={styles.how}>
                    <Text style={styles.howTitle}>{t('serviceBooking.howItWorks')}</Text>
                    {steps.map((step, index) => (
                        <View key={step} style={styles.step}>
                            <View style={styles.stepBadge}><Text style={styles.stepNum}>{index + 1}</Text></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepLabel}>{t('serviceBooking.stepLabel', { n: index + 1 })}</Text>
                                <Text style={styles.stepText}>{step}</Text>
                            </View>
                        </View>
                    ))}
                </Card>
                <View style={styles.features}>
                    {config.features.map((key) => (
                        <View key={key} style={styles.feature}><Text style={styles.featureText}>{t(key)}</Text></View>
                    ))}
                </View>
            </ScrollView>
            <Modal visible={enquireOpen} transparent animationType="fade" onRequestClose={() => setEnquireOpen(false)}>
                <Pressable style={styles.backdrop} onPress={() => setEnquireOpen(false)}>
                    <Pressable style={styles.dialog} onPress={() => {}}>
                        <Text style={styles.dialogTitle}>{t(config.enquireLabelKey)}</Text>
                        <Text style={styles.dialogHint}>{t(config.enquireHintKey)}</Text>
                        {PHONES.map((phone) => (
                            <Pressable key={phone.href} onPress={() => Linking.openURL(phone.href)} style={styles.phone}>
                                <Text style={styles.phoneText}>{phone.label}</Text>
                            </Pressable>
                        ))}
                        <Button title={t('serviceBooking.closeEnquire')} variant="outline" onPress={() => setEnquireOpen(false)} />
                    </Pressable>
                </Pressable>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { padding: 0 },
    page: { paddingBottom: 0 },
    copy: { paddingHorizontal: 20, paddingTop: 28, alignItems: 'center' },
    title: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.text, letterSpacing: -0.4, textAlign: 'center' },
    desc: { marginTop: 12, fontFamily: FONTS.regular, fontSize: 16, lineHeight: 24, color: '#475569', textAlign: 'center' },
    note: { marginTop: 10, fontFamily: FONTS.regular, fontSize: 14, lineHeight: 22, color: '#64748B', textAlign: 'center' },
    actions: { alignItems: 'center', marginTop: 4 },
    bookBtn: { alignSelf: 'center', minWidth: 220, paddingHorizontal: 28 },
    gallery: { marginTop: 24, paddingHorizontal: 16 },
    hero: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16, backgroundColor: '#E2E8F0' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginTop: 8 },
    tile: { width: '50%', padding: 4 },
    tileImage: { width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: '#E2E8F0' },
    lightbox: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.92)', justifyContent: 'center', padding: 16 },
    lightboxBackdrop: { ...StyleSheet.absoluteFillObject },
    lightboxImage: { width: '100%', height: '70%' },
    lightboxBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 },
    lightboxBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
    lightboxBtnText: { color: '#fff', fontSize: 24, fontFamily: FONTS.bold },
    lightboxCount: { color: '#fff', fontFamily: FONTS.medium, fontSize: 14 },
    how: { marginHorizontal: 16, marginTop: 24 },
    howTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    step: { flexDirection: 'row', gap: 12, marginTop: 16 },
    stepBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 53, 128, 0.1)', alignItems: 'center', justifyContent: 'center' },
    stepNum: { fontFamily: FONTS.bold, color: COLORS.primary },
    stepLabel: { fontFamily: FONTS.semibold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: '#94A3B8' },
    stepText: { marginTop: 2, fontFamily: FONTS.regular, fontSize: 15, lineHeight: 22, color: '#334155' },
    features: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
    feature: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12 },
    featureText: { fontFamily: FONTS.regular, fontSize: 14, color: '#475569', textAlign: 'center' },
    backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', padding: 20 },
    dialog: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
    dialogTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    dialogHint: { marginTop: 6, marginBottom: 8, fontFamily: FONTS.regular, fontSize: 14, color: '#475569' },
    phone: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginTop: 10 },
    phoneText: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.primary },
});
