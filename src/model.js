// Pure data logic: no DOM, no network. Covered by tests/model.test.js.
import { MEALS, FOOD_BY, BY_ID, PROGRESSION } from './catalogue.js';

export const pad = n => String(n).padStart(2, '0');
export const keyOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const parseKey = k => { const p = k.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
export const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
export const mondayOf = d => addDays(d, -((d.getDay() + 6) % 7));
export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
export const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
export const clone = o => JSON.parse(JSON.stringify(o));

export function blank() { return { gym: false, cardio: {}, machines: [], loads: {}, meals: {}, extra: {}, extraK: {}, body: {} }; }
export function ensure(e) {
  e = e || blank();
  for (const k of ['cardio', 'loads', 'meals', 'extra', 'extraK', 'body']) e[k] = e[k] || {};
  e.machines = e.machines || [];
  MEALS.forEach(m => { if (!e.meals[m.id]) e.meals[m.id] = {}; });
  return e;
}

const num = (v, lo, hi, step) => {
  if (v === '' || v == null) return null;
  const n = Number(v); if (!isFinite(n) || n < lo || n > hi) return null;
  return step ? Math.round(n / step) * step : n;
};

export function isGymDay(e) { return !!(e && (e.gym || (e.machines && e.machines.length) || (e.cardio && Object.keys(e.cardio).length))); }
export function kcalBurned(e) { let t = 0; if (e && e.cardio) Object.values(e.cardio).forEach(v => { t += Number(v) || 0; }); return t; }
export function exerciseCount(e) { return (e.machines || []).length + Object.keys(e.cardio || {}).length; }

/** Protein (g) and kcal for one meal, using current food values. */
export function mealTotals(e, m) {
  let p = 0, k = 0; if (!e) return { p, k };
  const src = (e.meals && e.meals[m]) || {};
  Object.keys(src).forEach(f => { const food = FOOD_BY[f]; if (food) { const c = Number(src[f]) || 0; p += c * food.p; k += c * food.k; } });
  p += Math.max(0, Number(e.extra && e.extra[m]) || 0);
  k += Math.max(0, Number(e.extraK && e.extraK[m]) || 0);
  return { p, k };
}
/** Day totals. Saved days carry a snapshot (t) so later changes to food values never rewrite history. */
export function dayTotals(e, { live = false } = {}) {
  if (!e) return { p: 0, k: 0 };
  if (!live && e.t && typeof e.t.p === 'number') return { p: e.t.p, k: e.t.k || 0 };
  let p = 0, k = 0; MEALS.forEach(m => { const t = mealTotals(e, m.id); p += t.p; k += t.k; });
  return { p: Math.round(p * 2) / 2, k: Math.round(k) };
}
export function servings(e) { let n = 0; if (!e || !e.meals) return 0; Object.values(e.meals).forEach(s => Object.values(s).forEach(c => { n += Number(c) || 0; })); return n; }

/** Canonical, validated form of a day. Same input → same JSON, so "unsaved changes" is a simple comparison. */
export function normalize(d) {
  d = ensure(clone(d));
  const out = { v: 2, gym: false, machines: [...new Set(d.machines.filter(id => BY_ID[id] && BY_ID[id].g !== 'cardio'))].sort(), cardio: {} };
  Object.keys(d.cardio).sort().forEach(k => { if (BY_ID[k] && BY_ID[k].g === 'cardio') out.cardio[k] = num(d.cardio[k], 0, 3000, 1); });
  out.gym = !!(d.gym || out.machines.length || Object.keys(out.cardio).length);
  const loads = {};
  out.machines.forEach(id => {
    const L = d.loads[id]; if (!L) return; const kind = BY_ID[id].load; if (!kind) return;
    const o = {};
    if (kind === 'time') { const s = num(L.sec, 1, 600, 1); if (s != null) o.sec = s; }
    else { const kg = num(L.kg, 0, 400, 0.5), reps = num(L.reps, 1, 60, 1); if (kg != null && !(L.sug && reps == null)) o.kg = kg; if (reps != null) o.reps = reps; } // a suggested weight only counts once reps are logged
    if (Object.keys(o).length) loads[id] = o;
  });
  if (Object.keys(loads).length) out.loads = loads;
  const knee = num(d.knee, 0, 2, 1); if (out.gym && knee != null) out.knee = knee;
  const meals = {}, extra = {}, extraK = {};
  MEALS.forEach(m => {
    const src = d.meals[m.id] || {}, o = {};
    Object.keys(src).sort().forEach(f => { const c = num(src[f], 0, 20, 1); if (c && FOOD_BY[f]) o[f] = c; });
    if (Object.keys(o).length) meals[m.id] = o;
    const x = num(d.extra[m.id], 0, 300, 0.5); if (x) extra[m.id] = x;
    const xk = num(d.extraK[m.id], 0, 3000, 1); if (xk) extraK[m.id] = xk;
  });
  if (Object.keys(meals).length) out.meals = meals;
  if (Object.keys(extra).length) out.extra = extra;
  if (Object.keys(extraK).length) out.extraK = extraK;
  const veg = num(d.veg, 0, 15, 1); if (veg) out.veg = veg;
  const b = {}, w = num(d.body.weight, 30, 250, 0.1), wa = num(d.body.waist, 40, 200, 0.5), hip = num(d.body.hip, 50, 200, 0.5), bf = num(d.body.bf, 3, 70, 0.1), vf = num(d.body.vf, 1, 30, 1);
  if (w != null) b.weight = Math.round(w * 10) / 10; if (wa != null) b.waist = wa; if (hip != null) b.hip = hip; if (bf != null) b.bf = Math.round(bf * 10) / 10; if (vf != null) b.vf = vf;
  if (Object.keys(b).length) out.body = b;
  if (out.meals || out.extra || out.extraK) out.t = dayTotals(out, { live: true });
  return out;
}
export function isEmpty(n) { return !n.gym && !n.meals && !n.extra && !n.extraK && !n.body && !n.veg; }
export function sameDay(a, b) { return JSON.stringify(normalize(a || blank())) === JSON.stringify(normalize(b || blank())); }

/** Most recent logged load for a machine strictly before `beforeKey`. */
export function lastLoad(entries, id, beforeKey) {
  let best = null;
  Object.keys(entries).forEach(k => { if (k >= beforeKey) return; const L = entries[k] && entries[k].loads && entries[k].loads[id]; if (L && (!best || k > best.key)) best = { key: k, ...L }; });
  return best;
}
/** Double progression: once the top of the rep range is reached, move up one weight step. */
export function nextStep(last) {
  if (!last || last.kg == null || last.reps == null) return null;
  if (last.reps >= PROGRESSION.repTop) return { kg: last.kg + (last.kg >= 20 ? 2.5 : 1), reason: 'You reached ' + PROGRESSION.repTop + ' reps last time' };
  return { kg: last.kg, reason: 'Stay here until you reach ' + PROGRESSION.repTop + ' reps' };
}

/** Body check-ins in date order. */
export function checkins(entries) {
  return Object.keys(entries).sort().filter(k => entries[k] && entries[k].body).map(k => ({ key: k, ...entries[k].body }));
}
/** Average weekly weight change over the last ~4 weeks (kg/week, negative = loss). Needs 2+ weigh-ins at least 7 days apart. */
export function weeklyPace(list) {
  const w = list.filter(c => c.weight != null); if (w.length < 2) return null;
  const last = w[w.length - 1]; const from = w.filter(c => daysBetween(c.key, last.key) <= 28)[0];
  const days = daysBetween(from.key, last.key); if (days < 7) return null;
  return (last.weight - from.weight) / days * 7;
}

/** Waist-to-hip ratio from the latest check-in that has both, or null. */
export function latestWhr(list) {
  const c = [...list].reverse().find(x => x.waist != null && x.hip != null);
  return c ? { key: c.key, whr: Math.round(c.waist / c.hip * 100) / 100 } : null;
}
/** Per machine: first, best and latest kg; flags a drop of `drop` (e.g. 0.1 = 10%) below best. */
export function strengthSummary(entries, drop = 0.1) {
  const byM = {};
  Object.keys(entries).sort().forEach(k => { const L = entries[k] && entries[k].loads; if (!L) return;
    Object.keys(L).forEach(id => { if (L[id].kg == null) return; (byM[id] = byM[id] || []).push({ key: k, ...L[id] }); }); });
  return Object.keys(byM).map(id => { const list = byM[id], last = list[list.length - 1], best = list.reduce((a, b) => b.kg > a.kg ? b : a, list[0]);
    return { id, first: list[0], best, last, count: list.length, dropped: best.kg > 0 && last.kg <= best.kg * (1 - drop) && last.key !== best.key }; })
    .sort((a, b) => a.last.key < b.last.key ? 1 : -1);
}
