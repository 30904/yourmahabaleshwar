/** Client legal copy for guide partner onboarding (S.M. Enterprises Guide Registration Form v5). */

export const GUIDE_LANGUAGE_OPTIONS = ['Marathi', 'Hindi', 'English'];

export const GUIDE_REQUIRED_DOCUMENTS = [
  'Aadhaar Card',
  'PAN Card',
  'Driving License copy',
  'Address proof (e.g. electricity bill)',
  'Police verification certificate',
  'Passport-size photos (2 copies)',
];

export const GUIDE_REGISTRATION_TERMS = [
  'App will not function without recharge.',
  'Always interact politely and respectfully with customers.',
  'Charge strictly as per company billing — no overcharging.',
  'Tips can be accepted if given voluntarily; never demand extra money.',
  'Rule violations may result in a 2–3 day penalty or removal from the platform.',
  'Accepted bookings cannot be cancelled 1–2 hours prior.',
  'Be present at the customer\'s location on time.',
  'Collect cash/Google Pay payment and submit on time.',
  'Wearing uniform and ID card is mandatory.',
  'Do not misinform or mislead customers.',
  'Ride bike properly or drive/accompany to provide information.',
  'Consumption of alcohol, smoking, tobacco or gutkha while on duty or with customers is strictly prohibited.',
  'Follow tourism rules of Mahabaleshwar; do not argue with locals or tourists.',
  'Report any customer issues immediately to management; unauthorized dealings will not be tolerated.',
];

export const GUIDE_TERMS_AND_CONDITIONS = {
  title: 'Guide Terms & Conditions',
  sections: GUIDE_REGISTRATION_TERMS.map((body, index) => ({
    heading: `${index + 1}.`,
    body,
  })),
};

export const GUIDE_DECLARATION_TEXT =
  'I hereby certify that all the information given above is completely true and I agree to all the terms and conditions above. If any information is found false or rules are violated, I agree to the cancellation of my registration.';
