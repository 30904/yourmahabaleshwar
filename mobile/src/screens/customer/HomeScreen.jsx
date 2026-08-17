import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Screen, Title, Muted } from '../../components/ui';
import { CATEGORIES, COLORS } from '../../constants/theme';
export default function HomeScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    return (<Screen>
      <ScrollView>
        <Text style={styles.brand}>YOURMAHABALESHWAR</Text>
        <Title>{t('home.headline')}</Title>
        <Muted>{t('home.subhead')}</Muted>
        <Text style={styles.section}>{t('home.browse')}</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((c) => (<Pressable key={c.key} style={styles.tile} onPress={() => navigation.navigate('Catalog', {
                path: c.path,
                title: t(c.labelKey),
                type: c.type,
                query: 'query' in c ? c.query : undefined,
            })}>
              <Text style={styles.tileText}>{t(c.labelKey)}</Text>
            </Pressable>))}
        </View>
      </ScrollView>
    </Screen>);
}
const styles = StyleSheet.create({
    brand: { color: COLORS.primary, fontWeight: '900', fontSize: 18, marginBottom: 8 },
    section: { marginTop: 20, marginBottom: 10, fontWeight: '700', color: COLORS.text },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tile: {
        width: '48%',
        backgroundColor: COLORS.primarySoft,
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    tileText: { fontWeight: '700', color: COLORS.primary },
});
