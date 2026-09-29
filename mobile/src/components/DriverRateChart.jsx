import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Muted } from './ui';
import { COLORS } from '../constants/theme';
import { formatCurrency } from '../utils/format';

export const DRIVER_PACKAGES = [
    { id: 'local_4hr', price: 700, nameKey: 'driver.packages.local4hr.name', detailsKey: 'driver.packages.local4hr.details' },
    { id: 'local_8hr', price: 1200, nameKey: 'driver.packages.local8hr.name', detailsKey: 'driver.packages.local8hr.details' },
    { id: 'outstation_12hr', price: 1600, nameKey: 'driver.packages.outstation12hr.name', detailsKey: 'driver.packages.outstation12hr.details' },
];

const EXTRAS = [
    { key: 'driver.overtime', amount: 150 },
    { key: 'driver.night', amount: 200 },
    { key: 'driver.oneWayLuxury', amount: 100 },
];

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

export function driverPackagePrice(packageId) {
    return DRIVER_PACKAGES.find((pkg) => pkg.id === packageId)?.price ?? DRIVER_PACKAGES[0].price;
}

export default function DriverRateChart({ selectedPackage, onSelectPackage }) {
    const { t } = useTranslation();
    return (<Card>
      <Text style={{ fontWeight: '800', color: COLORS.text }}>{t('driver.rateChartTitle')}</Text>
      <Muted>{t('driver.openRateHint')}</Muted>
      {DRIVER_PACKAGES.map((pkg) => {
            const selected = selectedPackage === pkg.id;
            const body = (<>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>{t(pkg.nameKey)}</Text>
              <Muted>{t(pkg.detailsKey)} · {formatCurrency(pkg.price)}</Muted>
            </>);
            return onSelectPackage ? (<Pressable key={pkg.id} onPress={() => onSelectPackage(pkg.id)} style={choiceStyle(selected)}>{body}</Pressable>) : (<View key={pkg.id} style={{ marginTop: 10 }}>{body}</View>);
        })}
      <View style={{ marginTop: 10 }}>
        <Text style={{ fontWeight: '700', color: COLORS.text }}>{t('driver.packages.outstationOneway.name')}</Text>
        <Muted>{t('driver.packages.outstationOneway.details')}</Muted>
        <Muted>{t('driver.separateQuote')}</Muted>
      </View>
      <Text style={{ fontWeight: '800', color: COLORS.text, marginTop: 12 }}>{t('driver.extraChargesTitle')}</Text>
      {EXTRAS.map((extra) => (<Muted key={extra.key}>{t(extra.key)} · {formatCurrency(extra.amount)}</Muted>))}
    </Card>);
}

export function DriverBookingIntro() {
    const { t } = useTranslation();
    const steps = [t('driver.step1'), t('driver.step2'), t('driver.step3')];
    const features = [t('driver.feature1'), t('driver.feature2'), t('driver.feature3')];
    return (<View>
      <Text style={{ fontWeight: '800', color: COLORS.text, fontSize: 18, marginBottom: 6 }}>{t('driver.title')}</Text>
      <Muted>{t('driver.hubDesc')}</Muted>
      <Muted>{t('driver.noVendorPick')}</Muted>
      <Card>
        <Text style={{ fontWeight: '800', color: COLORS.text }}>{t('driver.howItWorks')}</Text>
        {steps.map((step, index) => (<Muted key={step}>{index + 1}. {step}</Muted>))}
      </Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {features.map((feature) => (<Text key={feature} style={{ backgroundColor: COLORS.primarySoft, color: COLORS.primary, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '600' }}>{feature}</Text>))}
      </View>
      <DriverRateChart />
    </View>);
}
