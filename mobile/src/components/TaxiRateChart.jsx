import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Muted } from './ui';
import { COLORS } from '../constants/theme';
import { formatCurrency } from '../utils/format';

const CARS = [
    { id: 'AC_4_SEATER', key: 'taxi.carTypes.ac4' },
    { id: 'AC_7_SEATER', key: 'taxi.carTypes.ac7' },
    { id: 'NON_AC_4_SEATER', key: 'taxi.carTypes.nonAc4' },
    { id: 'NON_AC_7_SEATER', key: 'taxi.carTypes.nonAc7' },
    { id: 'MINI_TRAVELS_19_SEATER', key: 'taxi.carTypes.miniTravels19' },
];

const TOURS = [
    { id: 'tour_mahabaleshwar_1', price: 1200, key: 'mahabaleshwar1' },
    { id: 'tour_mahabaleshwar_2', price: 1200, key: 'mahabaleshwar2' },
    { id: 'tour_pratapgad', price: 1600, key: 'pratapgad' },
    { id: 'tour_panchgani', price: 1200, key: 'panchgani' },
    { id: 'tour_panchgani_wai', price: 2500, key: 'panchganiWai' },
    { id: 'tour_tapola', price: 1450, key: 'tapola' },
];

const ROUTES = [
    { id: 'local_5km', nameKey: 'taxi.chartRows.local5km', dropId: 'local_5km_drop', drop: 400, returnId: 'local_5km_return', return: 800 },
    { id: 'mapro', nameKey: 'taxi.chartRows.mapro', dropId: 'mapro_drop', drop: 600, returnId: 'mapro_return', return: 800 },
    { id: 'panchgani_wai', nameKey: 'taxi.chartRows.panchganiWai', dropId: 'panchgani_wai_drop', drop: 800, returnId: 'panchgani_wai_return', return: 1200 },
    { id: 'satara', nameKey: 'taxi.chartRows.satara', dropId: 'satara_drop', drop: 2000, returnId: 'satara_return', return: 2300, toll: true },
    { id: 'pune', nameKey: 'taxi.chartRows.pune', dropId: 'pune_drop', drop: 3400, returnId: 'pune_return', return: 4000, toll: true },
    { id: 'poladpur', nameKey: 'taxi.chartRows.poladpur', dropId: 'poladpur_drop', drop: 2000, returnId: 'poladpur_return', return: 2300, toll: true },
    { id: 'raigad', nameKey: 'taxi.chartRows.raigad', returnId: 'raigad', return: 3500, toll: true },
    { id: 'khed', nameKey: 'taxi.chartRows.khed', dropId: 'khed_drop', drop: 3000, returnId: 'khed_return', return: 3500, toll: true },
    { id: 'mumbai', nameKey: 'taxi.chartRows.mumbai', dropId: 'mumbai_drop', drop: 16000, returnId: 'mumbai_return', return: 17000, toll: true },
];

const COASTAL = [
    { id: 'alibag', price: 15000, nameKey: 'taxi.alibag' },
    { id: 'matheran', price: 17500, nameKey: 'taxi.matheran' },
    { id: 'ganpatipule', price: 16000, nameKey: 'taxi.ganpatipule' },
];

function spots(value) {
    return Array.isArray(value) ? value : [];
}

function choiceStyle(selected) {
    return {
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: selected ? COLORS.primary : COLORS.border,
        marginBottom: 8,
        backgroundColor: selected ? COLORS.primarySoft : '#fff',
    };
}

