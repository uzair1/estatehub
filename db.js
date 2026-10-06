// Low-dependency JSON file database with in-memory cache.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

const cache = new Map();

function file(name) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  return path.join(DATA_DIR, `${name}.json`);
}

export function read(name) {
  if (!cache.has(name)) {
    const f = file(name);
    if (!fs.existsSync(f)) fs.writeFileSync(f, '[]');
    cache.set(name, JSON.parse(fs.readFileSync(f, 'utf8')));
  }
  return cache.get(name);
}

export function write(name, data) {
  cache.set(name, data);
  const f = file(name);
  fs.writeFileSync(f, JSON.stringify(data, null, 2));
  return data;
}

export function insert(name, doc) {
  const rows = read(name);
  const record = { id: `${name.slice(0, -1)}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString(), ...doc };
  rows.push(record);
  write(name, rows);
  return record;
}

export function update(name, id, patch) {
  const rows = read(name);
  const i = rows.findIndex((r) => r.id === id);
  if (i === -1) return null;
  rows[i] = { ...rows[i], ...patch, updatedAt: new Date().toISOString() };
  write(name, rows);
  return rows[i];
}

export function findBy(name, predicate) {
  return read(name).find(predicate) || null;
}

export function findByEmail(name, email) {
  return findBy(name, (r) => (r.email || '').toLowerCase() === String(email || '').toLowerCase());
}

export function remove(name, id) {
  const rows = read(name);
  const i = rows.findIndex((r) => r.id === id);
  if (i === -1) return null;
  const [gone] = rows.splice(i, 1);
  write(name, rows);
  return gone;
}
