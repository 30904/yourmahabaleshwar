/** Stop mouse wheel from incrementing/decrementing focused number inputs. */
export function preventNumberInputScroll(event) {
  const { target } = event;
  if (target instanceof HTMLInputElement && target.type === 'number' && document.activeElement === target) {
    target.blur();
  }
}

export function initPreventNumberInputScroll() {
  document.addEventListener('wheel', preventNumberInputScroll, { passive: true });
}
