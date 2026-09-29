import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createBooking, getBySlug } from '../../api/endpoints';
import DriverRateChart, { driverPackagePrice } from '../../components/DriverRateChart';
import GuideRateChart from '../../components/GuideRateChart';
import TaxiRateChart from '../../components/TaxiRateChart';
import { Button, Card, Field, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { formatTime12, listingPlace, listingPrice, mediaUrl } from '../../utils/listing';
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
    const [roomId, setRoomId] = useState(null);
    const [guidePackage, setGuidePackage] = useState('6HR');
    const [bikeAddon, setBikeAddon] = useState(false);
    const [taxiTrip, setTaxiTrip] = useState('PER_TRIP');
    const [taxiCar, setTaxiCar] = useState('AC_4_SEATER');
    const [taxiRoute, setTaxiRoute] = useState('tour_mahabaleshwar_1');
    const [driverPackage, setDriverPackage] = useState('local_4hr');
    const [photoIndex, setPhotoIndex] = useState(0);
    useEffect(() => {
        getBySlug(path, slug)
            .then((data) => {
            const stay = data?.hotel ? { ...data.hotel, rooms: data.rooms || data.hotel.rooms || [] } : data;
            setItem(stay);
            const firstRoom = stay?.rooms?.[0];
            if (firstRoom?._id) setRoomId(firstRoom._id);
        })
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
                const chosen = (item.rooms || []).find((room) => String(room._id) === String(roomId)) || item.rooms?.[0];
                if (chosen?._id)
                    body.roomId = chosen._id;
            }
            else if (type === 'HOMESTAY') {
                body.homestayId = item._id;
                const chosen = (item.rooms || []).find((room) => String(room._id) === String(roomId)) || item.rooms?.[0];
                if (chosen?._id)
                    body.roomId = chosen._id;
            }
            else if (type === 'TENT')
                body.tentId = item._id;
            else if (type === 'GUIDE') {
                body.guideId = item._id;
                body.guidePackage = guidePackage;
                body.bikeAddon = bikeAddon;
                body.checkIn = checkIn;
            }
            else if (type === 'TAXI') {
                body.driverId = item._id;
                body.taxiType = taxiTrip;
                body.carType = taxiCar;
                body.routeId = taxiRoute;
                if (taxiTrip === 'HOURLY')
                    body.hours = Number(guests) || 1;
                body.checkIn = checkIn;
            }
            else if (type === 'DRIVER') {
                body.driverId = item._id;
                body.serviceTenant = 'DRIVER';
                body.driverPackage = driverPackage;
                body.taxiType = 'PER_TRIP';
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
    const photoSource = item.images?.length
        ? item.images
        : (item.rooms || []).flatMap((room) => room.images || []);
    const images = photoSource.map(mediaUrl).filter(Boolean);
    const rooms = item.rooms || [];
    const selectedRoom = rooms.find((room) => String(room._id) === String(roomId)) || rooms[0];
    const guideBase = guidePackage === '12HR' ? item.package12hr : item.package6hr;
    const taxiAmount = Number(taxiTrip === 'HOURLY' ? item.hourlyRate : item.perTripPrice);
    const nightPrice = type === 'GUIDE'
        ? (Number(guideBase) || 0) + (bikeAddon ? (Number(item.bikeAddonPrice) || 0) : 0)
        : type === 'TAXI'
            ? (Number.isFinite(taxiAmount) ? taxiAmount : null)
            : type === 'DRIVER'
                ? driverPackagePrice(driverPackage)
                : (selectedRoom?.basePrice ?? listingPrice(item));
    return (<Screen>
      <ScrollView>
        {images[0] ? (<Pressable onPress={() => images.length > 1 && setPhotoIndex((i) => (i + 1) % images.length)}>
            <Image source={{ uri: images[photoIndex] || images[0] }} style={{ height: 220, borderRadius: 14, marginBottom: 8 }}/>
            {images.length > 1 ? <Muted>{photoIndex + 1}/{images.length}</Muted> : null}
          </Pressable>) : null}
        <Title>{item.name}</Title>
        {(type === 'HOTEL' || type === 'RESORT') && (<Muted>{type === 'RESORT' || item.type === 'RESORT' ? t('nav.resorts') : t('nav.hotels')}</Muted>)}
        {type === 'HOMESTAY' && <Muted>{t('nav.homestays')}</Muted>}
        {type === 'TENT' && <Muted>{t('nav.tents')}</Muted>}
        {type === 'GUIDE' && <Muted>{t('nav.guides')}</Muted>}
        {type === 'TAXI' && <Muted>{t('nav.taxi')}</Muted>}
        {type === 'DRIVER' && <Muted>{t('nav.drivers')}</Muted>}
        <Muted>{listingPlace(item, type)}</Muted>
        {type === 'GUIDE' && item.languages?.length > 0 && <Muted>{t('guide.languages')}: {item.languages.join(', ')}</Muted>}
        {type === 'TENT' && (<Muted>{t('listing.tentCapacity', { guests: item.capacity || 2, count: item.totalTents || 1 })}</Muted>)}
        {nightPrice != null ? (<Text style={{ marginTop: 8, fontWeight: '800', fontSize: 20, color: COLORS.primary }}>
            {formatCurrency(nightPrice)}
            {(type === 'HOMESTAY' || type === 'TENT') ? <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.muted }}> {t('listing.perNight')}</Text> : null}
            {type === 'TAXI' ? <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.muted }}> {taxiTrip === 'HOURLY' ? t('taxi.hourlyShort') : t('taxi.perTripShort')}</Text> : null}
          </Text>) : null}
        {(type === 'HOMESTAY' || type === 'TENT') && item.amenities?.length > 0 && (<View style={{ marginTop: 10 }}>
            <Text style={{ fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>{t('listing.amenities')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {item.amenities.map((amenity) => (<Text key={amenity} style={{ backgroundColor: COLORS.primarySoft, color: COLORS.primary, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '600' }}>{amenity}</Text>))}
            </View>
          </View>)}
        {type === 'GUIDE' && item.specialties?.length > 0 && (<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {item.specialties.map((specialty) => (<Text key={specialty} style={{ backgroundColor: COLORS.primarySoft, color: COLORS.primary, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '600' }}>{specialty}</Text>))}
          </View>)}
        {type === 'TAXI' && item.serviceArea ? <Muted>{t('taxi.serviceArea')}: {item.serviceArea}</Muted> : null}
        {type === 'TAXI' ? <Muted>{item.description || t('taxi.description')}</Muted> : (item.bio || item.description) ? <Muted>{item.bio || item.description}</Muted> : null}
        {(type === 'HOMESTAY' || type === 'TENT') && (<Card>
            <Muted>{t('listing.checkTimes', { in: formatTime12(item.checkInTime || '14:00'), out: formatTime12(item.checkOutTime || '11:00') })}</Muted>
            <Text style={{ fontWeight: '700', color: COLORS.text, marginTop: 10 }}>{t('listing.cancellation')}</Text>
            <Muted>{(typeof item.cancellationPolicyText === 'string' && item.cancellationPolicyText)
            || (typeof item.cancellationPolicy === 'string' && item.cancellationPolicy)
            || t(type === 'TENT' ? 'listing.freeCancellationRates' : 'listing.freeCancellation')}</Muted>
            {type === 'HOMESTAY' && item.houseRules?.length > 0 && (<>
                <Text style={{ fontWeight: '700', color: COLORS.text, marginTop: 10 }}>{t('listing.houseRules')}</Text>
                {item.houseRules.map((rule) => <Muted key={rule}>{rule}</Muted>)}
              </>)}
          </Card>)}
        {type === 'GUIDE' && (<Card>
            <Text style={{ fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>{t('guide.thisGuide')}</Text>
            {['6HR', '12HR'].map((code) => {
                const selected = guidePackage === code;
                const amount = code === '12HR' ? item.package12hr : item.package6hr;
                return (<Pressable key={code} onPress={() => setGuidePackage(code)} style={{
                    padding: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: selected ? COLORS.primary : COLORS.border,
                    marginBottom: 8,
                    backgroundColor: selected ? COLORS.primarySoft : '#fff',
                }}>
                  <Text style={{ fontWeight: '700', color: COLORS.text }}>{code === '12HR' ? t('guide.package12hr') : t('guide.package6hr')}</Text>
                  {amount != null ? <Muted>{formatCurrency(amount)}</Muted> : null}
                </Pressable>);
            })}
            <Pressable onPress={() => setBikeAddon((value) => !value)} style={{
                padding: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: bikeAddon ? COLORS.primary : COLORS.border,
                backgroundColor: bikeAddon ? COLORS.primarySoft : '#fff',
            }}>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>{t('guide.bikeAddon', { price: formatCurrency(item.bikeAddonPrice || 0) })}</Text>
            </Pressable>
          </Card>)}
        {type === 'GUIDE' && <GuideRateChart />}
        {type === 'TAXI' && (<Card>
            <Text style={{ fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>{t('taxi.thisTaxi')}</Text>
            {['PER_TRIP', 'HOURLY'].map((code) => {
                const selected = taxiTrip === code;
                const amount = code === 'HOURLY' ? item.hourlyRate : item.perTripPrice;
                return (<Pressable key={code} onPress={() => setTaxiTrip(code)} style={{
                    padding: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: selected ? COLORS.primary : COLORS.border,
                    marginBottom: 8,
                    backgroundColor: selected ? COLORS.primarySoft : '#fff',
                }}>
                  <Text style={{ fontWeight: '700', color: COLORS.text }}>{code === 'HOURLY' ? t('taxi.hourly') : t('taxi.perTrip')}</Text>
                  {amount != null ? <Muted>{formatCurrency(amount)}{code === 'HOURLY' ? t('taxi.hourlyShort') : ''}</Muted> : null}
                </Pressable>);
            })}
          </Card>)}
        {type === 'TAXI' && <TaxiRateChart selectedCar={taxiCar} onSelectCar={setTaxiCar} selectedRoute={taxiRoute} onSelectRoute={setTaxiRoute} />}
        {type === 'DRIVER' && <DriverRateChart selectedPackage={driverPackage} onSelectPackage={setDriverPackage} />}
        {rooms.length > 0 && (<Card>
            <Text style={{ fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>Rooms</Text>
            {rooms.map((room) => {
                const selected = String(room._id) === String(selectedRoom?._id);
                return (<Pressable key={room._id} onPress={() => setRoomId(room._id)} style={{
                    padding: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: selected ? COLORS.primary : COLORS.border,
                    marginBottom: 8,
                    backgroundColor: selected ? COLORS.primarySoft : '#fff',
                }}>
                  <Text style={{ fontWeight: '700', color: COLORS.text }}>{room.name}</Text>
                  {room.basePrice != null ? <Muted>{formatCurrency(room.basePrice)}</Muted> : null}
                </Pressable>);
            })}
          </Card>)}
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
