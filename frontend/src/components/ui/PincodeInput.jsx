import Input from './Input';
import { MAHABALESHWAR_PINCODE } from '../../constants/site';

/**
 * Pin code input that autofills Mahabaleshwar (412806) on focus when empty.
 * User can still edit afterward.
 */
export default function PincodeInput({ value = '', onChange, onFocus, ...props }) {
  const handleFocus = (e) => {
    if (!String(value ?? '').trim()) {
      onChange?.({
        ...e,
        target: { ...e.target, value: MAHABALESHWAR_PINCODE },
      });
    }
    onFocus?.(e);
  };

  return (
    <Input
      inputMode="numeric"
      autoComplete="postal-code"
      {...props}
      value={value}
      onChange={onChange}
      onFocus={handleFocus}
    />
  );
}

/** Use with raw <input> / admin fields. */
export function autofillMahabaleshwarPincode(currentValue, setValue) {
  if (!String(currentValue ?? '').trim()) {
    setValue(MAHABALESHWAR_PINCODE);
  }
}
