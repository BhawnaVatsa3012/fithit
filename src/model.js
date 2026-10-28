// Pure data logic: no DOM, no network. Covered by tests/model.test.js.
import { MEALS, FOOD_BY, BY_ID, PROGRESSION, RANK, MINUTES, MOOD_BY, TROUBLE_RULES, CARDIO_ORDER, FREE_ADD, FULL_BODY, BMI_BANDS, DAY_TYPE_LABEL, WHR_LIMIT, MET, SHARP_RULES, MOODS } from './catalogue.js';

export const pad = n => String(n).padStart(2, '0');
export const keyOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const parseKey = k => { const p = k.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
export const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
export const mondayOf = d => addDays(d, -((d.getDay() + 6) % 7));
export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
export const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
export const clone = o => JSON.parse(JSON.stringify(o));

export function blank() { return { gym: false, cardio: {}, machines: [], loads: {}, meals: {}, extra: {}, extraK: {}, body: {}, cx: [], cf: {} }; }
export function ensure(e) {
  e = e || blank();
  for (const k of ['cardio', 'loads', 'meals', 'extra', 'extraK', 'body', 'cf']) e[k] = e[k] || {};
  e.machines = e.machines || []; e.cx = e.cx || [];
  MEALS.forEach(m => { if (!e.meals[m.id]) e.meals[m.id] = {}; if (!e.cf[m.id]) e.cf[m.id] = []; });
  return e;
}

const num = (v, lo, hi, step) => {
  if (v === '' || v == null) return null;
  const n = Number(v); if (!isFinite(n) || n < lo || n > hi) return null;
  return step ? Math.round(n / step) * step : n;
};

export function isGymDay(e) { return !!(e && (e.gym || (e.machines && e.machines.length) || (e.cardio && Object.keys(e.cardio).length) || (e.cx && e.cx.length))); }
export function kcalBurned(e) { let t = 0; if (e && e.cardio) Object.values(e.cardio).forEach(v => { t += Number(v) || 0; }); if (e && e.cx) e.cx.forEach(x => { t += Number(x.kcal) || 0; }); return t; }
export function exerciseCount(e) { return (e.machines || []).length + Object.keys(e.cardio || {}).length + (e.cx || []).length; }

/* ---------- (g) protein by weight or count ---------- */
/** How a food is measured: grams if we know its serving weight, otherwise its unit (egg, scoop). */
export function foodMeasure(f) { return f.gw ? { u: 'g', p: f.p / f.gw, k: f.k / f.gw } : { u: f.unit || 'serving', p: f.p, k: f.k }; }
/** Protein and kcal for a quantity: e.g. 120 g paneer, or 2 scoops whey. */
export function amountTotals(per, q) { q = Number(q) || 0; return { p: Math.round(per.p * q * 10) / 10, k: Math.round(per.k * q) }; }
const cfTotals = list => (list || []).reduce((a, x) => { const t = amountTotals(x, x.q); return { p: a.p + t.p, k: a.k + t.k }; }, { p: 0, k: 0 });
const cleanText = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
export { cleanText };

/* ---------- (a, b) plan a session to fit the time you have ---------- */
/**
 * Fit a session into `mins` minutes. Warm-up and cool-down are fixed; weights are chosen big-moves-first (RANK) until the
 * time runs out, then put in order; cardio fills what's left up to the session's planned minutes (or at least 10).
 * Returns { warm, cool, steps: [{id, start, dur}], cardio: {ids, start, dur}, coolStart, spare, skipped } or null.
 */
export function buildPlan(session, mins) {
  mins = Number(mins); if (!session || session.rest || !mins || mins < 20) return null;
  const ids = session.items || [], cardioIds = ids.filter(id => BY_ID[id] && BY_ID[id].g === 'cardio');
  const lifts = ids.filter(id => BY_ID[id] && BY_ID[id].g !== 'cardio' && !BY_ID[id].paused)
    .map((id, i) => ({ id, i, rank: RANK[id] || 5, dur: BY_ID[id].g === 'core' ? (session.coreMins || MINUTES.core) : (session.liftMins || MINUTES.lift) }));
  const warm = mins >= 45 ? 10 : 5, cool = mins >= 45 ? 5 : 3, rem = mins - warm - cool;
  // Picking order when time is short: the usual moves (prio 0) before extras (prio 1), then big moves first.
  const P = x => (session.prio && session.prio[x.id]) || 0;
  const need = lifts.reduce((a, x) => a + x.dur, 0), byRank = [...lifts].sort((a, b) => P(a) - P(b) || a.rank - b.rank || a.i - b.i);
  const pick = budget => { const out = []; byRank.forEach(x => { if (x.dur <= budget) { out.push(x); budget -= x.dur; } }); return out; };
  let chosen, cardio;
  if (session.cardioFocus) {
    chosen = pick(Math.min(need, Math.max(8, Math.round(rem * 0.3))));
    cardio = cardioIds.length ? rem - chosen.reduce((a, x) => a + x.dur, 0) : 0;
  } else {
    const minCardio = cardioIds.length ? Math.min(10, rem) : 0;
    if (rem - minCardio >= need) { chosen = byRank; cardio = cardioIds.length ? Math.min(session.cardio || 40, rem - need) : 0; }
    else { chosen = pick(rem - minCardio); cardio = cardioIds.length ? rem - chosen.reduce((a, x) => a + x.dur, 0) : 0; }
  }
  chosen = [...chosen].sort((a, b) => a.rank - b.rank || a.i - b.i);
  // Cardio-focused days (Saturday) do the bike first, then core on the mat; other days lift first.
  let t = warm, cardioBlock = null;
  const addCardio = () => { if (cardio > 0) { cardioBlock = { ids: cardioIds, start: t, dur: cardio }; t += cardio; } };
  if (session.cardioFocus) addCardio();
  const steps = chosen.map(x => { const s = { id: x.id, rank: x.rank, start: t, dur: x.dur }; t += x.dur; return s; });
  if (!session.cardioFocus) addCardio();
  return { mins, warm, cool, steps, cardio: cardioBlock, coolStart: t, spare: mins - t - cool,
    skipped: lifts.filter(x => !chosen.includes(x)).map(x => x.id) };
}
export const clock = m => Math.floor(m / 60) + ':' + pad(m % 60);

/** Protein (g) and kcal for one meal, using current food values. */
export function mealTotals(e, m) {
  let p = 0, k = 0; if (!e) return { p, k };
  const src = (e.meals && e.meals[m]) || {};
  Object.keys(src).forEach(f => { const food = FOOD_BY[f]; if (food) { const c = Number(src[f]) || 0; p += c * food.p; k += c * food.k; } });
  const c = cfTotals(e.cf && e.cf[m]); p += c.p; k += c.k;
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
  const cx = (Array.isArray(d.cx) ? d.cx : []).slice(0, 15).map(x => {
    const n = cleanText(x && x.n, 40); if (!n) return null; const o = { n };
    const kg = num(x.kg, 0, 400, 0.5), reps = num(x.reps, 1, 200, 1), min = num(x.min, 1, 300, 1), kcal = num(x.kcal, 0, 3000, 1);
    if (kg != null) o.kg = kg; if (reps != null) o.reps = reps; if (min != null) o.min = min; if (kcal) o.kcal = kcal; return o; }).filter(Boolean);
  if (cx.length) out.cx = cx;
  out.gym = !!(d.gym || out.machines.length || Object.keys(out.cardio).length || cx.length);
  const loads = {};
  out.machines.forEach(id => {
    const L = d.loads[id]; if (!L) return; const kind = BY_ID[id].load; if (!kind) return;
    const o = {};
    if (kind === 'time') { const s = num(L.sec, 1, 600, 1); if (s != null) o.sec = s; }
    else if (kind === 'reps') { const r = num(L.reps, 1, 200, 1); if (r != null) o.reps = r; }
    else { const kg = num(L.kg, 0, 400, 0.5), reps = num(L.reps, 1, 60, 1); if (kg != null && !(L.sug && reps == null)) o.kg = kg; if (reps != null) o.reps = reps; } // a suggested weight only counts once reps are logged
    if (Object.keys(o).length) loads[id] = o;
  });
  if (Object.keys(loads).length) out.loads = loads;
  const knee = num(d.knee, 0, 2, 1); if (out.gym && knee != null) out.knee = knee;
  if (out.gym && MOODS.some(m => m.id === d.mood)) out.mood = d.mood;
  const dt = out.mood === 'cardio' ? 'cardio' : d.dtype; if (out.gym && DAY_TYPE_LABEL[dt]) out.dtype = dt; // the focus you picked for the day (v4.1)
  const meals = {}, extra = {}, extraK = {}, cf = {};
  MEALS.forEach(m => {
    const src = d.meals[m.id] || {}, o = {};
    Object.keys(src).sort().forEach(f => { const c = num(src[f], 0, 20, 1); if (c && FOOD_BY[f]) o[f] = c; });
    if (Object.keys(o).length) meals[m.id] = o;
    const x = num(d.extra[m.id], 0, 300, 0.5); if (x) extra[m.id] = x;
    const xk = num(d.extraK[m.id], 0, 3000, 1); if (xk) extraK[m.id] = xk;
    const list = (Array.isArray(d.cf[m.id]) ? d.cf[m.id] : []).slice(0, 20).map(x => {
      const n = cleanText(x && x.n, 40), u = cleanText(x && x.u, 16) || 'serving', q0 = num(x && x.q, 0.1, 2000), q = q0 == null ? null : Math.round(q0 * 10) / 10, p = num(x && x.p, 0, 200), k = num(x && x.k, 0, 2000);
      if (!n || q == null || p == null) return null;
      const o = { n, u, q, p: Math.round(p * 1000) / 1000, k: Math.round((k || 0) * 1000) / 1000 };
      return amountTotals(o, q).p <= 300 ? o : null; }).filter(Boolean);
    if (list.length) cf[m.id] = list;
  });
  if (Object.keys(meals).length) out.meals = meals;
  if (Object.keys(extra).length) out.extra = extra;
  if (Object.keys(extraK).length) out.extraK = extraK;
  if (Object.keys(cf).length) out.cf = cf;
  const veg = num(d.veg, 0, 15, 1); if (veg) out.veg = veg;
  const b = {}, w = num(d.body.weight, 30, 250, 0.1), wa = num(d.body.waist, 40, 200, 0.5), hip = num(d.body.hip, 50, 200, 0.5), bf = num(d.body.bf, 3, 70, 0.1), vf = num(d.body.vf, 1, 30, 1);
  if (w != null) b.weight = Math.round(w * 10) / 10; if (wa != null) b.waist = wa; if (hip != null) b.hip = hip; if (bf != null) b.bf = Math.round(bf * 10) / 10; if (vf != null) b.vf = vf;
  if (Object.keys(b).length) out.body = b;
  if (out.meals || out.extra || out.extraK || out.cf) out.t = dayTotals(out, { live: true });
  return out;
}
export function isEmpty(n) { return !n.gym && !n.meals && !n.extra && !n.extraK && !n.cf && !n.body && !n.veg; }
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

/* ---------- v4: today's routine from mood, pain areas and body ---------- */
/** BMI from height (cm) and weight (kg), with the band FitHit uses (Indian consensus lines) and the WHO band. */
export function bmiOf(heightCm, weightKg) {
  const h = Number(heightCm) / 100, w = Number(weightKg);
  if (!(h >= 1.2 && h <= 2.3) || !(w >= 30 && w <= 250)) return null;
  const v = Math.round(w / (h * h) * 10) / 10, B = BMI_BANDS;
  const band = v < B.under ? 'under' : v < B.over ? 'normal' : v < B.obese ? 'over' : 'obese';
  const who = v < B.under ? 'under' : v < B.whoOver ? 'normal' : v < B.whoObese ? 'over' : 'obese';
  return { v, band, who };
}
/** Waist-to-hip risk line for the person's sex (women 0.85, men 0.90; women's line if not set). */
export const whrLimitFor = sex => sex === 'm' ? WHR_LIMIT.m : WHR_LIMIT.f;

/** Apply pain areas to one exercise: { id } kept (maybe with cues), swapped { id, from, area, why }, or dropped { id: null }. */
export function adjustFor(id, troubles) {
  const skipBy = troubles.find(t => TROUBLE_RULES[t] && TROUBLE_RULES[t].skip[id]);
  if (skipBy) {
    const [swap, why] = TROUBLE_RULES[skipBy].skip[id];
    const ok = swap && !troubles.some(t => TROUBLE_RULES[t] && TROUBLE_RULES[t].skip[swap]);
    return { id: ok ? swap : null, from: id, area: skipBy, why, cues: ok ? modsFor(swap, troubles) : [] };
  }
  return { id, cues: modsFor(id, troubles) };
}
const modsFor = (id, troubles) => troubles.map(t => TROUBLE_RULES[t] && TROUBLE_RULES[t].mod[id]).filter(Boolean);

/**
 * Today's routine. mood: 'heavy' | 'light' | 'cardio'. troubles: area ids. session: today's planned session.
 * bmi: from bmiOf (optional). seed: a number that changes daily, to rotate the free-weight picks.
 * Returns { mood, session (feed it to buildPlan), items, cues: {id: text}, changes: [{from, to, area, why}], notes: [] }.
 */
export function buildRoutine({ mood, troubles = [], sharp = [], session, bmi = null, seed = 0 }) {
  const M = MOOD_BY[mood]; if (!M) return null;
  troubles = troubles.filter(t => TROUBLE_RULES[t]); sharp = sharp.filter(t => troubles.includes(t) && SHARP_RULES[t]);
  const cues = {}, changes = [], notes = [], out = [], prio = {};
  /** Sharp pain area that rests this exercise, or null. */
  const restedBy = id => { const m = BY_ID[id]; if (!m || m.g === 'cardio') return null;
    return sharp.find(t => { const R = SHARP_RULES[t]; return R.only ? !R.only.includes(id) : (m.m || []).some(x => R.muscles.includes(x)); }) || null; };
  const add = (id, track, p = 0) => {
    if (!BY_ID[id] || BY_ID[id].paused) return false;
    const rest = restedBy(id);
    if (rest) { if (track) changes.push({ from: id, to: null, area: rest, why: 'sharp pain today, so FitHit rests ' + SHARP_RULES[rest].rest, sharp: true }); return false; }
    const r = adjustFor(id, troubles);
    if (r.id && restedBy(r.id)) r.id = null;
    if (track && r.from) changes.push({ from: r.from, to: r.id, area: r.area, why: r.why, dup: !!(r.id && out.includes(r.id)) });
    if (!r.id || out.includes(r.id)) return false;
    out.push(r.id); prio[r.id] = p; if (r.cues.length) cues[r.id] = r.cues.join('. ');
    return true;
  };
  // Cardio machines, best first for the pain areas and body.
  let order = [...CARDIO_ORDER];
  if (troubles.includes('knee') || troubles.includes('ankle')) order = ['recumbent_bike', 'upright_bike', 'cross_trainer', 'treadmill'];
  sharp.forEach(t => { if (SHARP_RULES[t].cardio) order = order.filter(id => SHARP_RULES[t].cardio.includes(id)); });
  const cardioIds = order.filter(id => adjustFor(id, troubles).id === id).slice(0, 2);
  if (sharp.length) notes.push('Sharp pain today in your ' + sharp.map(t => t === 'back' ? 'lower back' : t).join(' and ') + ': FitHit rests ' + [...new Set(sharp.map(t => SHARP_RULES[t].rest))].join(' and ') + '. Don\u2019t train through sharp pain. If it lasts more than a few days, see a physiotherapist.' + (cardioIds.length ? ' Cardio only if it stays pain-free.' : ''));
  if (bmi && bmi.band === 'obese') notes.push('Cardio is kept low-impact (bikes, cross trainer, walking) to go easy on the knees and hips.');
  if (bmi && bmi.band === 'under') notes.push('Your BMI is under 18.5, so cardio is kept short and the focus is on building strength. Eat enough to fuel it.');

  // Only cardio, or a Cardio day: cardio machines only, nothing else. The mood sets the pace and length.
  if (M.cardioFocus || (session && session.focus === 'cardio')) {
    const dur = bmi && bmi.band === 'under' ? 25 : mood === 'light' ? 30 : mood === 'heavy' ? 45 : 60;
    return { mood, items: cardioIds, cues, changes, notes,
      session: { title: M.cardioFocus ? 'Only cardio' : M.label + ': Cardio', items: cardioIds, cardio: dur, cardioFocus: true } };
  }
  const focus = session && !session.rest && session.focus ? session.focus : 'full';
  const base = focus === 'full' ? FULL_BODY : (session.items || []).filter(id => BY_ID[id] && BY_ID[id].g !== 'cardio');
  base.forEach(id => add(id, true));
  // Free weights on top of the usual moves, a different pick each day.
  const pool = FREE_ADD[focus], start = Math.abs(Math.floor(seed)) % pool.length; let added = 0;
  for (let i = 0; i < pool.length && added < M.freeAdd; i++) if (add(pool[(start + i) % pool.length], false, 1)) added++;
  if (added < M.freeAdd && focus !== 'full') { // pain areas ruled some out: top up from the full-body list
    const full = FREE_ADD.full; for (let i = 0; i < full.length && added < M.freeAdd; i++) if (add(full[(start + i) % full.length], false, 1)) added++; }
  if (!out.length) notes.push('Nothing is safe to lift today with this pain. Do the cardio below if it\u2019s pain-free, or rest.');
  const lifts = out.filter(id => BY_ID[id].g !== 'core').concat(out.filter(id => BY_ID[id].g === 'core'));
  const cardio = bmi && bmi.band === 'under' ? 10 : M.cardio;
  return { mood, items: lifts.concat(cardioIds), cues, changes, notes,
    session: { title: M.label, items: lifts.concat(cardioIds), cardio, liftMins: M.liftMin, coreMins: M.coreMin, prio } };
}

/** Weight to suggest for a machine: progression on a normal or heavy day, about 60% of last time on a light day. */
export function suggestLoad(last, mood) {
  const M = MOOD_BY[mood];
  if (M && M.loadPct && last && last.kg != null) {
    const kg = Math.max(0, Math.round(last.kg * M.loadPct * 2) / 2);
    return { kg, reason: 'Light day: about ' + Math.round(M.loadPct * 100) + '% of your last weight' };
  }
  return nextStep(last);
}

/** Estimated kcal for a planned session: MET \u00d7 kg \u00d7 hours, block by block. Returns a rounded number or null. */
export function estimateKcal(plan, mood, weightKg) {
  const M = MOOD_BY[mood], w = Number(weightKg); if (!plan || !M || !(w >= 30)) return null;
  let metMin = plan.warm * MET.warm + plan.cool * MET.cool;
  plan.steps.forEach(s => { metMin += s.dur * (BY_ID[s.id].g === 'core' ? MET.core : M.met); });
  if (plan.cardio) metMin += plan.cardio.dur * M.cardioMet;
  return Math.round(metMin * w / 60 / 10) * 10;
}
