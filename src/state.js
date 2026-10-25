// App state shared by the screens (views.js) and the controller (main.js).
import { MEALS, DEFAULT_SETTINGS } from './catalogue.js';
import { keyOf, addDays, mondayOf, clone, blank, ensure, sameDay, isGymDay, kcalBurned, dayTotals } from './model.js';
import { draftStore } from './store.js';
import { DOW } from './catalogue.js';

/* ---------------- state ---------------- */
export const S = { entries: {}, meta: {}, settings: { ...DEFAULT_SETTINGS }, drafts: {}, saving: null, pending: new Set() };
export const auth = { user: null, ready: false, loaded: false, member: null, email: '', sent: false, error: '', busy: false };
export const today = () => keyOf(new Date());
export const ui = { tab: 'log', selected: today(), othersOpen: null, meal: defaultMeal(), settingsOpen: false, sd: null,
  mins: readMins(), mood: readMood(), aboutOpen: false, ab: null, howOpen: null, cx: {}, calc: { food: 'b:whey', qty: '', n: '', u: '', p: '', k: '', save: true } };
function readMins() { try { const v = Number(localStorage.getItem('fithit-mins')); return v >= 20 && v <= 240 ? v : null; } catch (e) { return null; } }
export function rememberMins(v) { try { if (v) localStorage.setItem('fithit-mins', String(v)); else localStorage.removeItem('fithit-mins'); } catch (e) { /* storage blocked */ } }
function readMood() { try { const v = JSON.parse(localStorage.getItem('fithit-mood') || 'null'); return v && v.d === keyOf(new Date()) ? v.m : null; } catch { return null; } }
export function rememberMood(m) { try { if (m) localStorage.setItem('fithit-mood', JSON.stringify({ d: today(), m })); else localStorage.removeItem('fithit-mood'); } catch { /* storage blocked */ } }
function defaultMeal() { const h = new Date().getHours(); return h < 11 ? 'b' : h < 16 ? 'l' : h < 19 ? 's' : 'd'; }

export function draftFor(k) { if (!S.drafts[k]) S.drafts[k] = ensure(clone(S.entries[k] || blank())); return S.drafts[k]; }
export function isDirty(k) { return !!S.drafts[k] && !sameDay(S.drafts[k], S.entries[k]); }
export function anyDirty() { return Object.keys(S.drafts).some(isDirty); }
export function viewOf(k) { return S.drafts[k] || S.entries[k]; }
export function persistDrafts() {
  if (!auth.user) return; const out = {};
  Object.keys(S.drafts).forEach(k => { if (isDirty(k)) out[k] = S.drafts[k]; });
  draftStore.set(auth.user.id, out);
}
export const proteinGoal = () => S.settings.proteinGoal || DEFAULT_SETTINGS.proteinGoal;
export const mealTarget = m => Math.round(proteinGoal() * MEALS.find(x => x.id === m).share);

/* ---------------- derived ---------------- */
export function derive() {
  const E = S.entries, TODAY = today(), mon = mondayOf(new Date()), monKey = keyOf(mon), mp = TODAY.slice(0, 7);
  const week = []; for (let i = 0; i < 7; i++) { const k = keyOf(addDays(mon, i)); week.push({ key: k, letter: DOW[i], hit: isGymDay(E[k]), today: k === TODAY, fut: k > TODAY }); }
  let weekKcal = 0, monthCount = 0, last = null;
  Object.keys(E).forEach(k => { const e = E[k]; if (!isGymDay(e) || k > TODAY) return; if (k >= monKey) weekKcal += kcalBurned(e); if (k.slice(0, 7) === mp) monthCount++; if (!last || k > last) last = k; });
  const proteinDays = week.filter(w => !w.fut && dayTotals(E[w.key]).p >= proteinGoal()).length;
  const elapsed = week.filter(w => !w.fut).length;
  return { E, TODAY, mon, week, weekHits: week.filter(w => w.hit).length, weekKcal, monthCount, last, proteinDays, elapsed };
}

