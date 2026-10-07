import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

function to24(hour12, minute, period) {
    let hour = Number(hour12) % 12;
    if (period === 'PM') hour += 12;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function from24(value) {
    const [rawHour, rawMinute] = String(value || '09:00').split(':').map(Number);
    const hour = Number.isFinite(rawHour) ? rawHour : 9;
    const minute = Number.isFinite(rawMinute) ? Math.min(59, Math.max(0, rawMinute)) : 0;
    const period = hour >= 12 ? 'PM' : 'AM';
    return { hour12: hour % 12 || 12, minute, period };
}

export function LanguageToggle() {
    const { i18n } = useTranslation();
    const current = i18n.language?.startsWith('mr') ? 'mr' : 'en';
    const pick = (lng) => {
        i18n.changeLanguage(lng);
        if (typeof localStorage !== 'undefined') localStorage.setItem('lang', lng);
    };
    return (
        <View style={styles.langRow}>
            {[['en', 'EN'], ['mr', 'मर']].map(([code, label]) => (
                <Pressable key={code} onPress={() => pick(code)} style={[styles.langBtn, current === code && styles.langBtnOn]}>
                    <Text style={[styles.langText, current === code && styles.langTextOn]}>{label}</Text>
                </Pressable>
            ))}
        </View>
    );
}

export function FormHeader({ title, subtitle, dateLabel }) {
    const { t } = useTranslation();
    return (
        <View style={styles.head}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <View style={styles.headSide}>
                <LanguageToggle />
                <Text style={styles.dateLine}>{dateLabel || t('stayGuestBooking.formDate')}: {new Date().toLocaleDateString('en-IN')}</Text>
            </View>
        </View>
    );
}

export function DateField({ label, value, onChange }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            {Platform.OS === 'web' ? React.createElement('input', {
                type: 'date',
                value: value || '',
                onChange: (event) => onChange(event.target.value),
                style: webInput,
            }) : (
                <TextInput value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.muted} style={styles.input} />
            )}
        </View>
    );
}

