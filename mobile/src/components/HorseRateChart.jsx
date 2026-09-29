import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Muted } from './ui';
import { COLORS } from '../constants/theme';
import { formatCurrency } from '../utils/format';

export const HORSE_CHART_PACKAGES = [
    { id: 'sightseeing', price: 800, nameKey: 'horse.packages.sightseeing.name', detailsKey: 'horse.packages.sightseeing.details' },
    { id: 'point_to_point', price: 500, nameKey: 'horse.packages.pointToPoint.name', detailsKey: 'horse.packages.pointToPoint.details' },
    { id: 'jungle_trail', price: 1200, nameKey: 'horse.packages.jungleTrail.name', detailsKey: 'horse.packages.jungleTrail.details' },
    { id: 'sunset_sunrise', price: 1000, nameKey: 'horse.packages.sunsetSunrise.name', detailsKey: 'horse.packages.sunsetSunrise.details' },
    { id: 'kids', price: 400, nameKey: 'horse.packages.kids.name', detailsKey: 'horse.packages.kids.details' },
];

export function horseChartPrice(packageId) {
    return HORSE_CHART_PACKAGES.find((pkg) => pkg.id === packageId)?.price ?? HORSE_CHART_PACKAGES[0].price;
}

function choiceStyle(selected) {
    return {
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: selected ? COLORS.primary : COLORS.border,
        marginTop: 8,
        backgroundColor: selected ? COLORS.primarySoft : '#fff',
    };
}

export default function HorseRateChart({ selectedPackage, onSelectPackage }) {
    const { t } = useTranslation();
    return (<Card>
      <Text style={{ fontWeight: '800', color: COLORS.text }}>{t('horse.rateChartTitle')}</Text>
      <Muted>{t('horse.openRateHint')}</Muted>
      {HORSE_CHART_PACKAGES.map((pkg) => {
            const selected = selectedPackage === pkg.id;
            const body = (<>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>{t(pkg.nameKey)}</Text>
              <Muted>{t(pkg.detailsKey)} · {formatCurrency(pkg.price)}</Muted>
            </>);
            return onSelectPackage ? (<Pressable key={pkg.id} onPress={() => onSelectPackage(pkg.id)} style={choiceStyle(selected)}>{body}</Pressable>) : (<View key={pkg.id} style={{ marginTop: 10 }}>{body}</View>);
        })}
    </Card>);
}
