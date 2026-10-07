import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { publicBlogs, publicFaqs, sendEnquiry } from '../../api/endpoints';
import HomeFooter from '../../components/home/HomeFooter';
import { Button, Card, Field, Loading, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';

const PHONES = [
    { label: '+91 9987 6567 92', href: 'tel:+919987656792' },
    { label: '+91 9987 6866 92', href: 'tel:+919987686692' },
];
const EMAIL = 'hello@yourmahabaleshwar.com';

const FALLBACK_FAQS = [
    { question: 'How do I cancel my booking?', answer: 'Go to My Bookings in your account. Free cancellation applies on properties marked with the green badge.', category: 'BOOKING' },
    { question: 'Can I pay at the property?', answer: 'Many listings offer pay at property. Others require online payment to confirm.', category: 'PAYMENT' },
    { question: 'How do reviews work?', answer: 'Only guests who completed a stay can leave verified reviews.', category: 'REVIEWS' },
    { question: 'How do I list my hotel?', answer: 'Choose List your property. Our team verifies KYC before going live.', category: 'PARTNERS' },
];

const MENU = ['about', 'contact', 'faq', 'blogs', 'place', 'privacy', 'terms', 'cancel'];

function Hero({ title, lead, onBack, backLabel }) {
    return (
        <View style={styles.hero}>
            <Pressable onPress={onBack}>
                <Text style={styles.back}>{backLabel}</Text>
            </Pressable>
            <Text style={styles.heroTitle}>{title}</Text>
            {lead ? <Text style={styles.lead}>{lead}</Text> : null}
        </View>
    );
}

export default function ContentScreen({ route }) {
    const { t, i18n } = useTranslation();
    const [page, setPage] = useState(route?.params?.page || null);
    const [faqs, setFaqs] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [openFaq, setOpenFaq] = useState(0);
    const [openBlog, setOpenBlog] = useState(null);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (route?.params?.page) setPage(route.params.page);
    }, [route?.params?.page]);

    useEffect(() => {
        if (page !== 'faq' && page !== 'blogs') return undefined;
        setLoading(true);
        const load = page === 'faq'
            ? publicFaqs().then((rows) => setFaqs(rows?.length ? rows : FALLBACK_FAQS)).catch(() => setFaqs(FALLBACK_FAQS))
            : publicBlogs().then((rows) => setBlogs(rows || [])).catch(() => setBlogs([]));
        load.finally(() => setLoading(false));
        return undefined;
    }, [page]);

    const send = async () => {
        if (!name.trim() || !phone.trim()) return;
        setSending(true);
        try {
            await sendEnquiry({ name: name.trim(), phone: phone.trim(), message: message.trim(), type: 'GENERAL' });
            setName('');
            setPhone('');
            setMessage('');
            Alert.alert(t('content.contact'), t('content.sent'));
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
        finally {
            setSending(false);
        }
    };

    if (!page) {
        return (
            <Screen style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
                <ScrollView contentContainerStyle={styles.menuPage}>
                    <Text style={styles.pageTitle}>{t('content.menu')}</Text>
                    {MENU.map((id) => (
                        <Pressable key={id} onPress={() => setPage(id)} style={styles.menu}>
                            <Text style={styles.menuText}>{t(`content.${id}`)}</Text>
                            <Text style={styles.chevron}>›</Text>
                        </Pressable>
                    ))}
                    <HomeFooter />
                </ScrollView>
            </Screen>
        );
    }

    const question = (item) => (i18n.language === 'mr' && item.questionMr ? item.questionMr : item.question);
    const answer = (item) => (i18n.language === 'mr' && item.answerMr ? item.answerMr : item.answer);
    const body = {
        place: t('content.placeBody'),
        privacy: t('content.privacyBody'),
        terms: t('content.termsBody'),
        cancel: t('content.cancelBody'),
    }[page];

    return (
        <Screen style={styles.screen}>
            <ScrollView contentContainerStyle={styles.page}>
                <Hero
                    title={t(`content.${page}`)}
                    lead={page === 'about' ? t('content.aboutLead') : page === 'contact' ? t('content.contactLead') : page === 'faq' ? t('content.faqLead') : null}
                    onBack={() => setPage(null)}
                    backLabel={t('content.back')}
                />
                <View style={styles.body}>
                    {page === 'about' && (
                        <>
                            <Text style={styles.sectionTitle}>{t('content.aboutHeadline')}</Text>
                            <Card>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>SM</Text>
                                </View>
                                <Text style={styles.founder}>{t('content.founder')}</Text>
                                <Text style={styles.role}>{t('content.founderRole')}</Text>
                                <Text style={styles.paragraph}>{t('content.aboutBody')}</Text>
                            </Card>
                            <Text style={styles.sectionTitle}>{t('content.why')}</Text>
                            {[1, 2, 3, 4].map((n) => (
                                <Card key={n} style={styles.reason}>
                                    <Text style={styles.check}>✓</Text>
                                    <Text style={styles.reasonText}>{t(`content.reason${n}`)}</Text>
                                </Card>
                            ))}
                        </>
                    )}
                    {page === 'contact' && (
                        <>
                            <Card>
                                <Text style={styles.blockTitle}>{t('content.phone')}</Text>
                                {PHONES.map((item) => (
                                    <Pressable key={item.href} onPress={() => Linking.openURL(item.href)}>
                                        <Text style={styles.link}>{item.label}</Text>
                                    </Pressable>
                                ))}
                            </Card>
                            <Card>
                                <Text style={styles.blockTitle}>{t('auth.email')}</Text>
                                <Pressable onPress={() => Linking.openURL(`mailto:${EMAIL}`)}>
                                    <Text style={styles.link}>{EMAIL}</Text>
                                </Pressable>
                            </Card>
                            <Card>
                                <Text style={styles.blockTitle}>{t('content.office')}</Text>
                                <Text style={styles.paragraph}>{t('content.officeAddress')}</Text>
                            </Card>
                            <Card>
                                <Text style={styles.blockTitle}>{t('content.hours')}</Text>
                                <Text style={styles.paragraph}>{t('content.hoursValue')}</Text>
                            </Card>
                            <Card>
                                <Text style={styles.sectionTitle}>{t('content.send')}</Text>
                                <Field label={t('auth.name')} value={name} onChangeText={setName} autoCapitalize="words" />
                                <Field label={t('auth.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                                <Field label={t('content.message')} value={message} onChangeText={setMessage} autoCapitalize="sentences" />
                                <Button title={t('content.send')} onPress={send} loading={sending} />
                            </Card>
                        </>
                    )}
                    {page === 'faq' && (loading ? <Loading /> : faqs.map((item, index) => {
                        const open = openFaq === index;
                        return (
                            <Pressable key={item._id || index} onPress={() => setOpenFaq(open ? -1 : index)}>
                                <Card style={styles.faq}>
                                    <View style={styles.faqHead}>
                                        <Text style={styles.faqQuestion}>{question(item)}</Text>
                                        <Text style={styles.chevron}>{open ? '▾' : '›'}</Text>
                                    </View>
                                    {open ? (
                                        <View style={styles.faqBody}>
                                            {item.category ? <Text style={styles.category}>{item.category}</Text> : null}
                                            <Text style={styles.paragraph}>{answer(item)}</Text>
                                        </View>
                                    ) : null}
                                </Card>
                            </Pressable>
                        );
                    }))}
                    {page === 'blogs' && (loading ? <Loading /> : blogs.length ? blogs.map((item) => {
                        const open = openBlog === item.slug;
                        return (
                            <Pressable key={item._id || item.slug} onPress={() => setOpenBlog(open ? null : item.slug)}>
                                <Card>
                                    <Text style={styles.blockTitle}>{item.title}</Text>
                                    {item.excerpt ? <Text style={styles.paragraph}>{item.excerpt}</Text> : null}
                                    {open && item.content ? <Text style={[styles.paragraph, styles.blogBody]}>{item.content}</Text> : null}
                                </Card>
                            </Pressable>
                        );
                    }) : (
                        <Card style={styles.empty}>
                            <Text style={styles.emptyText}>{t('common.empty')}</Text>
                        </Card>
                    ))}
                    {body ? (
                        <Card>
                            <Text style={styles.paragraph}>{body}</Text>
                        </Card>
                    ) : null}
                </View>
                <HomeFooter bleed={0} />
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { padding: 0 },
    menuPage: { paddingHorizontal: 16, paddingTop: 16 },
    page: { paddingBottom: 28 },
    pageTitle: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        color: COLORS.text,
        letterSpacing: -0.4,
        marginBottom: 12,
    },
    menu: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
    },
    menuText: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.primary },
    chevron: { fontFamily: FONTS.semibold, fontSize: 18, color: COLORS.muted },
    hero: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 },
    back: { fontFamily: FONTS.semibold, fontSize: 14, color: '#DBEAFE', marginBottom: 12 },
    heroTitle: { fontFamily: FONTS.bold, fontSize: 28, color: '#fff', letterSpacing: -0.4 },
    lead: { fontFamily: FONTS.regular, fontSize: 15, color: '#DBEAFE', marginTop: 8, lineHeight: 22 },
    body: { padding: 16 },
    sectionTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text, marginBottom: 10 },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    avatarText: { fontFamily: FONTS.bold, fontSize: 24, color: '#fff' },
    founder: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    role: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, marginTop: 2, marginBottom: 10 },
    paragraph: { fontFamily: FONTS.regular, fontSize: 15, color: '#475569', lineHeight: 22 },
    reason: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    check: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.primary },
    reasonText: { flex: 1, fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text, lineHeight: 20 },
    blockTitle: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text, marginBottom: 6 },
    link: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.primary, marginTop: 4 },
    faq: { padding: 0 },
    faqHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
    faqQuestion: { flex: 1, fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text },
    faqBody: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 10 },
    category: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.primarySoft,
        color: COLORS.primary,
        fontFamily: FONTS.semibold,
        fontSize: 11,
        borderRadius: 999,
        overflow: 'hidden',
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginBottom: 8,
    },
    blogBody: { marginTop: 10 },
    empty: { alignItems: 'center', paddingVertical: 28 },
    emptyText: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.muted, textAlign: 'center' },
});
