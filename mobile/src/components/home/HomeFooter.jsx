import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import { openCategory } from './homeNav';

const logo = require('../../../assets/logo.png');
const smLogo = require('../../../assets/sm_logo.jpeg');

export default function HomeFooter({ bleed = 16 }) {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const openPage = (page) => navigation.navigate('Content', { page });

    const columns = [
        {
            title: t('footer.support'),
            links: [
                { label: t('footer.helpCentre'), onPress: () => openPage('faq') },
                { label: t('footer.contactUs'), onPress: () => openPage('contact') },
                { label: t('footer.cancellation'), onPress: () => openPage('cancel') },
            ],
        },
        {
            title: t('footer.discover'),
            links: [
                { label: t('home.categories.hotels'), onPress: () => openCategory(navigation, t, 'hotels') },
                { label: t('home.categories.resorts'), onPress: () => openCategory(navigation, t, 'resorts') },
                { label: t('home.categories.tents'), onPress: () => openCategory(navigation, t, 'tents') },
                { label: t('nav.guides'), onPress: () => openCategory(navigation, t, 'guides') },
            ],
        },
        {
            title: t('footer.company'),
            links: [
                { label: t('footer.about'), onPress: () => openPage('about') },
                { label: t('footer.blog'), onPress: () => openPage('blogs') },
                { label: t('footer.privacy'), onPress: () => openPage('privacy') },
                { label: t('footer.terms'), onPress: () => openPage('terms') },
            ],
        },
    ];

    return (
        <View style={[
            styles.root,
            bleed > 0 && {
                marginHorizontal: -bleed,
                width: `calc(100% + ${bleed * 2}px)`,
                alignSelf: 'flex-start',
            },
        ]}>
            <View style={styles.ventureWrap}>
                <View style={styles.venture}>
                    <Image source={smLogo} style={styles.smLogo} resizeMode="contain" />
                    <Text style={styles.kicker}>{t('footer.ventureOf')}</Text>
                    <Text style={styles.ventureName}>SM Enterprise</Text>
                    <Text style={styles.blurb}>{t('footer.ventureBlurb')}</Text>
                    <Text style={[styles.kicker, styles.kickerGap]}>{t('footer.poweredBy')}</Text>
                    <Text style={styles.partner}>Celeris Venture Systems Pvt. Ltd.</Text>
                    <Text style={styles.partnerRole}>{t('footer.techPartner')}</Text>
                </View>
            </View>
            <View style={styles.body}>
                <Image source={logo} style={styles.logo} resizeMode="contain" />
                <Text style={styles.tagline}>{t('footer.tagline')}</Text>
                {columns.map((column) => (
                    <View key={column.title} style={styles.column}>
                        <Text style={styles.title}>{column.title}</Text>
                        {column.links.map((link) => (
                            <Pressable key={link.label} onPress={link.onPress} style={styles.linkHit}>
                                <Text style={styles.link}>{link.label}</Text>
                            </Pressable>
                        ))}
                    </View>
                ))}
            </View>
            <View style={styles.bar}>
                <Text style={styles.copy}>{t('footer.copyright')}</Text>
                <Text style={styles.barLine}>{t('footer.ventureOf')} SM Enterprise</Text>
                <Text style={styles.barLine}>{t('footer.poweredBy')} Celeris Venture Systems Pvt. Ltd.</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { marginTop: 24, width: '100%', alignSelf: 'stretch' },
    ventureWrap: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingHorizontal: 16,
        paddingTop: 32,
        paddingBottom: 8,
    },
    venture: {
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.card,
        paddingHorizontal: 20,
        paddingVertical: 28,
    },
    smLogo: { width: 72, height: 72, marginBottom: 12 },
    kicker: {
        fontFamily: FONTS.semibold,
        fontSize: 11,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: '#64748B',
        textAlign: 'center',
    },
    kickerGap: { marginTop: 18 },
    ventureName: {
        marginTop: 4,
        fontFamily: FONTS.bold,
        fontSize: 22,
        color: COLORS.primary,
        textAlign: 'center',
    },
    blurb: {
        marginTop: 8,
        maxWidth: 320,
        fontFamily: FONTS.regular,
        fontSize: 14,
        lineHeight: 20,
        color: '#475569',
        textAlign: 'center',
    },
    partner: {
        marginTop: 4,
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: '#1E293B',
        textAlign: 'center',
    },
    partnerRole: {
        marginTop: 4,
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    body: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingHorizontal: 16,
        paddingTop: 40,
        paddingBottom: 40,
    },
    logo: { width: 220, height: 80 },
    tagline: {
        marginTop: 16,
        maxWidth: 280,
        fontFamily: FONTS.regular,
        fontSize: 14,
        lineHeight: 20,
        color: '#475569',
    },
    column: { marginTop: 32 },
    title: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text },
    linkHit: { marginTop: 8 },
    link: { fontFamily: FONTS.regular, fontSize: 14, color: '#475569' },
    bar: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 6,
    },
    copy: { fontFamily: FONTS.regular, fontSize: 12, color: '#BFDBFE', textAlign: 'center' },
    barLine: { fontFamily: FONTS.regular, fontSize: 12, color: '#BFDBFE', textAlign: 'center' },
});
