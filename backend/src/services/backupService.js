import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import BackupLog from '../models/BackupLog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupRoot = path.join(__dirname, '../uploads/backups');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

export const runBackup = async ({ type = 'MANUAL', scope = 'FULL', userId } = {}) => {
  ensureDir(backupRoot);
  const log = await BackupLog.create({
    type,
    scope,
    status: 'RUNNING',
    triggeredBy: userId,
  });

  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = path.join(backupRoot, `${type.toLowerCase()}-${stamp}`);
    ensureDir(dir);

    const collections = [];
    let sizeBytes = 0;

    if (scope === 'DATABASE' || scope === 'FULL') {
      const db = mongoose.connection.db;
      const cols = await db.listCollections().toArray();
      for (const col of cols) {
        const name = col.name;
        const docs = await db.collection(name).find({}).toArray();
        const file = path.join(dir, `${name}.json`);
        const payload = JSON.stringify(docs, null, 2);
        fs.writeFileSync(file, payload);
        sizeBytes += Buffer.byteLength(payload);
        collections.push(name);
      }
    }

    if (scope === 'MEDIA' || scope === 'FULL') {
      const mediaSrc = path.join(__dirname, '../uploads');
      const mediaDest = path.join(dir, 'media-manifest.json');
      const files = [];
      const walk = (p, rel = '') => {
        if (!fs.existsSync(p)) return;
        for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
          if (entry.name === 'backups') continue;
          const full = path.join(p, entry.name);
          const r = path.join(rel, entry.name);
          if (entry.isDirectory()) walk(full, r);
          else {
            const st = fs.statSync(full);
            files.push({ path: r.replace(/\\/g, '/'), size: st.size });
            sizeBytes += st.size;
          }
        }
      };
      walk(mediaSrc);
      fs.writeFileSync(mediaDest, JSON.stringify({ files, generatedAt: new Date() }, null, 2));
      collections.push('media-manifest');
    }

    log.status = 'SUCCESS';
    log.filePath = dir;
    log.sizeBytes = sizeBytes;
    log.collections = collections;
    log.completedAt = new Date();
    await log.save();
    return log;
  } catch (err) {
    log.status = 'FAILED';
    log.error = err.message;
    log.completedAt = new Date();
    await log.save();
    throw err;
  }
};

export const listBackups = (limit = 50) =>
  BackupLog.find().sort('-createdAt').limit(limit).populate('triggeredBy', 'name email');

export const restoreBackupMeta = async (backupId) => {
  const log = await BackupLog.findById(backupId);
  if (!log || log.status !== 'SUCCESS' || !log.filePath) {
    throw new Error('Backup not found or incomplete');
  }
  if (!fs.existsSync(log.filePath)) throw new Error('Backup files missing on disk');
  // Restore writes JSON collections back — destructive; used carefully by admin
  const db = mongoose.connection.db;
  const files = fs.readdirSync(log.filePath).filter((f) => f.endsWith('.json') && f !== 'media-manifest.json');
  const restored = [];
  for (const file of files) {
    const name = file.replace(/\.json$/, '');
    const docs = JSON.parse(fs.readFileSync(path.join(log.filePath, file), 'utf8'));
    if (!Array.isArray(docs)) continue;
    await db.collection(name).deleteMany({});
    if (docs.length) await db.collection(name).insertMany(docs);
    restored.push({ collection: name, count: docs.length });
  }
  return { backupId, restored };
};
