/**
 * Keep one listing per guide / taxi-driver / horse vendor; hard-delete extras.
 * Prefer APPROVED + active, then most recently updated.
 */
import Guide from '../models/Guide.js';
import Driver from '../models/Driver.js';
import Horse from '../models/Horse.js';
import Booking from '../models/Booking.js';

function score(doc) {
  let s = 0;
  if (doc.isActive !== false) s += 10;
  if (String(doc.approvalStatus || '').toUpperCase() === 'APPROVED') s += 20;
  if (String(doc.approvalStatus || '').toUpperCase() === 'PENDING') s += 5;
  s += new Date(doc.updatedAt || doc.createdAt || 0).getTime() / 1e15;
  return s;
}

async function cleanupCollection({ Model, ownerField, label, bookingField }) {
  const docs = await Model.find({ [ownerField]: { $ne: null } }).lean();
  const byOwner = new Map();

  for (const doc of docs) {
    const key = String(doc[ownerField]);
    if (!byOwner.has(key)) byOwner.set(key, []);
    byOwner.get(key).push(doc);
  }

  let kept = 0;
  let removed = 0;
  const details = [];

  for (const [, list] of byOwner) {
    if (list.length <= 1) {
      kept += list.length;
      continue;
    }

    const ranked = [...list].sort((a, b) => score(b) - score(a));
    const keep = ranked[0];
    const drop = ranked.slice(1);
    kept += 1;

    for (const doc of drop) {
      await Model.deleteOne({ _id: doc._id });
      removed += 1;
      details.push({
        label,
        removedId: String(doc._id),
        removedName: doc.name,
        keptId: String(keep._id),
        keptName: keep.name,
      });
    }

    if (bookingField && drop.length) {
      const ids = drop.map((d) => d._id);
      await Booking.updateMany({ [bookingField]: { $in: ids } }, { $unset: { [bookingField]: 1 } });
    }
  }

  return { label, owners: byOwner.size, kept, removed, details };
}

export async function cleanupDuplicateServiceListings() {
  const guides = await cleanupCollection({
    Model: Guide,
    ownerField: 'user',
    label: 'GUIDE',
    bookingField: 'guide',
  });
  const drivers = await cleanupCollection({
    Model: Driver,
    ownerField: 'user',
    label: 'TAXI/DRIVER',
    bookingField: 'driver',
  });
  const horses = await cleanupCollection({
    Model: Horse,
    ownerField: 'operator',
    label: 'HORSE',
    bookingField: 'horse',
  });

  return {
    guides,
    drivers,
    horses,
    totalRemoved: guides.removed + drivers.removed + horses.removed,
  };
}
