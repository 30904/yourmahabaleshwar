const photo = (id) => ({
  image: `https://images.unsplash.com/photo-${id}?w=800&q=80`,
  hero: `https://images.unsplash.com/photo-${id}?w=1600&q=80`,
});

export const destinations = [
  {
    slug: 'mahabaleshwar',
    ...photo('1506905925346-21bda4d32df4'),
    en: {
      name: 'Mahabaleshwar',
      intro: 'A cool hill station in the Sahyadri range, known for strawberry farms, misty viewpoints, and Venna Lake.',
      about:
        'Mahabaleshwar sits more than 1,300 metres above sea level in Satara district. The British used it as a summer retreat, and the old town still has temples, colonial bungalows, and quiet forest roads. Venna Lake is the centre of town life, while Wilson Point, Arthur’s Seat, and Elephant’s Head Point look out over deep valleys. In winter and early summer the farms around town fill with strawberries. The weather stays pleasant for most of the year, and the monsoon turns the hills bright green.',
      special: [
        'One of Maharashtra’s best-known hill stations, with strawberries grown on the surrounding farms.',
        'A ring of viewpoints — Wilson Point for sunrise, Arthur’s Seat, Kate’s Point, and Bombay Point for sunset.',
        'Venna Lake for boating, and Mapro Garden for fruit products made in this region.',
        'Old Mahabaleshwar, where the Mahabaleshwar Temple and the Panchganga meeting of five streams sit in the forest.',
      ],
      exciting: [
        'Standing at Arthur’s Seat when cloud fills the valley below.',
        'An evening boat ride on Venna Lake as the town lights come on.',
        'The first strawberries of the season, picked at a farm just outside town.',
        'Sunrise at Wilson Point, the highest spot in Mahabaleshwar.',
      ],
      activities: [
        'Viewpoint round: Wilson Point, Arthur’s Seat, Elephant’s Head, Kate’s Point, and Bombay Point',
        'Boating on Venna Lake',
        'Strawberry farm visit in season',
        'Horse riding on the ridge roads',
        'Lingmala and Chinaman’s waterfalls in the monsoon',
        'A walk through Old Mahabaleshwar and the temple trail',
        'Shopping for strawberry jam, honey, and leather chappals',
      ],
    },
    mr: {
      name: 'महाबळेश्वर',
      intro: 'सह्याद्रीतील थंड हिल स्टेशन. स्ट्रॉबेरीच्या शेती, धुक्यात दडलेले व्ह्यू पॉइंट आणि वेण्णा तलाव यासाठी प्रसिद्ध.',
      about:
        'महाबळेश्वर सातारा जिल्ह्यात, समुद्रसपाटीपासून १,३०० मीटरपेक्षा जास्त उंचीवर आहे. ब्रिटिश काळात हे उन्हाळी विश्रांतीचे ठिकाण होते. जुन्या शहरात मंदिरे, जुन्या बंगले आणि शांत जंगलातील रस्ते आहेत. वेण्णा तलाव शहराच्या मध्यभागी आहे. विल्सन पॉइंट, आर्थर सीट आणि एलिफंट्स हेड पॉइंट येथून खोल दऱ्या दिसतात. हिवाळ्यात आणि उन्हाळ्याच्या सुरुवातीला आजूबाजूच्या शेतात स्ट्रॉबेरी येते. वर्षभर हवामान सुखद राहते, आणि पावसाळ्यात डोंगर हिरवे होतात.',
      special: [
        'महाराष्ट्रातील प्रसिद्ध हिल स्टेशन. आजूबाजूच्या शेतात स्ट्रॉबेरी पिकते.',
        'व्ह्यू पॉइंटची रांग — सूर्योदयासाठी विल्सन पॉइंट, आर्थर सीट, केट्स पॉइंट आणि सूर्यास्तासाठी बॉम्बे पॉइंट.',
        'वेण्णा तलावावर बोटिंग, आणि या भागातील फळांपासून बनवलेले पदार्थ माप्रो गार्डनमध्ये.',
        'जुने महाबळेश्वर — महाबळेश्वर मंदिर आणि पंचगंगेचा संगम जंगलात आहे.',
      ],
      exciting: [
        'आर्थर सीटवर उभे राहिल्यावर खालच्या दरीत ढग भरलेले दिसतात.',
        'संध्याकाळी वेण्णा तलावावरील बोट सफर, जेव्हा शहराचे दिवे लागतात.',
        'हंगामातील पहिली स्ट्रॉबेरी, शहराबाहेरील शेतातून.',
        'महाबळेश्वरच्या सर्वात उंच ठिकाणी, विल्सन पॉइंटवर सूर्योदय.',
      ],
      activities: [
        'व्ह्यू पॉइंट फेरी: विल्सन पॉइंट, आर्थर सीट, एलिफंट्स हेड, केट्स पॉइंट आणि बॉम्बे पॉइंट',
        'वेण्णा तलावावर बोटिंग',
        'हंगामात स्ट्रॉबेरी फार्म भेट',
        'घोडेस्वारी',
        'पावसाळ्यात लिंगमाळा आणि चायनामन धबधबे',
        'जुन्या महाबळेश्वरमधील मंदिर मार्ग',
        'स्ट्रॉबेरी जॅम, मध आणि चपलांची खरेदी',
      ],
    },
  },
  {
    slug: 'panchgani',
    ...photo('1469854523086-cc02fe5d8800'),
    en: {
      name: 'Panchgani',
      intro: 'A quiet plateau town a short drive from Mahabaleshwar, famous for Table Land and open valley views.',
      about:
        'Panchgani is about 18 kilometres from Mahabaleshwar. Its name comes from the five villages that once stood on these hills. The town is known for Table Land, a wide flat plateau of laterite rock, and for schools set among strawberry fields. Sydney Point and Parsi Point look toward the Krishna valley and the forts on the horizon. It is smaller and quieter than Mahabaleshwar, which makes it an easy base for a slow day out.',
      special: [
        'Table Land, a broad mountain plateau you can walk across.',
        'Strawberry farms on the road between Panchgani and Mahabaleshwar.',
        'Clear views toward Kamalgad and the Krishna valley from Sydney Point.',
        'A slower pace than the main hill station, with open skies and horse tracks.',
      ],
      exciting: [
        'Walking to the edge of Table Land as the wind comes up the valley.',
        'Horse riding across the open plateau.',
        'Watching the sunset from Parsi Point.',
        'A farm stop for fresh strawberries between the two towns.',
      ],
      activities: [
        'A walk on Table Land',
        'Horse riding',
        'Sydney Point and Parsi Point',
        'Devil’s Kitchen rock formations',
        'Strawberry farm visit',
        'Photography of the plateau and valley',
        'A relaxed day trip from Mahabaleshwar',
      ],
    },
    mr: {
      name: 'पाचगणी',
      intro: 'महाबळेश्वरपासून जवळचे शांत पठारी शहर. टेबल लँड आणि मोकळ्या दरीच्या दृश्यांसाठी प्रसिद्ध.',
      about:
        'पाचगणी महाबळेश्वरपासून सुमारे १८ किलोमीटरवर आहे. नाव येथील पाच गावांवरून पडले. टेबल लँड हे रुंद सपाट जांभा दगडाचे पठार आहे. स्ट्रॉबेरीच्या शेतांमध्ये शाळा आहेत. सिडनी पॉइंट आणि पारशी पॉइंटवरून कृष्णा खोरे आणि क्षितिजावरील किल्ले दिसतात. महाबळेश्वरपेक्षा हे छोटे आणि शांत आहे, त्यामुळे एक दिवसाच्या संथ फेरसाठी सोयीचे आहे.',
      special: [
        'टेबल लँड — चालता येईल एवढे रुंद डोंगरी पठार.',
        'पाचगणी आणि महाबळेश्वर दरम्यानच्या रस्त्यावरील स्ट्रॉबेरी शेती.',
        'सिडनी पॉइंटवरून कमळगड आणि कृष्णा खोऱ्याकडे स्पष्ट दृश्य.',
        'मुख्य हिल स्टेशनपेक्षा संथ गती, मोकळे आकाश आणि घोड्यांचे मार्ग.',
      ],
      exciting: [
        'दरीतून वारा येतो तेव्हा टेबल लँडच्या कडेवर चालणे.',
        'मोकळ्या पठारावर घोडेस्वारी.',
        'पारशी पॉइंटवरून सूर्यास्त.',
        'दोन शहरांदरम्यान ताज्या स्ट्रॉबेरीसाठी शेतात थांबा.',
      ],
      activities: [
        'टेबल लँडवर चालणे',
        'घोडेस्वारी',
        'सिडनी पॉइंट आणि पारशी पॉइंट',
        'डेव्हिल्स किचनचे खडक',
        'स्ट्रॉबेरी फार्म भेट',
        'पठार आणि दरीचे छायाचित्रण',
        'महाबळेश्वरवरून आरामदायी दिवसीय फेरी',
      ],
    },
  },
  {
    slug: 'tapola',
    ...photo('1544551763-46a013bb70d5'),
    en: {
      name: 'Tapola',
      intro: 'Called the Mini Kashmir of Maharashtra, Tapola sits on the still water of Shivsagar Lake.',
      about:
        'Tapola is a small village about 25 kilometres from Mahabaleshwar, on the backwaters of the Koyna dam. The water here is Shivsagar Lake, held between green hills. There is no crowded market — the day is about the lake, the camps along the shore, and the quiet roads that lead in. Boats leave from the village jetty for rides across the backwaters. In the monsoon the hills turn deep green. In winter the air is clear and the water looks dark blue.',
      special: [
        'A wide, calm lake with very little traffic on the water.',
        'Camps and simple stays right by the shore.',
        'Valley light that changes through the day, which is why people call it Mini Kashmir.',
        'An easy add-on to a Mahabaleshwar trip, away from the crowds at the main viewpoints.',
      ],
      exciting: [
        'A boat ride when the hills reflect in the water.',
        'A night in a lakeside camp, waking to mist on the lake.',
        'The quiet of the backwaters after the busier streets of Mahabaleshwar.',
        'Bird calls along the shore in the early morning.',
      ],
      activities: [
        'Boating on Shivsagar Lake',
        'Kayaking where an operator offers it',
        'Lakeside camping',
        'A picnic on the shore',
        'Birdwatching',
        'Photography of the hills and water',
        'A slow drive through the Koyna valley',
      ],
    },
    mr: {
      name: 'तापोला',
      intro: 'महाराष्ट्राचे मिनी काश्मीर. तापोला शिवसागर तलावाच्या शांत पाण्यावर वसले आहे.',
      about:
        'तापोला हे महाबळेश्वरपासून सुमारे २५ किलोमीटरवरील छोटे गाव आहे, कोयना धरणाच्या बॅकवॉटरवर. हे पाणी शिवसागर तलाव आहे, हिरव्या डोंगरांमध्ये. येथे गर्दीचा बाजार नाही. दिवस तलाव, किनाऱ्यावरील कॅम्प आणि आत येणारे शांत रस्ते यांभोवती असतो. गावाच्या जेट्टीवरून बॅकवॉटरमध्ये बोटी निघतात. पावसाळ्यात डोंगर गडद हिरवे होतात. हिवाळ्यात हवा स्वच्छ असते आणि पाणी गडद निळे दिसते.',
      special: [
        'पाण्यावर फारशी वर्दळ नसलेला रुंद, शांत तलाव.',
        'किनाऱ्यावरच कॅम्प आणि साध्या राहण्याच्या जागा.',
        'दिवसभर बदलणारा दरीचा प्रकाश — म्हणून याला मिनी काश्मीर म्हणतात.',
        'मुख्य व्ह्यू पॉइंटच्या गर्दीपासून दूर, महाबळेश्वरच्या फेरला जोडता येणारे ठिकाण.',
      ],
      exciting: [
        'डोंगर पाण्यात प्रतिबिंबित होतात तेव्हा बोट सफर.',
        'तलावाकडील कॅम्पमध्ये रात्र, आणि सकाळी तलावावरील धुके.',
        'महाबळेश्वरच्या गर्दीनंतर बॅकवॉटरची शांतता.',
        'पहाटे किनाऱ्यावरील पक्ष्यांचे आवाज.',
      ],
      activities: [
        'शिवसागर तलावावर बोटिंग',
        'उपलब्ध असल्यास कयाकिंग',
        'तलावाजवळ कॅम्पिंग',
        'किनाऱ्यावर पिकनिक',
        'पक्षी निरीक्षण',
        'डोंगर आणि पाण्याचे छायाचित्रण',
        'कोयना खोऱ्यातून संथ ड्राइव्ह',
      ],
    },
  },
  {
    slug: 'pratapgad',
    ...photo('1464822759023-fed622ff2c3b'),
    en: {
      name: 'Pratapgad',
      intro: 'A hill fort of Chhatrapati Shivaji Maharaj, standing above the forest a short drive from Mahabaleshwar.',
      about:
        'Pratapgad was built in 1656 in the time of Chhatrapati Shivaji Maharaj, with the work overseen by Moropant Pingle. In 1659 the fort was the site of the meeting between Shivaji Maharaj and Afzal Khan, a turning point in Maratha history. The fort has two levels, the lower machi and the upper balekilla, with a temple of Bhavani inside. From the walls you can see the Sahyadri ridges and, on a clear day, a long stretch of forest. The road from Mahabaleshwar is about 24 kilometres, and the last stretch climbs to the fort gate.',
      special: [
        'A living historical place, not only a viewpoint.',
        'The ground of the 1659 meeting with Afzal Khan.',
        'The Bhavani temple inside the fort.',
        'Forest and ridge views that open up once you are on the walls.',
      ],
      exciting: [
        'The climb from the parking area to the upper fort as the valley drops away.',
        'Standing where the 1659 events are remembered, with a guide explaining the ground.',
        'Monsoon cloud rolling over the ramparts.',
        'The quiet of the fort in the early morning, before day-trip groups arrive.',
      ],
      activities: [
        'A fort walk on the lower and upper levels',
        'A visit to the Bhavani temple',
        'A history tour with a local guide',
        'Photography from the ramparts',
        'A day combined with the Mahabaleshwar viewpoints',
        'A short nature walk on the approach road',
      ],
    },
    mr: {
      name: 'प्रतापगड',
      intro: 'छत्रपती शिवाजी महाराजांचा डोंगरी किल्ला, महाबळेश्वरपासून जवळच्या जंगलाच्या वर उभा आहे.',
      about:
        'प्रतापगड १६५६ मध्ये छत्रपती शिवाजी महाराजांच्या काळात बांधला गेला. काम मुरारपंत पिंगळे यांच्या देखरेखीखाली झाले. १६५९ मध्ये या किल्ल्यावर शिवाजी महाराज आणि अफजल खान यांची भेट झाली — मराठा इतिहासातील एक वळण. किल्ल्याला दोन भाग आहेत: खालची माची आणि वरचा बालेकिल्ला. आत भवानीचे मंदिर आहे. तटांवरून सह्याद्रीच्या रांगा आणि स्वच्छ दिवशी लांब जंगल दिसते. महाबळेश्वरपासून रस्ता सुमारे २४ किलोमीटर आहे, आणि शेवटचा टप्पा किल्ल्याच्या दरवाज्यापर्यंत चढतो.',
      special: [
        'केवळ व्ह्यू पॉइंट नाही, जिवंत ऐतिहासिक ठिकाण.',
        '१६५९ मधील अफजल खान भेटीची जागा.',
        'किल्ल्यातील भवानी मंदिर.',
        'तटांवर पोहोचल्यावर उघडणारी जंगल आणि डोंगररांगांची दृश्ये.',
      ],
      exciting: [
        'पार्किंगपासून वरच्या किल्ल्यापर्यंत चढताना दरी खाली सरकते.',
        '१६५९ च्या घटना जिथे आठवल्या जातात तिथे उभे राहणे. मार्गदर्शक जागा समजावून सांगतो.',
        'पावसाळ्यातील ढग तटांवरून येतात.',
        'दिवसीय गट येण्याआधी पहाटे किल्ल्याची शांतता.',
      ],
      activities: [
        'खालच्या आणि वरच्या भागात किल्ला फेरी',
        'भवानी मंदिर दर्शन',
        'स्थानिक मार्गदर्शकासोबत इतिहास फेरी',
        'तटांवरून छायाचित्रण',
        'महाबळेश्वरच्या व्ह्यू पॉइंटसोबत एकत्र दिवस',
        'येणाऱ्या रस्त्यावर छोटी निसर्ग चाल',
      ],
    },
  },
];

export function destinationBySlug(slug) {
  return destinations.find((place) => place.slug === slug) || null;
}

export function destinationCopy(place, language) {
  return String(language || '').startsWith('mr') ? place.mr : place.en;
}
