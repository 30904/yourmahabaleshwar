import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';

export default function SectionHeader({ eyebrow, title, subtitle, linkLabel, onPress }) {
    return (
        <View style={styles.row}>
            <View style={styles.copy}>
                {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {onPress && linkLabel ? (
                <Pressable onPress={onPress} hitSlop={8}>
                    <Text style={styles.link}>{linkLabel} →</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
    copy: { flex: 1 },
    eyebrow: {
        fontFamily: FONTS.bold,
        fontSize: 12,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: COLORS.primary,
        marginBottom: 4,
    },
    title: { fontFamily: FONTS.bold, fontSize: 24, color: COLORS.text, letterSpacing: -0.4 },
    subtitle: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.muted, marginTop: 4, lineHeight: 21 },
    link: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.action },
});
