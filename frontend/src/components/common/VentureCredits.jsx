import smLogo from '../../assets/sm_logo.jpeg';

export default function VentureCredits({ compact = false }) {
  if (compact) {
    return (
      <div className="mt-3 flex flex-col items-center gap-2 text-center text-xs text-blue-200 sm:flex-row sm:justify-center sm:gap-6">
        <span className="flex items-center gap-2">
          <img src={smLogo} alt="SM Enterprises" className="h-6 w-auto object-contain brightness-0 invert" />
          A venture of <strong className="text-white">SM Enterprise</strong>
        </span>
        <span>
          Powered by <strong className="text-white">Celeris Venture Systems Pvt. Ltd.</strong>
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-booking border border-border bg-slate-50 p-6 sm:p-8">
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
          <img
            src={smLogo}
            alt="SM Enterprises"
            className="h-16 w-auto max-w-[140px] object-contain sm:h-20"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">A venture of</p>
            <p className="text-lg font-bold text-primary">SM Enterprise</p>
            <p className="mt-1 max-w-sm text-sm text-slate-600">
              YOURMAHABALESHWAR.COM is proudly operated as a venture of SM Enterprise.
            </p>
          </div>
        </div>
        <div className="hidden h-16 w-px bg-border lg:block" aria-hidden="true" />
        <div className="text-center lg:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Powered by</p>
          <p className="text-base font-bold text-slate-800">Celeris Venture Systems Pvt. Ltd.</p>
          <p className="mt-1 text-sm text-slate-500">Technology partner</p>
        </div>
      </div>
    </div>
  );
}
