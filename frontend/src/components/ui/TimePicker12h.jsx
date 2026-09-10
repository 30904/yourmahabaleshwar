import { useMemo } from 'react';
import { clampTime24, isTimeInRange, parseTime24, toTime24 } from '../../utils/time12h';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

/**
 * 12-hour time picker with AM/PM.
 * value / onChange use 24h "HH:mm".
 * Optional minTime / maxTime (HH:mm) limit selectable times.
 */
export default function TimePicker12h({
  label,
  value = '09:00',
  onChange,
  error,
  className = '',
  selectClassName = 'input-field',
  disabled = false,
  required = false,
  name,
  id,
  minTime,
  maxTime,
}) {
  const clampedValue = useMemo(
    () => clampTime24(value, minTime, maxTime),
    [value, minTime, maxTime]
  );
  const { hour12, minute, period } = parseTime24(clampedValue);

  const emit = (nextHour12, nextMinute, nextPeriod) => {
    const next = clampTime24(toTime24(nextHour12, nextMinute, nextPeriod), minTime, maxTime);
    onChange?.(next);
  };

  const hourOptions = useMemo(() => {
    return HOURS.filter((h) =>
      MINUTES.some((m) => isTimeInRange(toTime24(h, m, period), minTime, maxTime))
    );
  }, [period, minTime, maxTime]);

  const minuteOptions = useMemo(() => {
    return MINUTES.filter((m) => isTimeInRange(toTime24(hour12, m, period), minTime, maxTime));
  }, [hour12, period, minTime, maxTime]);

  const periodEnabled = useMemo(() => {
    const can = (p) =>
      HOURS.some((h) => MINUTES.some((m) => isTimeInRange(toTime24(h, m, p), minTime, maxTime)));
    return { AM: can('AM'), PM: can('PM') };
  }, [minTime, maxTime]);

  const selectCls = `${selectClassName} ${error ? 'border-red-400' : ''}`.trim();
  const baseId = id || name || 'time';

  return (
    <div className={`w-max max-w-full ${className}`.trim()}>
      {label && (
        <label htmlFor={`${baseId}-hour`} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
      )}
      <div className="flex flex-wrap items-stretch gap-1.5">
        <select
          id={`${baseId}-hour`}
          name={name ? `${name}-hour` : undefined}
          className={`${selectCls} !w-[4.5rem] !max-w-[4.5rem] shrink-0 !px-2.5`}
          value={hour12}
          disabled={disabled}
          aria-label="Hour"
          onChange={(e) => emit(Number(e.target.value), minute, period)}
        >
          {(hourOptions.length ? hourOptions : HOURS).map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, '0')}
            </option>
          ))}
        </select>
        <span className="flex items-center text-sm font-semibold text-slate-500" aria-hidden>
          :
        </span>
        <select
          id={`${baseId}-minute`}
          name={name ? `${name}-minute` : undefined}
          className={`${selectCls} !w-[4.5rem] !max-w-[4.5rem] shrink-0 !px-2.5`}
          value={minute}
          disabled={disabled}
          aria-label="Minute"
          onChange={(e) => emit(hour12, Number(e.target.value), period)}
        >
          {(minuteOptions.length ? minuteOptions : MINUTES).map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, '0')}
            </option>
          ))}
        </select>
        <div
          className="inline-flex overflow-hidden rounded-booking border border-slate-300 bg-white"
          role="group"
          aria-label="AM or PM"
        >
          {['AM', 'PM'].map((p, index) => {
            const active = period === p;
            const periodDisabled = disabled || !periodEnabled[p];
            return (
              <button
                key={p}
                type="button"
                disabled={periodDisabled}
                className={`min-w-[2.75rem] px-2.5 py-2.5 text-sm font-semibold transition ${
                  index > 0 ? 'border-l border-slate-300' : ''
                } ${
                  active
                    ? 'text-primary'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                } disabled:cursor-not-allowed disabled:opacity-50`}
                style={active ? { backgroundColor: 'rgba(0, 113, 194, 0.16)' } : undefined}
                aria-pressed={active}
                onClick={() => emit(hour12, minute, p)}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
