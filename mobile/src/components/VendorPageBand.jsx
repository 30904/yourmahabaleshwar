import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import { useDeviceInsets } from '../utils/deviceInsets';

export default function VendorPageBand({ title, pill, line }) {
    const insets = useDeviceInsets();

    return (
        <View>
            <View style={[styles.band, { paddingTop: insets.top + 16 }]}>
                <View style={styles.bandRow}>
                    <Text style={styles.pageTitle}>{title}</Text>
                    {pill ? (
                        <View style={styles.countPill}>
                            <Text style={styles.countPillText}>{pill}</Text>
                        </View>
                    ) : null}
                </View>
            </View>
            {line ? <Text style={styles.note}>{line}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    band: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingBottom: 18 },
    bandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    pageTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 26, color: '#fff', letterSpacing: -0.4 },
    countPill: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    countPillText: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.primary },
    note: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, lineHeight: 20, paddingHorizontal: 16, paddingTop: 12 },
});
