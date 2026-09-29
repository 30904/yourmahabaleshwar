import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Muted } from './ui';
import { COLORS } from '../constants/theme';
import { formatCurrency } from '../utils/format';

const PACKAGES = [
    { id: '4HR', nameKey: 'guide.packages.fourHour.name', durationKey: 'guide.packages.fourHour.duration', guideOnly: 900, withBike: 1100 },
    { id: '8HR', nameKey: 'guide.packages.eightHour.name', durationKey: 'guide.packages.eightHour.duration', guideOnly: 1500, withBike: 1700 },
];

const TOURS = [
    { id: 'mahabaleshwar_1', nameKey: 'guide.tours.mahabaleshwar1.name', fourKey: 'guide.tours.mahabaleshwar1.fourHourSpots', eightKey: 'guide.tours.mahabaleshwar1.eightHourSpots' },
    { id: 'mahabaleshwar_2', nameKey: 'guide.tours.mahabaleshwar2.name', fourKey: 'guide.tours.mahabaleshwar2.fourHourSpots', eightKey: 'guide.tours.mahabaleshwar2.eightHourSpots' },
    { id: 'pratapgad', nameKey: 'guide.tours.pratapgad.name', fourKey: 'guide.tours.pratapgad.fourHourSpots', eightKey: 'guide.tours.pratapgad.eightHourSpots', noteKey: 'guide.tours.pratapgad.note' },
    { id: 'panchgani', nameKey: 'guide.tours.panchgani.name', fourKey: 'guide.tours.panchgani.fourHourSpots', eightKey: 'guide.tours.panchgani.eightHourSpots', noteKey: 'guide.tours.panchgani.note' },
    { id: 'panchgani_wai', nameKey: 'guide.tours.panchganiWai.name', fourKey: 'guide.tours.panchganiWai.fourHourSpots', eightKey: 'guide.tours.panchganiWai.eightHourSpots', halfDayKey: 'guide.chartSixHourPackage' },
    { id: 'tapola', nameKey: 'guide.tours.tapola.name', fourKey: 'guide.tours.tapola.fourHourSpots', eightKey: 'guide.tours.tapola.eightHourSpots' },
];

function spots(value) {
    return Array.isArray(value) ? value : [];
}

export default function GuideRateChart() {
    const { t } = useTranslation();
    return (<Card>
      <Text style={{ fontWeight: '800', color: COLORS.text }}>{t('guide.rateChartTitle')}</Text>
      <Muted>{t('guide.rateChartNote')}</Muted>
      <View style={{ marginTop: 10 }}>
        <Text style={{ fontWeight: '700', color: COLORS.muted, fontSize: 12 }}>{t('guide.chartPackage')} · {t('guide.chartDuration')}</Text>
        {PACKAGES.map((pkg) => (<View key={pkg.id} style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: '700', color: COLORS.text }}>{t(pkg.nameKey)} · {t(pkg.durationKey)}</Text>
            <Muted>{t('guide.chartGuideOnly')}: {formatCurrency(pkg.guideOnly)}</Muted>
            <Muted>{t('guide.chartGuideBike')}: {formatCurrency(pkg.withBike)}</Muted>
          </View>))}
      </View>
      <Text style={{ fontWeight: '800', color: COLORS.text, marginTop: 14 }}>{t('guide.sightseeingTitle')}</Text>
      <Muted>{t('guide.sightseeingNote')}</Muted>
      {TOURS.map((tour) => {
            const four = spots(t(tour.fourKey, { returnObjects: true }));
            const eight = spots(t(tour.eightKey, { returnObjects: true }));
            return (<View key={tour.id} style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: '700', color: COLORS.text }}>{t(tour.nameKey)}</Text>
            {tour.halfDayKey ? <Muted>{t(tour.halfDayKey)}</Muted> : null}
            <Text style={{ marginTop: 4, fontWeight: '700', color: COLORS.primary, fontSize: 12 }}>{t('guide.chartFourHour')}</Text>
            {four.map((spot) => <Muted key={`${tour.id}-4-${spot}`}>• {spot}</Muted>)}
            <Text style={{ marginTop: 4, fontWeight: '700', color: COLORS.primary, fontSize: 12 }}>{t('guide.chartEightHour')}</Text>
            {eight.map((spot) => <Muted key={`${tour.id}-8-${spot}`}>• {spot}</Muted>)}
            {tour.noteKey ? <Muted>{t(tour.noteKey)}</Muted> : null}
          </View>);
        })}
      <Muted>{t('guide.openRateHint')}</Muted>
      <Muted>{t('guide.overtimeNote', { rate: formatCurrency(150) })}</Muted>
    </Card>);
}
