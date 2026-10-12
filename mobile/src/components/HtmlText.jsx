import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

function decode(value) {
    return String(value || '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'");
}

function plain(html) {
    return decode(String(html || '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function blocks(html) {
    const source = String(html || '');
    const found = [];
    const pattern = /<(h1|h2|h3|p|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let match = pattern.exec(source);
    while (match) {
        found.push({ tag: match[1].toLowerCase(), html: match[2] });
        match = pattern.exec(source);
    }
    if (!found.length && plain(source)) found.push({ tag: 'p', html: source });
    return found;
}

function Inline({ html, style }) {
    const source = String(html || '');
    const pattern = /<br\s*\/?>|<(strong|b|em|i)\b[^>]*>([\s\S]*?)<\/\2>/gi;
    const nodes = [];
    let last = 0;
    let index = 0;
    let match = pattern.exec(source);
    while (match) {
        if (match.index > last) nodes.push(decode(source.slice(last, match.index).replace(/<[^>]+>/g, '')));
        if (/^<br/i.test(match[0])) nodes.push('\n');
        else if (match[1] === 'em' || match[1] === 'i') {
            nodes.push(<Text key={index} style={styles.em}>{plain(match[3])}</Text>);
        }
        else nodes.push(<Text key={index} style={styles.strong}>{plain(match[3])}</Text>);
        index += 1;
        last = match.index + match[0].length;
        match = pattern.exec(source);
    }
    if (last < source.length) nodes.push(decode(source.slice(last).replace(/<[^>]+>/g, '')));
    const text = nodes.filter((node) => node !== '');
    if (!text.length) return null;
    return <Text style={style}>{text}</Text>;
}

export default function HtmlText({ html }) {
    const items = blocks(html);
    if (!items.length) return null;
    return (
        <View>
            {items.map((block, index) => {
                if (block.tag === 'h1' || block.tag === 'h2') {
                    const title = plain(block.html);
                    if (!title) return null;
                    return <Text key={index} style={styles.h2}>{title}</Text>;
                }
                if (block.tag === 'h3') {
                    const title = plain(block.html);
                    if (!title) return null;
                    return <Text key={index} style={styles.h3}>{title}</Text>;
                }
                if (block.tag === 'ul' || block.tag === 'ol') {
                    const points = [...block.html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)];
                    if (!points.length) return null;
                    return (
                        <View key={index} style={styles.list}>
                            {points.map((point, pointIndex) => (
                                <View key={pointIndex} style={styles.item}>
                                    <Text style={styles.bullet}>{block.tag === 'ol' ? `${pointIndex + 1}.` : '•'}</Text>
                                    <Inline html={point[1]} style={styles.itemText} />
                                </View>
                            ))}
                        </View>
                    );
                }
                return <Inline key={index} html={block.html} style={styles.p} />;
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    h2: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: COLORS.text,
        lineHeight: 24,
        marginTop: 14,
        marginBottom: 6,
    },
    h3: {
        fontFamily: FONTS.semibold,
        fontSize: 16,
        color: COLORS.text,
        lineHeight: 22,
        marginTop: 12,
        marginBottom: 4,
    },
    p: {
        fontFamily: FONTS.regular,
        fontSize: 15,
        color: '#475569',
        lineHeight: 22,
        marginBottom: 8,
    },
    strong: { fontFamily: FONTS.semibold, color: COLORS.text },
    em: { fontStyle: 'italic' },
    list: { marginBottom: 8, gap: 6 },
    item: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    bullet: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.primary, lineHeight: 22 },
    itemText: { flex: 1, fontFamily: FONTS.regular, fontSize: 15, color: '#475569', lineHeight: 22 },
});
