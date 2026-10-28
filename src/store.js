// Everything that talks to Supabase or the device. The UI never calls Supabase directly.
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { DEFAULT_SETTINGS } from './catalogue.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' } });

const T = 'fithit_days';
const isNetwork = err => !err || !err.code || /fetch|network|Failed to fetch|Load failed/i.test(err.message || '');

/** Returns true if this account may use FitHit (the first account to sign in claims it). */
export async function claim() {
  const { data, error } = await sb.rpc('fithit_claim');
  if (error) throw error;
  return data === true;
}
/** All days: { entries: {day: data}, meta: {day: updated_at} } */
export async function loadAll() {
  const { data, error } = await sb.from(T).select('day,data,updated_at').order('day');
  if (error) throw error;
  const entries = {}, meta = {};
  (data || []).forEach(r => { entries[r.day] = r.data; meta[r.day] = r.updated_at; });
  return { entries, meta };
}
/**
 * Save one day with a conflict check: the write only succeeds if the row hasn't changed
 * since we loaded it (base = updated_at we last saw, or null if we think it doesn't exist).
 * Returns { ok, updated_at } or { conflict: true } or { offline: true } or { error }.
 */
export async function saveDay(userId, day, data, base) {
  try {
    let res;
    if (data === null) {
      if (!base) return { ok: true, updated_at: null };
      res = await sb.from(T).delete().eq('user_id', userId).eq('day', day).eq('updated_at', base).select('day');
      if (res.error) return isNetwork(res.error) ? { offline: true } : { error: res.error };
      return res.data.length ? { ok: true, updated_at: null } : { conflict: true };
    }
    if (base) {
      res = await sb.from(T).update({ data }).eq('user_id', userId).eq('day', day).eq('updated_at', base).select('updated_at');
      if (res.error) return isNetwork(res.error) ? { offline: true } : { error: res.error };
      return res.data.length ? { ok: true, updated_at: res.data[0].updated_at } : { conflict: true };
    }
    res = await sb.from(T).insert({ user_id: userId, day, data }).select('updated_at');
    if (res.error) {
      if (res.error.code === '23505') return { conflict: true };
      return isNetwork(res.error) ? { offline: true } : { error: res.error };
    }
    return { ok: true, updated_at: res.data[0].updated_at };
  } catch (e) { return { offline: true }; }
}
/** Settings plus their version: { settings, base } where base = updated_at, or null if no settings row exists yet. */
export async function loadSettings() {
  const { data, error } = await sb.from('fithit_settings').select('data,updated_at').maybeSingle();
  if (error) throw error;
  return { settings: { ...DEFAULT_SETTINGS, ...((data && data.data) || {}) }, base: data ? data.updated_at : null };
}
/**
 * Save settings with the same conflict check as days: the write only lands if the row is still the version we loaded
 * (base = updated_at we last saw, or null if we think there is no row). Returns { ok, base } / { conflict } / { error }.
 */
export async function saveSettings(userId, s, base) {
  const clean = {};
  Object.keys(DEFAULT_SETTINGS).forEach(k => { if (s[k] !== undefined && JSON.stringify(s[k]) !== JSON.stringify(DEFAULT_SETTINGS[k])) clean[k] = s[k]; });
  try {
    if (base) {
      const r = await sb.from('fithit_settings').update({ data: clean }).eq('user_id', userId).eq('updated_at', base).select('updated_at');
      if (r.error) return { error: r.error };
      return r.data.length ? { ok: true, base: r.data[0].updated_at } : { conflict: true };
    }
    const r = await sb.from('fithit_settings').insert({ user_id: userId, data: clean }).select('updated_at');
    if (r.error) return r.error.code === '23505' ? { conflict: true } : { error: r.error };
    return { ok: true, base: r.data[0].updated_at };
  } catch { return { error: { message: 'no connection' } }; }
}
export async function exportAll() {
  const [days, settings] = await Promise.all([sb.from(T).select('day,data,created_at,updated_at').order('day'), sb.from('fithit_settings').select('data,updated_at').maybeSingle()]);
  if (days.error) throw days.error;
  return { app: 'FitHit', exported_at: new Date().toISOString(), settings: settings.data ? settings.data.data : {}, days: days.data };
}
export async function deleteAll(userId) {
  const a = await sb.from(T).delete().eq('user_id', userId);
  const b = await sb.from('fithit_settings').delete().eq('user_id', userId);
  return a.error || b.error ? { error: a.error || b.error } : { ok: true };
}

/* ----- on-device: cache of saved days + unsaved drafts (survive closing the tab or losing signal) ----- */
const CACHE = 'fithit-cache-v2', DRAFTS = 'fithit-drafts-v2';
const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } };
export const cache = {
  get: uid => { const c = read(CACHE); return c && c.uid === uid ? c : null; },
  set: (uid, entries, meta, settings) => write(CACHE, { uid, entries, meta, settings }) }; // settings are a display copy only; saves need a fresh server version
export const draftStore = {
  get: uid => { const c = read(DRAFTS); return c && c.uid === uid ? c.drafts || {} : {}; },
  set: (uid, drafts) => write(DRAFTS, { uid, drafts }) };
export function clearDevice() { try { localStorage.removeItem(CACHE); localStorage.removeItem(DRAFTS); } catch (e) { /* ignore */ } }
