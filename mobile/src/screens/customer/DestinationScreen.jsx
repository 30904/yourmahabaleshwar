import React, { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Screen } from '../../components/ui';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import { destinationBySlug, destinationCopy } from '../../content/destinations';

export default function DestinationScreen({ navigation, route }) {
  const { t, i18n } = useTranslation();
  const place = destinationBySlug(route?.params?.slug);
  const copy = place ? destinationCopy(place, i18n.language) : null;

  useEffect(() => {
    navigation.setOptions({ title: copy?.name || t('home.destinations.title') });
  }, [navigation, copy, t]);

  if (!place) {
    return (
      <Screen>
        <Text style={styles.missing}>{t('home.destinations.notFound')}</Text>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.page}>
        <Image source={{ uri: place.hero }} style={styles.hero} />
        <View style={styles.body}>
          <Text style={styles.intro}>{copy.intro}</Text>
          <Card style={styles.card}>
            <Text style={styles.heading}>{t('home.destinations.aboutPlace')}</Text>
            <Text style={styles.paragraph}>{copy.about}</Text>
          </Card>
          <Card style={styles.card}>
            <Text style={styles.heading}>{t('home.destinations.special')}</Text>
            {copy.special.map((item) => (
              <Text key={item} style={styles.bullet}>{`•  ${item}`}</Text>
            ))}
          </Card>
          <Card style={styles.card}>
            <Text style={styles.heading}>{t('home.destinations.exciting')}</Text>
            {copy.exciting.map((item) => (
              <Text key={item} style={styles.bullet}>{`•  ${item}`}</Text>
            ))}
          </Card>
          <Card style={styles.card}>
            <Text style={styles.heading}>{t('home.destinations.activities')}</Text>
            {copy.activities.map((item) => (
              <View key={item} style={styles.activity}>
                <Text style={styles.activityText}>{item}</Text>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0 },
  page: { paddingBottom: 28 },
  hero: { width: '100%', height: 240, backgroundColor: COLORS.border },
  body: { padding: 16 },
  intro: { fontFamily: FONTS.medium, fontSize: 16, color: COLORS.text, lineHeight: 24, marginBottom: 14 },
  card: { marginBottom: 12 },
  heading: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text, marginBottom: 8 },
  paragraph: { fontFamily: FONTS.regular, fontSize: 15, color: '#475569', lineHeight: 22 },
  bullet: { fontFamily: FONTS.regular, fontSize: 15, color: '#475569', lineHeight: 22, marginTop: 8 },
  activity: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.button,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  activityText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  missing: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.muted },
});
