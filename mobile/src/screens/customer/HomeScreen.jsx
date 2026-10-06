import React from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HomeHeader from '../../components/home/HomeHeader';
import HomeHero from '../../components/home/HomeHero';
import { HomeCategoryStrip, HomeDeals, HomeDestinations, HomePromo, HomePropertyTabs, HomeServices, HomeWhyBook } from '../../components/home/HomeSections';
import HomeFooter from '../../components/home/HomeFooter';
import { Screen } from '../../components/ui';

export default function HomeScreen() {
    const navigation = useNavigation();
    return (
        <Screen style={{ padding: 0 }}>
            <HomeHeader navigation={navigation} />
            <ScrollView>
                <HomeHero navigation={navigation} />
                <HomeCategoryStrip navigation={navigation} />
                <HomeDeals navigation={navigation} />
                <HomePropertyTabs navigation={navigation} />
                <HomePromo navigation={navigation} />
                <HomeDestinations navigation={navigation} />
                <HomeServices navigation={navigation} />
                <HomeWhyBook />
                <HomeFooter navigation={navigation} />
            </ScrollView>
        </Screen>
    );
}