export function TimeField({ label, value, onChange }) {
    const parsed = from24(value);
    const emit = (next) => onChange(to24(next.hour12, next.minute, next.period));
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.timeRow}>
                {Platform.OS === 'web' ? (
                    <>
                        {React.createElement('select', {
                            value: parsed.hour12,
                            onChange: (event) => emit({ ...parsed, hour12: Number(event.target.value) }),
                            style: webTimeSelect,
                        }, HOURS.map((hour) => React.createElement('option', { key: hour, value: hour }, String(hour).padStart(2, '0'))))}
                        <Text style={styles.colon}>:</Text>
                        {React.createElement('select', {
                            value: parsed.minute,
                            onChange: (event) => emit({ ...parsed, minute: Number(event.target.value) }),
                            style: webTimeSelect,
                        }, MINUTES.map((minute) => React.createElement('option', { key: minute, value: minute }, String(minute).padStart(2, '0'))))}
                    </>
                ) : (
                    <TextInput value={value} onChangeText={onChange} placeholder="HH:MM" style={[styles.input, { flex: 1 }]} />
                )}
                <View style={styles.periodGroup}>
                    {['AM', 'PM'].map((period, index) => (
                        <Pressable key={period} onPress={() => emit({ ...parsed, period })} style={[styles.period, index > 0 && styles.periodSplit, parsed.period === period && styles.periodOn]}>
                            <Text style={[styles.periodText, parsed.period === period && styles.periodTextOn]}>{period}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>
        </View>
    );
}

export function SelectField({ label, value, onChange, options }) {
    return (
        <View style={styles.field}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            {Platform.OS === 'web' ? React.createElement('select', {
                value: value || '',
                onChange: (event) => onChange(event.target.value),
                style: webInput,
            }, options.map((option) => React.createElement('option', { key: option.value, value: option.value }, option.label))) : (
                <View style={{ gap: 8 }}>
                    {options.map((option) => (
                        <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.nativeOption, value === option.value && styles.nativeOptionOn]}>
                            <Text style={styles.choiceText}>{option.label}</Text>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}

export function RadioChoices({ label, options, value, onChange }) {
    return (
        <View style={styles.field}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <View style={styles.choices}>
                {options.map(([id, text]) => (
                    <Pressable key={id} onPress={() => onChange(id)} style={styles.choice}>
                        {Platform.OS === 'web' ? React.createElement('input', {
                            type: 'radio',
                            checked: value === id,
                            onChange: () => onChange(id),
                            style: nativeRadio,
                        }) : (
                            <View style={[styles.radio, value === id && styles.radioOn]}>
                                {value === id ? <View style={styles.radioDot} /> : null}
                            </View>
                        )}
                        <Text style={styles.choiceText}>{text}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

export function TermsCard({ ns, title, label, accepted, onToggle, extra }) {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const lines = useMemo(() => {
        const value = t(`${ns}.termsSummary`, { returnObjects: true });
        return Array.isArray(value) ? value : [];
    }, [t, i18n.language, ns]);
    const sections = useMemo(() => {
        const value = t(`${ns}.fullTermsSections`, { returnObjects: true });
        return Array.isArray(value) ? value : [];
    }, [t, i18n.language, ns]);
    return (
        <View style={styles.termsCard}>
            <Text style={styles.section}>{title || t(`${ns}.section5`)}</Text>
            <View style={styles.termList}>
                {lines.map((line) => (
                    <View key={line} style={styles.termItem}>
                        <Text style={styles.termDot}>•</Text>
                        <Text style={styles.bullet}>{line}</Text>
                    </View>
                ))}
            </View>
            <Pressable onPress={() => setOpen(true)} style={styles.linkHit}>
                <Text style={styles.link}>{t(`${ns}.readFullTerms`)}</Text>
            </Pressable>
            {extra}
            <Pressable onPress={onToggle} style={styles.terms}>
                <View style={[styles.box, accepted && styles.boxOn]}>{accepted ? <Text style={styles.tick}>✓</Text> : null}</View>
                <Text style={styles.termsText}>{label}</Text>
            </Pressable>
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
                    <Pressable style={styles.modalCard} onPress={() => {}}>
                        <View style={styles.modalHead}>
                            <Text style={styles.modalTitle}>{t(`${ns}.fullTermsTitle`)}</Text>
                            <Pressable onPress={() => setOpen(false)}><Text style={styles.link}>{t('stayGuestBooking.close')}</Text></Pressable>
                        </View>
                        <ScrollView>
                            {sections.map((section) => (
                                <View key={section.heading} style={{ marginBottom: 12 }}>
                                    <Text style={styles.section}>{section.heading}</Text>
                                    <Text style={styles.bullet}>{section.body}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const nativeRadio = { width: 16, height: 16, margin: 0, accentColor: '#0071c2' };
const webInput = {
    width: '100%',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#fff',
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    boxSizing: 'border-box',
};
const webTimeSelect = { ...webInput, width: 72, maxWidth: 72, padding: '8px 10px' };

const styles = StyleSheet.create({
    head: { alignItems: 'flex-start', marginBottom: 16 },
    headSide: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
    title: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    subtitle: { fontFamily: FONTS.regular, fontSize: 14, color: '#64748B', marginTop: 4 },
    dateLine: { fontFamily: FONTS.regular, fontSize: 14, color: '#64748B' },
    langRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 2, backgroundColor: '#fff' },
    langBtn: { borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
    langBtnOn: { backgroundColor: COLORS.primary },
    langText: { fontFamily: FONTS.bold, fontSize: 12, color: '#475569' },
    langTextOn: { color: '#fff' },
    field: { marginBottom: 12 },
    label: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.body, marginBottom: 6 },
    input: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderRadius: RADIUS.input,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: COLORS.body,
        backgroundColor: '#fff',
    },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    colon: { fontFamily: FONTS.medium, fontSize: 16, color: COLORS.body },
    periodGroup: { flexDirection: 'row', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
    period: { minWidth: 44, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff', alignItems: 'center' },
    periodSplit: { borderLeftWidth: 1, borderLeftColor: '#CBD5E1' },
    periodOn: { backgroundColor: 'rgba(0, 113, 194, 0.16)' },
    periodText: { fontFamily: FONTS.semibold, fontSize: 14, color: '#475569' },
    periodTextOn: { color: COLORS.action },
    choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    choice: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    choiceText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.body },
    radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#94A3B8', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    radioOn: { borderColor: '#0071C2' },
    radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0071C2' },
    nativeOption: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
    nativeOptionOn: { borderColor: COLORS.action, backgroundColor: 'rgba(0, 113, 194, 0.08)' },
    termsCard: {
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.card,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
    },
    section: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text, marginBottom: 12 },
    termList: { marginTop: 2 },
    termItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
    termDot: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 22, color: '#475569' },
    bullet: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: '#475569', lineHeight: 22 },
    linkHit: { alignSelf: 'flex-start', marginTop: 4, marginBottom: 12 },
    link: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.primary, textDecorationLine: 'underline' },
    terms: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    box: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: COLORS.inputBorder, alignItems: 'center', justifyContent: 'center', marginTop: 2, backgroundColor: '#fff' },
    boxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tick: { color: '#fff', fontSize: 12, fontFamily: FONTS.bold },
    termsText: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.body, lineHeight: 20 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: 16 },
    modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '85%' },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    modalTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
});
