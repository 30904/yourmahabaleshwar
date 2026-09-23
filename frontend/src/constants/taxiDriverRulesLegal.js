/** Shared Rules & Regulations for taxi operator and driver partner onboarding (S.M. Enterprises). */

const EN_SECTIONS = [
  {
    heading: '1. Tobacco / Gutkha / Alcohol Prohibition',
    body: 'Consumption of tobacco, gutkha, pan masala, alcohol, or any intoxicating substances while driving or on duty is strictly prohibited. If found, immediate and permanent expulsion will be enforced.',
  },
  {
    heading: '2. No Dispute or Misbehavior with Customers',
    body: 'Behave politely, respectfully, and professionally with customers/passengers at all times. Any argument, raised voice, or misbehavior with customers will not be tolerated.',
  },
  {
    heading: '3. Punctuality and Discipline',
    body: 'Be present at the customer location at the time given during booking. Avoid prolonged mobile calls during travel or anything that distracts attention while driving.',
  },
  {
    heading: '4. Vehicle Cleanliness and Documents',
    body: 'The taxi must always be clean and in good condition. Keep all legal vehicle documents (Insurance, PUC, Passing, Permit) updated at all times.',
  },
  {
    heading: '5. Fare and Company Policy',
    body: 'Only the fare fixed by S.M. Enterprises must be charged. Following company rules and transparent dealings is mandatory.',
  },
  {
    heading: '6. Declaration',
    body: 'I hereby certify that all the information given above is completely true. I will strictly follow all the rules of S.M. Enterprises, especially the conditions of addiction-free conduct and courteous behavior with customers. If any information is found false or rules are violated in the future, I consent to immediate cancellation of my registration.',
    highlight: true,
  },
];

const MR_SECTIONS = [
  {
    heading: '१. तंबाखू / गुटखा / दारू बंदी',
    body: 'गाडी चालवताना किंवा ड्युटीवर असताना तंबाखू, गुटखा, पानमसाला, दारू किंवा कोणत्याही प्रकारच्या नशेरी संबंधित वस्तूंचे सेवन सख्त मनाई आहे. असे आढळल्यास तात्काळ व कायमस्वरूपी हकालपट्टी केली जाईल.',
  },
  {
    heading: '२. ग्राहकांशी वाद किंवा गैरवर्तन नाही',
    body: 'ग्राहकांशी / प्रवाशांशी अत्यंत नम्रपणे, आदराने आणि व्यावसायिकतेने वागावे. ग्राहकांसोबत कोणत्याही प्रकारचा वाद घालणे, मोठ्याने बोलणे किंवा गैरवर्तन करणे अजिबात खपवून घेतले जाणार नाही.',
  },
  {
    heading: '३. वेळेचे व शिस्तीचे पालन',
    body: 'बुकिंगच्या वेळी दिलेल्या वेळेवर ग्राहकाच्या ठिकाणी हजर राहावे. प्रवासात मोबाईलवर जास्त वेळ बोलणे किंवा गाडी चालवताना लक्ष विचलित होईल अशा गोष्टी टाळाव्यात.',
  },
  {
    heading: '४. वाहन स्वच्छता व कागदपत्रे',
    body: 'टॅक्सी नेहमी स्वच्छ, सुस्थितीत असावी. गाडीचे सर्व कायदेशीर कागदपत्रे (विमा, PUC, पासिंग, Permit) नेहमी अद्ययावत (अपडेट) ठेवावीत.',
  },
  {
    heading: '५. भाडे व कंपनीचे धोरण',
    body: 'एस. एम. इंटरप्रायजेस द्वारे ठरवून दिलेले भाडे आकारले जावे. कंपनीच्या नियमांचे व पारदर्शक व्यवहारांचे पालन करणे बंधनकारक आहे.',
  },
  {
    heading: '६. घोषणापत्र',
    body: 'मी याद्वारे प्रमाणित करतो/करते की, वर दिलेली सर्व माहिती पूर्णपणे सत्य आहे. एस. एम. इंटरप्रायजेसच्या सर्व नियमांचे, विशेषतः व्यसनमुक्ती व ग्राहकांशी सौजन्याने वागण्याच्या अटींचे मी तंतोतंत पालन करीन. भविष्यात कोणतीही माहिती खोटी आढळल्यास किंवा नियमभंग झाल्यास माझे रजिस्ट्रेशन तात्काळ रद्द केले जाण्यास माझी संमती आहे.',
    highlight: true,
  },
];

export const TAXI_DRIVER_RULES = {
  en: {
    title: 'Rules & Regulations',
    portalTitle: 'S. M. Enterprises Taxi Booking & Driver Registration Portal',
    portalSubtitle: 'Strict rules and conditions for taxi and driver booking',
    footerNote: 'www.yourmahabaleshwar.com | S. M. Enterprises Taxi Booking & Driver Registration Portal',
    sections: EN_SECTIONS,
  },
  mr: {
    title: 'शर्त व नियमावली',
    portalTitle: 'S. M. Enterprises Taxi Booking & Driver Registration Portal',
    portalSubtitle: 'टॅक्सी व ड्रायव्हर बुकिंगचे कडक नियम आणि अटी',
    footerNote: 'www.yourmahabaleshwar.com | S. M. Enterprises Taxi Booking & Driver Registration Portal',
    sections: MR_SECTIONS,
  },
};

export function getTaxiDriverRules(language = 'en') {
  return language?.toLowerCase().startsWith('mr') ? TAXI_DRIVER_RULES.mr : TAXI_DRIVER_RULES.en;
}