export default function TaxiRateChart({ selectedCar, onSelectCar, selectedRoute, onSelectRoute }) {
    const { t } = useTranslation();
    const pick = (id) => onSelectRoute && onSelectRoute(id);
    return (<Card>
      <Text style={{ fontWeight: '800', color: COLORS.text }}>{t('taxi.carTypeLabel')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {CARS.map((car) => {
            const selected = selectedCar === car.id;
            const label = t(car.key);
            return onSelectCar ? (<Pressable key={car.id} onPress={() => onSelectCar(car.id)} style={choiceStyle(selected)}>
              <Text style={{ fontWeight: '700', color: COLORS.text, fontSize: 12 }}>{label}</Text>
            </Pressable>) : (<Text key={car.id} style={{ backgroundColor: COLORS.primarySoft, color: COLORS.primary, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '600' }}>{label}</Text>);
        })}
      </View>
      <Text style={{ fontWeight: '800', color: COLORS.text, marginTop: 8 }}>{t('taxi.rateChartTitle')}</Text>
      <Muted>{t('taxi.openRateHint')}</Muted>
      <Text style={{ fontWeight: '800', color: COLORS.text, marginTop: 12 }}>{t('taxi.localToursTitle')}</Text>
      <Muted>{t('taxi.localToursNote')}</Muted>
      {TOURS.map((tour) => {
            const selected = selectedRoute === tour.id;
            const points = spots(t(`taxi.tours.${tour.key}.points`, { returnObjects: true }));
            const body = (<>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>{t(`taxi.tours.${tour.key}.name`)}</Text>
              <Muted>{t('taxi.chartDuration')}: {t(`taxi.tours.${tour.key}.duration`)} · {formatCurrency(tour.price)}</Muted>
              <Text style={{ marginTop: 4, fontWeight: '700', color: COLORS.primary, fontSize: 12 }}>{t('taxi.chartKeyPoints')}</Text>
              {points.map((point) => <Muted key={`${tour.id}-${point}`}>• {point}</Muted>)}
              {t(`taxi.tours.${tour.key}.note`, { defaultValue: '' }) ? <Muted>{t(`taxi.tours.${tour.key}.note`)}</Muted> : null}
            </>);
            return onSelectRoute ? (<Pressable key={tour.id} onPress={() => pick(tour.id)} style={{ ...choiceStyle(selected), marginTop: 8 }}>{body}</Pressable>) : (<View key={tour.id} style={{ marginTop: 10 }}>{body}</View>);
        })}
      <Text style={{ fontWeight: '800', color: COLORS.text, marginTop: 12 }}>{t('taxi.outstationTitle')}</Text>
      <Muted>{t('taxi.outstationNote')}</Muted>
      {ROUTES.map((route) => (<View key={route.id} style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: '700', color: COLORS.text }}>{t(route.nameKey)}{route.toll ? ` ${t('taxi.tollExtra')}` : ''}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            {route.drop != null && (onSelectRoute ? (<Pressable onPress={() => pick(route.dropId)} style={choiceStyle(selectedRoute === route.dropId)}>
                <Text style={{ fontWeight: '700', color: COLORS.text }}>{t('taxi.chartDrop')}</Text>
                <Muted>{formatCurrency(route.drop)}</Muted>
              </Pressable>) : (<Muted>{t('taxi.chartDrop')}: {formatCurrency(route.drop)}</Muted>))}
            {route.return != null && (onSelectRoute ? (<Pressable onPress={() => pick(route.returnId)} style={choiceStyle(selectedRoute === route.returnId)}>
                <Text style={{ fontWeight: '700', color: COLORS.text }}>{t('taxi.chartReturn')}</Text>
                <Muted>{formatCurrency(route.return)}</Muted>
              </Pressable>) : (<Muted>{t('taxi.chartReturn')}: {formatCurrency(route.return)}</Muted>))}
          </View>
        </View>))}
      <Text style={{ fontWeight: '700', color: COLORS.text, marginTop: 8 }}>{t('taxi.chartRows.coastal')} {t('taxi.tollExtra')}</Text>
      <Muted>{t('taxi.chartRows.coastalRates')}</Muted>
      {onSelectRoute && (<View style={{ marginTop: 8 }}>
          {COASTAL.map((route) => (<Pressable key={route.id} onPress={() => pick(route.id)} style={choiceStyle(selectedRoute === route.id)}>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>{t(route.nameKey)}</Text>
              <Muted>{formatCurrency(route.price)}</Muted>
            </Pressable>))}
        </View>)}
    </Card>);
}
