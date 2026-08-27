import { useState } from 'react';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import {
  HOMESTAY_FORM_AMENITIES,
  HOMESTAY_REGISTRATION_TERMS,
  HOMESTAY_TERMS_AND_CONDITIONS,
} from '../../constants/homestayPartnerLegal';

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-slate-900">{children}</h3>;
}

function LegalModal({ open, doc, onClose }) {
  if (!open || !doc) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" onClick={onClose} role="presentation">
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={doc.title}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">{doc.title}</h2>
          <button type="button" className="text-sm font-semibold text-slate-500" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-4 space-y-4 text-sm text-slate-700">
          {doc.sections.map((section) => (
            <div key={section.heading}>
              <p className="font-semibold text-slate-900">{section.heading}</p>
              <p className="mt-1 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomestayRegistrationFields({ form, setField, toggleAmenity, isEdit = false }) {
  const [legalDoc, setLegalDoc] = useState(null);

  return (
    <>
      <Card className="space-y-4">
        <SectionTitle>1. Property Profile</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            className="sm:col-span-2"
            label="Official Name of Homestay"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />
          <Input
            className="sm:col-span-2"
            label="Owner/Partner Name"
            value={form.ownerName}
            onChange={(e) => setField('ownerName', e.target.value)}
            required
          />
          <Input label="Pin Code" value={form.pincode} onChange={(e) => setField('pincode', e.target.value)} />
          <Input
            className="sm:col-span-2"
            label="Full Address"
            value={form.addressLine1}
            onChange={(e) => setField('addressLine1', e.target.value)}
            required
          />
          <Input label="City/District" value={form.city} onChange={(e) => setField('city', e.target.value)} />
          <Input
            label="Reception Contact Number"
            value={form.receptionPhone}
            onChange={(e) => setField('receptionPhone', e.target.value)}
            required
          />
          <Input label="WhatsApp Number" value={form.whatsapp} onChange={(e) => setField('whatsapp', e.target.value)} />
          <Input
            label="Official Email ID"
            type="email"
            value={form.propertyEmail}
            onChange={(e) => setField('propertyEmail', e.target.value)}
          />
          <Input
            label="Website / Social Media Link"
            value={form.website}
            onChange={(e) => setField('website', e.target.value)}
            placeholder="https://"
          />
          <Input
            className="sm:col-span-2"
            label="Image URL"
            value={form.imageUrl}
            onChange={(e) => setField('imageUrl', e.target.value)}
            placeholder="https://"
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>2. Inventory & Amenities</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Total Number of Rooms"
            type="number"
            min="0"
            value={form.totalRooms}
            onChange={(e) => setField('totalRooms', e.target.value)}
          />
          <Input label="Non-AC Rooms" type="number" min="0" value={form.nonAc} onChange={(e) => setField('nonAc', e.target.value)} />
          <Input
            label="Deluxe AC Rooms"
            type="number"
            min="0"
            value={form.deluxeAc}
            onChange={(e) => setField('deluxeAc', e.target.value)}
          />
          <Input label="Suite Rooms" type="number" min="0" value={form.suite} onChange={(e) => setField('suite', e.target.value)} />
          <Input
            label="Family/Dormitory Rooms"
            type="number"
            min="0"
            value={form.familyDorm}
            onChange={(e) => setField('familyDorm', e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Driver Accommodation</label>
            <select
              className="input-field"
              value={form.driverAccommodation ? 'yes' : 'no'}
              onChange={(e) => setField('driverAccommodation', e.target.value === 'yes')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {HOMESTAY_FORM_AMENITIES.map((name) => {
              const on = (form.amenities || []).includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleAmenity(name)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    on ? 'bg-blue-50 text-primary' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>3. Tariff & Timing</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Base Price From (₹ / night)"
            type="number"
            min="1"
            value={form.priceRangeFrom}
            onChange={(e) => setField('priceRangeFrom', e.target.value)}
            required
          />
          <Input
            label="Base Price To (₹ / night)"
            type="number"
            min="1"
            value={form.priceRangeTo}
            onChange={(e) => setField('priceRangeTo', e.target.value)}
          />
          <Input label="Check-in Time" type="time" value={form.checkInTime} onChange={(e) => setField('checkInTime', e.target.value)} />
          <Input label="Check-out Time" type="time" value={form.checkOutTime} onChange={(e) => setField('checkOutTime', e.target.value)} />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Cancellation Policy</label>
            <textarea
              className="input-field min-h-[72px]"
              value={form.cancellationPolicyText || ''}
              onChange={(e) => setField('cancellationPolicyText', e.target.value)}
            />
          </div>
          <p className="sm:col-span-2 text-xs text-slate-500">
            Commission % is set by the platform admin when your listing is approved.
          </p>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>4. Bank Details (For Payment Settlement)</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Bank Name" value={form.bankName} onChange={(e) => setField('bankName', e.target.value)} required />
          <Input label="Branch" value={form.bankBranch} onChange={(e) => setField('bankBranch', e.target.value)} />
          <Input
            className="sm:col-span-2"
            label="Account Holder Name"
            value={form.accountHolder}
            onChange={(e) => setField('accountHolder', e.target.value)}
          />
          <Input
            label="Account Number"
            value={form.accountNumber}
            onChange={(e) => setField('accountNumber', e.target.value)}
            required
          />
          <Input label="IFSC Code" value={form.ifsc} onChange={(e) => setField('ifsc', e.target.value)} required />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>5. Terms & Conditions</SectionTitle>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
          {HOMESTAY_REGISTRATION_TERMS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 text-sm">
          <button
            type="button"
            className="font-semibold text-primary underline"
            onClick={() => setLegalDoc(HOMESTAY_TERMS_AND_CONDITIONS)}
          >
            Read full Terms & Conditions
          </button>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!form.acceptTerms}
            onChange={(e) => setField('acceptTerms', e.target.checked)}
          />
          <span>I have read and agree to the Homestay Terms and Conditions of S.M. Enterprises.</span>
        </label>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>6. Declaration</SectionTitle>
        <p className="text-sm text-slate-600">
          I/We hereby declare that all information provided in this form is true and correct. We agree to partner with your
          company and abide by all the terms and conditions mentioned above.
        </p>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!form.acceptDeclaration}
            onChange={(e) => setField('acceptDeclaration', e.target.checked)}
          />
          <span>I confirm this declaration{isEdit ? '' : ' and authorize submission of this registration'}.</span>
        </label>
      </Card>

      <LegalModal open={!!legalDoc} doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </>
  );
}
