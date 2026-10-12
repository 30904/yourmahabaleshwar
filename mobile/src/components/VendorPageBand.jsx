import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export default function VendorPageBand({ title, pill, line }) {
    return (
        <View>
            <View style={styles.band}>
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
    band: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
    bandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    pageTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 26, color: '#fff', letterSpacing: -0.4 },
    countPill: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    countPillText: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.primary },
    note: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, lineHeight: 20, paddingHorizontal: 16, paddingTop: 12 },
});
