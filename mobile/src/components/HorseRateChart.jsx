import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Muted } from './ui';
import { COLORS } from '../constants/theme';
import { formatCurrency } from '../utils/format';

const PACKAGES = [
    { id: 'sightseeing', price: 800, nameKey: 'horse.packages.sightseeing.name', detailsKey: 'horse.packages.sightseeing.details' },
    { id: 'point_to_point', price: 500, nameKey: 'horse.packages.pointToPoint.name', detailsKey: 'horse.packages.pointToPoint.details' },
    { id: 'jungle_trail', price: 1200, nameKey: 'horse.packages.jungleTrail.name', detailsKey: 'horse.packages.jungleTrail.details' },
    { id: 'sunset_sunrise', price: 1000, nameKey: 'horse.packages.sunsetSunrise.name', detailsKey: 'horse.packages.sunsetSunrise.details' },
    { id: 'kids', price: 400, nameKey: 'horse.packages.kids.name', detailsKey: 'horse.packages.kids.details' },
];

export default function HorseRateChart() {
    const { t } = useTranslation();
    return (<Card>
      <Text style={{ fontWeight: '800', color: COLORS.text }}>{t('horse.rateChartTitle')}</Text>
      <Muted>{t('horse.openRateHint')}</Muted>
      {PACKAGES.map((pkg) => (<View key={pkg.id} style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: '700', color: COLORS.text }}>{t(pkg.nameKey)}</Text>
          <Muted>{t(pkg.detailsKey)} · {formatCurrency(pkg.price)}</Muted>
        </View>))}
    </Card>);
}
