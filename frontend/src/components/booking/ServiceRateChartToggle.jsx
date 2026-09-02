import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ServiceRateChartToggle({ seeLabel, hideLabel, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-white px-4 py-2 font-semibold text-primary transition hover:bg-primary/5"
        aria-expanded={open}
      >
        {open ? hideLabel : seeLabel}
        {open ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
      </button>
      {open && (
        <div className="mt-3 space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          {children}
        </div>
      )}
    </div>
  );
}
