import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { publicBlogs, publicFaqs, sendEnquiry } from '../../api/endpoints';
import { Button, Card, Field, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';

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

export default function ContentScreen() {
    const { t, i18n } = useTranslation();
    const [page, setPage] = useState(null);
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
        return (<Screen>
          <ScrollView>
            <Title>{t('content.menu')}</Title>
            {MENU.map((id) => (<Pressable key={id} onPress={() => setPage(id)}>
                <Card>
                  <Text style={{ fontWeight: '800', color: COLORS.primary }}>{t(`content.${id}`)}</Text>
                </Card>
              </Pressable>))}
          </ScrollView>
        </Screen>);
    }

    const question = (item) => (i18n.language === 'mr' && item.questionMr ? item.questionMr : item.question);
    const answer = (item) => (i18n.language === 'mr' && item.answerMr ? item.answerMr : item.answer);

    return (<Screen>
      <ScrollView>
        <Button title={t('content.back')} variant="outline" onPress={() => setPage(null)}/>
        <Title>{t(`content.${page}`)}</Title>
        {page === 'about' && (<>
          <Muted>{t('content.aboutLead')}</Muted>
          <Text style={{ fontWeight: '800', color: COLORS.text, fontSize: 18, marginTop: 12 }}>{t('content.aboutHeadline')}</Text>
          <Muted>{t('content.founder')}</Muted>
          <Muted>{t('content.founderRole')}</Muted>
          <Muted>{t('content.aboutBody')}</Muted>
          <Text style={{ fontWeight: '800', color: COLORS.text, marginTop: 12 }}>{t('content.why')}</Text>
          {[1, 2, 3, 4].map((n) => <Muted key={n}>{t(`content.reason${n}`)}</Muted>)}
        </>)}
        {page === 'contact' && (<>
          <Muted>{t('content.contactLead')}</Muted>
          <Card>
            <Text style={{ fontWeight: '700', color: COLORS.text }}>{t('content.phone')}</Text>
            {PHONES.map((item) => (<Pressable key={item.href} onPress={() => Linking.openURL(item.href)}>
                <Text style={{ color: COLORS.primary, fontWeight: '700', marginTop: 6 }}>{item.label}</Text>
              </Pressable>))}
            <Text style={{ fontWeight: '700', color: COLORS.text, marginTop: 10 }}>{t('auth.email')}</Text>
            <Pressable onPress={() => Linking.openURL(`mailto:${EMAIL}`)}>
              <Text style={{ color: COLORS.primary, fontWeight: '700', marginTop: 6 }}>{EMAIL}</Text>
            </Pressable>
            <Text style={{ fontWeight: '700', color: COLORS.text, marginTop: 10 }}>{t('content.office')}</Text>
            <Muted>{t('content.officeAddress')}</Muted>
            <Text style={{ fontWeight: '700', color: COLORS.text, marginTop: 10 }}>{t('content.hours')}</Text>
            <Muted>{t('content.hoursValue')}</Muted>
          </Card>
          <Field label={t('auth.name')} value={name} onChangeText={setName} autoCapitalize="words"/>
          <Field label={t('auth.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
          <Field label={t('content.message')} value={message} onChangeText={setMessage} autoCapitalize="sentences"/>
          <Button title={t('content.send')} onPress={send} loading={sending}/>
        </>)}
        {page === 'faq' && (loading ? <Loading /> : faqs.map((item, index) => (<Pressable key={item._id || index} onPress={() => setOpenFaq(openFaq === index ? -1 : index)}>
            <Card>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>{question(item)}</Text>
              {openFaq === index ? <Muted>{answer(item)}</Muted> : null}
            </Card>
          </Pressable>)))}
        {page === 'blogs' && (loading ? <Loading /> : blogs.length ? blogs.map((item) => (<Pressable key={item._id || item.slug} onPress={() => setOpenBlog(openBlog === item.slug ? null : item.slug)}>
            <Card>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>{item.title}</Text>
              {item.excerpt ? <Muted>{item.excerpt}</Muted> : null}
              {openBlog === item.slug && item.content ? <Muted>{item.content}</Muted> : null}
            </Card>
          </Pressable>)) : <Muted>{t('common.empty')}</Muted>)}
        {page === 'place' && <Muted>{t('content.placeBody')}</Muted>}
        {page === 'privacy' && <Muted>{t('content.privacyBody')}</Muted>}
        {page === 'terms' && <Muted>{t('content.termsBody')}</Muted>}
        {page === 'cancel' && <Muted>{t('content.cancelBody')}</Muted>}
      </ScrollView>
    </Screen>);
}
