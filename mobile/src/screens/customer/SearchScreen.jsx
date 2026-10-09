import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { globalSearch } from '../../api/endpoints';
import { loadPublic } from '../../api/publicCache';
import ListingCard from '../../components/ListingCard';
import { openCategory } from '../../components/home/homeNav';
import { Button, Card, Loading, Muted, Screen } from '../../components/ui';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';

const SECTIONS = [
    { key: 'hotels', titleKey: 'nav.hotels', path: '/hotels', type: 'HOTEL', pick: (data) => (data.hotels || []).filter((item) => String(item.type || 'HOTEL').toUpperCase() !== 'RESORT') },
    { key: 'resorts', titleKey: 'nav.resorts', path: '/hotels', type: 'RESORT', pick: (data) => (data.hotels || []).filter((item) => String(item.type || '').toUpperCase() === 'RESORT') },
    { key: 'homestays', titleKey: 'nav.homestays', path: '/homestays', type: 'HOMESTAY', pick: (data) => data.homestays || [] },
    { key: 'tents', titleKey: 'nav.tents', path: '/tents', type: 'TENT', pick: (data) => data.tents || [] },
];

const SHORTCUTS = ['guides', 'tents', 'taxi', 'drivers', 'horses', 'homestays', 'hotels', 'resorts'];

export default function SearchScreen({ route, navigation }) {
    const { t } = useTranslation();
    const [query, setQuery] = useState(route.params?.q || '');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState('');

    const runSearch = async (text = query) => {
        const q = String(text || '').trim();
        if (!q) return;
        setLoading(true);
        setSearched(q);
        let showed = false;
        try {
            const job = loadPublic(`search:${q.toLowerCase()}`, () => globalSearch(q), (next) => {
                showed = true;
                setData(next);
                setLoading(false);
            });
            await job;
        }
        catch {
            if (!showed) setData({ hotels: [], tents: [], guides: [], drivers: [], homestays: [], horses: [] });
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (route.params?.q) {
            setQuery(route.params.q);
            runSearch(route.params.q);
        }
    }, [route.params?.q]);

    const sections = data ? SECTIONS.map((section) => ({ ...section, items: section.pick(data) })).filter((section) => section.items.length) : [];
    const total = sections.reduce((sum, section) => sum + section.items.length, 0);

    return (
        <Screen style={styles.screen}>
            <ScrollView contentContainerStyle={styles.page}>
                <View style={styles.band}>
                    <View style={styles.widget}>
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder={t('search.placeholderWhere')}
                            placeholderTextColor={COLORS.muted}
                            autoCapitalize="sentences"
                            returnKeyType="search"
                            onSubmitEditing={() => runSearch()}
                            style={styles.input}
                        />
                        <View style={styles.searchBtn}>
                            <Button title={t('common.search')} onPress={() => runSearch()} />
                        </View>
                    </View>
                </View>
                <View style={styles.body}>
                    {loading ? <Loading /> : null}
                    {!loading && searched ? (
                        <>
                            <Text style={styles.heading}>{t('search.results', { count: total, q: searched })}</Text>
                            {total ? <Muted>{t('search.matches')}</Muted> : (
                                <Card style={styles.empty}>
                                    <Text style={styles.emptyTitle}>{t('search.none')}</Text>
                                </Card>
                            )}
                            {total ? sections.map((section) => (
                                <View key={section.key} style={styles.section}>
                                    <Text style={styles.sectionTitle}>{t(section.titleKey)}</Text>
                                    {section.items.map((item) => (
                                        <ListingCard
                                            key={item._id || item.slug}
                                            item={item}
                                            type={section.type}
                                            onPress={() => navigation.navigate('ListingDetail', {
                                                path: section.path,
                                                slug: item.slug,
                                                type: section.type,
                                            })}
                                        />
                                    ))}
                                </View>
                            )) : null}
                        </>
                    ) : null}
                    <Text style={styles.sectionTitle}>{t('search.experiences')}</Text>
                    <View style={styles.shortcuts}>
                        {SHORTCUTS.map((key) => (
                            <Pressable key={key} style={styles.shortcut} onPress={() => openCategory(navigation, t, key)}>
                                <Text style={styles.shortcutText}>{t(`nav.${key}`)}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { padding: 0 },
    page: { paddingBottom: 28 },
    band: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 16 },
    widget: {
        backgroundColor: '#fff',
        borderRadius: RADIUS.card,
        borderWidth: 3,
        borderColor: COLORS.accent,
        overflow: 'hidden',
    },
    input: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        color: COLORS.text,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    searchBtn: { paddingHorizontal: 8, paddingBottom: 8 },
    body: { padding: 16 },
    heading: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        color: COLORS.text,
        letterSpacing: -0.4,
        marginBottom: 4,
    },
    section: { marginTop: 20 },
    sectionTitle: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: COLORS.text,
        marginBottom: 12,
        marginTop: 8,
    },
    empty: { marginTop: 16, alignItems: 'center' },
    emptyTitle: {
        fontFamily: FONTS.semibold,
        fontSize: 15,
        color: COLORS.muted,
        textAlign: 'center',
    },
    shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    shortcut: {
        width: '47%',
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        alignItems: 'center',
    },
    shortcutText: {
        fontFamily: FONTS.semibold,
        fontSize: 14,
        color: COLORS.primary,
        textAlign: 'center',
    },
});
