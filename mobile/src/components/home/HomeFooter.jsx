import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS } from '../../constants/theme';
import { openCategory } from './homeNav';

const logo = require('../../../assets/logo.png');

export default function HomeFooter({ navigation }) {
    const { t } = useTranslation();
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
        <View>
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
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    body: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 48,
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
    column: { marginTop: 40 },
    title: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text },
    linkHit: { marginTop: 8 },
    link: { fontFamily: FONTS.regular, fontSize: 14, color: '#475569' },
    bar: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    copy: { fontFamily: FONTS.regular, fontSize: 12, color: '#BFDBFE', textAlign: 'center' },
});
