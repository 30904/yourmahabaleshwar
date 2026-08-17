import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createBooking, getBySlug } from '../../api/endpoints';
import { Button, Card, Field, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
function tomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
}
function dayAfter() {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
}
export default function ListingDetailScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { path, slug, type } = route.params;
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [checkIn, setCheckIn] = useState(tomorrow());
    const [checkOut, setCheckOut] = useState(dayAfter());
    const [guests, setGuests] = useState('2');
    useEffect(() => {
        getBySlug(path, slug)
            .then(setItem)
            .catch(() => setItem(null))
            .finally(() => setLoading(false));
    }, [path, slug]);
    const onBook = async () => {
        if (!user) {
            Alert.alert(t('auth.signIn'), 'Please sign in to book');
            navigation.navigate('Auth');
            return;
        }
        setBooking(true);
        try {
            const body = {
                checkIn,
                checkOut,
                guests: Number(guests) || 2,
            };
            if (type === 'HOTEL' || type === 'RESORT') {
                body.hotelId = item._id;
                if (item.rooms?.[0]?._id)
                    body.roomId = item.rooms[0]._id;
            }
            else if (type === 'HOMESTAY')
                body.homestayId = item._id;
            else if (type === 'TENT')
                body.tentId = item._id;
            else if (type === 'GUIDE') {
                body.guideId = item._id;
                body.guidePackage = '6HR';
                body.checkIn = checkIn;
            }
            else if (type === 'TAXI') {
                body.driverId = item._id;
                body.taxiType = 'TRIP';
                body.checkIn = checkIn;
            }
            else if (type === 'HORSE') {
                body.horseId = item._id;
                body.checkIn = checkIn;
            }
            else if (type === 'PRODUCT') {
                body.productId = item._id;
                body.quantity = Number(guests) || 1;
            }
            else if (type === 'COMBO') {
                body.comboId = item._id;
                body.checkIn = checkIn;
            }
            const created = await createBooking(type, body);
            Alert.alert('Booked', created.bookingNumber || 'Booking created');
            navigation.navigate('MainTabs', { screen: 'Bookings' });
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
        finally {
            setBooking(false);
        }
    };
    if (loading)
        return <Loading />;
    if (!item) {
        return (<Screen>
        <Muted>{t('common.error')}</Muted>
      </Screen>);
    }
    return (<Screen>
      <ScrollView>
        {item.images?.[0] ? (<Image source={{ uri: item.images[0] }} style={{ height: 200, borderRadius: 14, marginBottom: 12 }}/>) : null}
        <Title>{item.name}</Title>
        <Muted>{item.description || item.address?.city || 'Mahabaleshwar'}</Muted>
        <Card>
          <Text style={{ fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>{t('booking.bookNow')}</Text>
          <Field label={t('booking.checkIn')} value={checkIn} onChangeText={setCheckIn} placeholder="YYYY-MM-DD"/>
          {(type === 'HOTEL' || type === 'RESORT' || type === 'HOMESTAY' || type === 'TENT') && (<Field label={t('booking.checkOut')} value={checkOut} onChangeText={setCheckOut} placeholder="YYYY-MM-DD"/>)}
          <Field label={t('booking.guests')} value={guests} onChangeText={setGuests} keyboardType="numeric"/>
          <Button title={t('booking.bookNow')} onPress={onBook} loading={booking}/>
        </Card>
      </ScrollView>
    </Screen>);
}
