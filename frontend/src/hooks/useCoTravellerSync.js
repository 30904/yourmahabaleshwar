import { useEffect } from 'react';

export const emptyTraveller = () => ({ fullName: '', age: '', gender: '', relationship: '' });

/** Keep co-traveller rows in sync with total guests (lead guest is separate). */
export function useCoTravellerSync(adults, children, setForm, createEmpty = emptyTraveller) {
  useEffect(() => {
    const totalGuests = Math.max(1, (Number(adults) || 0) + (Number(children) || 0));
    const extraSlots = Math.max(0, totalGuests - 1);

    setForm((prev) => {
      const current = prev.coTravellers || [];
      if (current.length === extraSlots) return prev;
      const next = [...current];
      while (next.length < extraSlots) next.push(createEmpty());
      while (next.length > extraSlots) next.pop();
      return { ...prev, coTravellers: next };
    });
  }, [adults, children, setForm, createEmpty]);
}

/** Keep co-passenger rows in sync with headcount (lead guest is separate). */
export function useGroupMemberSync(count, setForm, createEmpty) {
  useEffect(() => {
    const extra = Math.max(0, Number(count || 1) - 1);
    setForm((prev) => {
      const current = prev.groupMembers || [];
      if (current.length === extra) return prev;
      const next = [...current];
      while (next.length < extra) next.push(createEmpty());
      while (next.length > extra) next.pop();
      return { ...prev, groupMembers: next };
    });
  }, [count, setForm, createEmpty]);
}
