/** Client legal copy for individual driver partner onboarding (S.M. Enterprises). */

export const DRIVER_REQUIRED_DOCUMENTS = [
  'Driving License',
  'Aadhaar Card',
  'PAN Card',
  'Vehicle RC copy',
  'Insurance certificate',
  'PUC certificate',
  'Passport-size photo',
  'Bank passbook / cancelled cheque',
];

export const DRIVER_REGISTRATION_TERMS = [
  'App will not function without recharge.',
  'Always interact politely and respectfully with customers.',
  'Charge strictly as per company billing — no overcharging.',
  'Tips can be accepted if given voluntarily; never demand extra money.',
  'Rule violations may result in a 2–3 day penalty or removal from the platform.',
  'Accepted bookings cannot be cancelled 1–2 hours prior.',
  'Be present at the customer pickup location on time.',
  'Collect cash/UPI payment and submit on time as per company policy.',
  'Wearing uniform and ID card is mandatory while on duty.',
  'Vehicle must have valid RC, insurance, fitness and PUC at all times.',
  'Do not misinform or mislead customers about routes or fares.',
  'Consumption of alcohol, smoking, tobacco or gutkha while on duty is strictly prohibited.',
  'Follow local traffic and tourism rules in Mahabaleshwar and Panchgani.',
  'Report any customer issues immediately to management; unauthorized dealings will not be tolerated.',
];

export const DRIVER_TERMS_AND_CONDITIONS = {
  title: 'Driver Partner Terms & Conditions',
  sections: DRIVER_REGISTRATION_TERMS.map((body, index) => ({
    heading: `${index + 1}.`,
    body,
  })),
};

export const DRIVER_PARTNER_AGREEMENT = {
  title: 'Driver Partner Registration Agreement',
  sections: [
    {
      heading: '1. Trip Availability and Pricing',
      body: 'The Driver Partner must keep availability updated on the dashboard. Per-trip and hourly rates on the platform must not exceed walk-in/counter rates for the same service.',
    },
    {
      heading: '2. Bookings and Pickup',
      body: 'All platform bookings must be accepted. The driver must arrive at the pickup location on time, verify passenger details, and follow the agreed route unless changed by mutual consent.',
    },
    {
      heading: '3. Payment, Commission and Settlement',
      body: "Commission is set by the platform administrator per listing. GST and payment gateway charges apply as per platform policy. Net settlement is transferred to the partner's registered bank account on the payout schedule.",
    },
    {
      heading: '4. Driver and Vehicle Responsibilities',
      body: 'The driver must hold a valid license; the vehicle must have valid RC, insurance, fitness and PUC. The driver must behave politely; the platform may terminate this agreement for violations or complaints.',
    },
    {
      heading: '5. Legal Liability',
      body: 'S.M. Enterprises acts as a booking platform. The Driver Partner is directly responsible for on-trip service delivery, passenger safety, and compliance with local traffic and tourism rules.',
    },
  ],
};

export const DRIVER_DECLARATION_TEXT =
  'I hereby certify that all the information given above is completely true and I agree to all the terms and conditions above. If any information is found false or rules are violated, I agree to the cancellation of my registration.';
