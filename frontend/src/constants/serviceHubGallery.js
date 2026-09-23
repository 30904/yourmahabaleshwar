export const SERVICE_HUB_TENANTS = ['GUIDE', 'TAXI', 'DRIVER', 'HORSE'];

export const SERVICE_HUB_LAYOUTS = [
  {
    id: 'collage',
    label: 'Hero collage',
    hint: '1 large image + smaller tiles (magazine style)',
  },
  {
    id: 'carousel',
    label: 'Carousel',
    hint: 'Horizontal scroll / slide through photos',
  },
  {
    id: 'masonry',
    label: 'Masonry',
    hint: 'Mixed heights, staggered editorial grid',
  },
  {
    id: 'strip',
    label: 'Full-bleed strip',
    hint: 'Wide cinematic band under Book now',
  },
  {
    id: 'moments',
    label: 'Moments + captions',
    hint: 'Photo tiles with optional short labels',
  },
  {
    id: 'split',
    label: 'Split layout',
    hint: 'Copy on the left, image stack on the right',
  },
  {
    id: 'lightbox',
    label: 'Preview + lightbox',
    hint: 'Show a few photos, open full gallery on click',
  },
];

export const DEFAULT_SERVICE_HUB_LAYOUT = 'collage';

export function isValidServiceHubLayout(id) {
  return SERVICE_HUB_LAYOUTS.some((l) => l.id === id);
}
