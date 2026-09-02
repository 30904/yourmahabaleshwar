/** Client legal copy for taxi operator / fleet partner onboarding (S.M. Enterprises). */

export const TAXI_REQUIRED_DOCUMENTS = [
  'Business registration / GST certificate (if applicable)',
  'Aadhaar Card (proprietor)',
  'PAN Card',
  'Vehicle RC copies (all fleet vehicles)',
  'Vehicle insurance certificates',
  'Fitness certificates',
  'Permit / All-India Tourist Permit (if applicable)',
  'PUC certificates',
  'Driving licenses of assigned drivers',
  'Bank passbook / cancelled cheque',
];

export const TAXI_REGISTRATION_TERMS = [
  'App will not function without recharge.',
  'Always interact politely and respectfully with customers.',
  'Charge strictly as per company billing — no overcharging.',
  'Tips can be accepted if given voluntarily; never demand extra money.',
  'Rule violations may result in a 2–3 day penalty or removal from the platform.',
  'Accepted bookings cannot be cancelled 1–2 hours prior.',
  'Assign a driver and vehicle on time for every confirmed booking.',
  'Collect cash/UPI payment and submit on time as per company policy.',
  'Drivers on duty must wear uniform and carry ID card.',
  'All fleet vehicles must have valid RC, insurance, fitness and PUC at all times.',
  'Do not misinform or mislead customers about routes or fares.',
  'Consumption of alcohol, smoking, tobacco or gutkha while on duty is strictly prohibited.',
  'Follow local traffic and tourism rules in Mahabaleshwar and Panchgani.',
  'Report any customer issues immediately to management; unauthorized dealings will not be tolerated.',
];

export const TAXI_TERMS_AND_CONDITIONS = {
  title: 'Taxi Operator Partner Terms & Conditions',
  sections: TAXI_REGISTRATION_TERMS.map((body, index) => ({
    heading: `${index + 1}.`,
    body,
  })),
};

export const TAXI_PARTNER_AGREEMENT = {
  title: 'Taxi Operator Partner Registration Agreement',
  sections: [
    {
      heading: '1. Fleet Availability and Pricing',
      body: 'The Taxi Operator must keep fleet availability updated on the dashboard. Per-trip and hourly rates on the platform must not exceed walk-in/counter rates for the same service.',
    },
    {
      heading: '2. Bookings and Dispatch',
      body: 'All platform bookings must be accepted. The operator must assign a suitable vehicle and driver, ensure on-time pickup, verify passenger details, and follow the agreed route unless changed by mutual consent.',
    },
    {
      heading: '3. Payment, Commission and Settlement',
      body: "Commission is set by the platform administrator per listing. GST and payment gateway charges apply as per platform policy. Net settlement is transferred to the operator's registered bank account on the payout schedule.",
    },
    {
      heading: '4. Fleet and Driver Responsibilities',
      body: 'All drivers must hold valid licenses; fleet vehicles must have valid RC, insurance, fitness and PUC. The operator is responsible for driver conduct and vehicle condition; the platform may terminate this agreement for violations or complaints.',
    },
    {
      heading: '5. Legal Liability',
      body: 'S.M. Enterprises acts as a booking platform. The Taxi Operator is directly responsible for on-trip service delivery, passenger safety, and compliance with local traffic and tourism rules.',
    },
  ],
};

export const TAXI_DECLARATION_TEXT =
  'I hereby certify that all the information given above is completely true and I agree to all the terms and conditions above. If any information is found false or rules are violated, I agree to the cancellation of my registration.';
