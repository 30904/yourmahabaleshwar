/** Client legal copy for horse ride partner onboarding (S.M. Enterprises). */



export const HORSE_REQUIRED_DOCUMENTS = [

  'Aadhaar Card',

  'PAN Card',

  'Address proof (e.g. electricity bill)',

  'Police verification certificate',

  'Veterinary fitness certificate for horses',

  'Stable / riding permit (if applicable)',

  'Third-party / activity insurance',

  'Passport-size photos (2 copies)',

  'Bank passbook / cancelled cheque',

];



export const HORSE_REGISTRATION_TERMS = [

  'App will not function without recharge.',

  'Always interact politely and respectfully with customers and ensure rider safety.',

  'Charge strictly as per company billing — no overcharging.',

  'Tips can be accepted if given voluntarily; never demand extra money.',

  'Rule violations may result in a 2–3 day penalty or removal from the platform.',

  'Accepted bookings cannot be cancelled 1–2 hours prior.',

  'Be present at the ride start point on time with horses ready.',

  'Collect cash/UPI payment and submit on time as per company policy.',

  'Wearing uniform and ID card is mandatory while on duty.',

  'Horses must be healthy, vaccinated and fit; veterinary certificates must be valid.',

  'Provide helmets and safety gear to all riders as required.',

  'Do not overload horses or allow riding without a safety briefing.',

  'Consumption of alcohol, smoking, tobacco or gutkha while on duty is strictly prohibited.',

  'Follow forest department and tourism rules in Mahabaleshwar and Panchgani.',

  'Report any customer issues immediately to management; unauthorized dealings will not be tolerated.',

];



export const HORSE_TERMS_AND_CONDITIONS = {

  title: 'Horse Ride Partner Terms & Conditions',

  sections: HORSE_REGISTRATION_TERMS.map((body, index) => ({

    heading: `${index + 1}.`,

    body,

  })),

};



export const HORSE_PARTNER_AGREEMENT = {
  title: 'Horse Ride Partner Registration Agreement',
  sections: [
    {
      heading: '1. Ride Availability and Pricing',
      body: 'The Horse Ride Partner must keep availability and route pricing updated on the dashboard. Rates on the platform must not exceed walk-in/counter rates for the same route.',
    },
    {
      heading: '2. Bookings, Safety and Check-in',
      body: 'All platform bookings must be accepted. The operator must verify rider details, provide a safety briefing, and supply helmets/safety gear. Riding without valid safety measures is prohibited.',
    },
    {
      heading: '3. Payment, Commission and Settlement',
      body: "Commission is set by the platform administrator per listing. GST and payment gateway charges apply as per platform policy. Net settlement is transferred to the partner's registered bank account on the payout schedule.",
    },
    {
      heading: '4. Operator Responsibilities',
      body: 'Horses must be well trained, healthy and vaccinated with valid veterinary certificates. Stable/ riding permits must be maintained where applicable. Staff must behave politely; the platform may terminate this agreement for violations or complaints.',
    },
    {
      heading: '5. Legal Liability',
      body: 'S.M. Enterprises acts as a booking platform. The Horse Ride Partner is directly responsible for on-site service delivery, rider safety, and horse welfare during rides.',
    },
  ],
};

export const HORSE_DECLARATION_TEXT =

  'I hereby certify that all the information given above is completely true and I agree to all the terms and conditions above. If any information is found false or rules are violated, I agree to the cancellation of my registration.';


