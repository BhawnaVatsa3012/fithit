// Screens. Each function returns HTML for one part of the app; no saving or event handling here.
import { GROUPS, GROUP_LABEL, MACHINES, BY_ID, CUES, PAIN_RULE, planFor, DAYNAMES, MUSCLES, DOW, MEALS, FOODS, FOOD_BY, RANK, RANK_WHY, GUIDE, demoLinks, CIRCUIT, PROGRESSION, MOODS, MOOD_BY, TROUBLES, TROUBLE_LABEL, RED_FLAGS } from './catalogue.js';
import { keyOf, parseKey, addDays, mondayOf, daysBetween, has, isGymDay, kcalBurned, exerciseCount, mealTotals, dayTotals, servings, lastLoad, checkins, weeklyPace, latestWhr, strengthSummary, pad, buildPlan, clock, foodMeasure, amountTotals, buildRoutine, bmiOf, whrLimitFor, suggestLoad, estimateKcal } from './model.js';
import { S, auth, ui, today, draftFor, isDirty, viewOf, proteinGoal, mealTarget } from './state.js';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const fmt = (n, d = 0) => Number(n).toLocaleString('en-GB', { maximumFractionDigits: d, minimumFractionDigits: 0 });
const fmtG = g => fmt(Math.round(g * 2) / 2, 1);
const ago = n => n === 0 ? 'Today' : n === 1 ? 'Yesterday' : n + ' days ago';
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
export const shortDate = k => parseKey(k).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const val = v => v == null ? '' : esc(v);

/* ---------------- icons ---------------- */
const svg = (p, s = 20, w = 2) => '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
const I = {
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', down: '<path d="m6 9 6 6 6-6"/>', check: '<path d="M20 6 9 17l-5-5"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>', minus: '<path d="M5 12h14"/>', copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  dumbbell: '<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>', x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>', clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>' };
const CHECK = '<span class="cb on">' + svg(I.check, 18, 3) + '</span>', BOX = '<span class="cb"></span>';

function ringSvg(week, o) {
  const size = o.size, c = size / 2, w = o.width, r = c - w / 2 - 2, C = 2 * Math.PI * r, gap = o.gap, seg = C / 7 - gap; let s = '';
  week.forEach((wd, i) => { s += '<circle cx="' + c + '" cy="' + c + '" r="' + r.toFixed(2) + '" fill="none" stroke-width="' + (wd.hit ? w : o.missWidth) + '" style="stroke:' + (wd.hit ? 'var(--volt)' : 'var(--line)') + '" stroke-dasharray="' + seg.toFixed(2) + ' ' + (C - seg).toFixed(2) + '" transform="rotate(' + (-90 + i * 360 / 7 + (gap / C * 360) / 2).toFixed(2) + ' ' + c + ' ' + c + ')"/>'; });
  return '<svg viewBox="0 0 ' + size + ' ' + size + '" style="display:block;width:100%;height:100%" aria-hidden="true">' + s + '</svg>';
}
function arcSvg(frac, size, w) {
  const c = size / 2, r = c - w / 2 - 1, C = 2 * Math.PI * r;
  return '<svg viewBox="0 0 ' + size + ' ' + size + '" style="display:block;width:100%;height:100%" aria-hidden="true"><circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke-width="' + w + '" style="stroke:var(--line)"/><circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke-width="' + w + '" stroke-linecap="round" style="stroke:var(--volt)" stroke-dasharray="' + (Math.max(0.0001, Math.min(1, frac)) * C).toFixed(2) + ' ' + C.toFixed(2) + '" transform="rotate(-90 ' + c + ' ' + c + ')"/></svg>';
}

/* ---------------- views ---------------- */
export function header(D) {
  return '<header class="hdr"><div class="mark"><b>FITHIT</b><i></i></div><div class="pill"><span class="v num">' + D.weekHits + '/' + S.settings.sessionsGoal + '</span><span class="m">sessions this week</span></div></header>' +
    (auth.loaded ? '' : '<div class="mode">Syncing your days\u2026</div>') +
    (S.pending.size ? '<div class="mode" role="status">' + plural(S.pending.size, 'day') + ' waiting to save. They\u2019ll save when you\u2019re back online.</div>' : '');
}
export function switcher(D) {
  const sel = ui.selected, sd = parseKey(sel), yest = keyOf(addDays(new Date(), -1));
  const kick = sel === D.TODAY ? 'Today' : sel === yest ? 'Yesterday' : ago(daysBetween(sel, D.TODAY));
  return '<div class="sw"><button class="ib" data-act="prev" aria-label="Previous day">' + svg(I.left) + '</button>' +
    '<div class="sw-c"><div class="kick v">' + kick + '</div><div class="sw-t">' + sd.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + '</div></div>' +
    '<button class="ib" data-act="next" aria-label="Next day"' + (sel >= D.TODAY ? ' disabled' : '') + '>' + svg(I.right) + '</button></div>';
}
function loadRow(m, d) {
  const L = d.loads[m.id] || {}, last = lastLoad(S.entries, m.id, ui.selected);
  if (m.load === 'time') {
    return '<div class="ld"><label class="lf"><span class="sr">Seconds held for ' + esc(m.name) + '</span><input class="inp v sm num" type="number" inputmode="numeric" min="1" max="600" placeholder="0" data-load="' + m.id + '" data-f="sec" value="' + val(L.sec) + '"></label><span class="unit">sec</span>' +
      '<span class="cue grow">' + (last && last.sec ? 'Last: ' + last.sec + ' s (' + shortDate(last.key) + ')' : 'First time logging') + '</span></div>';
  }
  if (m.load === 'reps') {
    return '<div class="ld"><label class="lf"><span class="sr">Reps for ' + esc(m.name) + '</span><input class="inp v sm num" type="number" inputmode="numeric" min="1" max="200" placeholder="0" data-load="' + m.id + '" data-f="reps" value="' + val(L.reps) + '"></label><span class="unit">reps</span>' +
      '<span class="cue grow">' + (last && last.reps ? 'Last: ' + last.reps + ' reps (' + shortDate(last.key) + ')' : 'First time logging') + '</span></div>';
  }
  const step = suggestLoad(last, moodFor(ui.selected));
  return '<div class="ld"><label class="lf"><span class="sr">Weight in kg for ' + esc(m.name) + '</span><input class="inp v sm num" type="number" inputmode="decimal" step="0.5" min="0" max="400" placeholder="kg" data-load="' + m.id + '" data-f="kg" value="' + val(L.kg) + '"></label><span class="unit">kg \u00d7</span>' +
    '<label class="lf"><span class="sr">Reps for ' + esc(m.name) + '</span><input class="inp v sm num" type="number" inputmode="numeric" min="1" max="60" placeholder="reps" data-load="' + m.id + '" data-f="reps" value="' + val(L.reps) + '"></label><span class="unit">reps</span></div>' +
    '<div class="ldn cue">' + (last && last.kg != null ? 'Last: ' + fmt(last.kg, 1) + ' kg \u00d7 ' + (last.reps || '?') + ' (' + shortDate(last.key) + ')' + (step ? ' \u00b7 <span class="vt">Today: ' + fmt(step.kg, 1) + ' kg</span>. ' + step.reason + '.' : '') : 'First time logging: pick a weight you can lift 12 times with good form.') + '</div>';
}
function itemRow(m, cue, num, d) {
  const isC = m.g === 'cardio', on = isC ? has(d.cardio, m.id) : d.machines.includes(m.id), pausedOnly = !!m.paused && !cue, text = cue || m.paused || '';
  let h = '<div class="row' + (on ? ' on' : '') + (pausedOnly && !on ? ' paused' : '') + '"><button class="row-b' + (num ? '' : ' sm') + '" data-m="' + m.id + '" aria-pressed="' + on + '">' +
    (num ? '<span class="n num">' + num + '</span>' : '') + '<span class="grow"><span class="nm"><b>' + esc(m.name) + '</b>' +
    (num ? '<span class="tag">' + GROUP_LABEL[m.g] + '</span>' : (pausedOnly ? '<span class="tag e">Paused</span>' : '')) + '</span>' +
    (text ? '<span class="cue">' + esc(text) + '</span>' : '') + '</span>' + (on ? CHECK : BOX) + '</button>';
  if (isC && on) { const v = d.cardio[m.id]; h += '<label class="kc' + (num ? '' : ' np') + '"><span style="color:var(--ember);display:grid">' + svg(I.flame, 16) + '</span><span class="grow">Calories from the screen</span><input class="inp num" type="number" inputmode="numeric" min="0" max="3000" placeholder="0" data-kcal="' + m.id + '" value="' + val(v) + '" aria-label="Calories from ' + esc(m.name) + '"><span class="unit">kcal</span></label>'; }
  if (!isC && on && m.load) h += '<div class="ldw' + (num ? '' : ' np') + '">' + loadRow(m, d) + '</div>';
  if (GUIDE[m.id]) { const open = ui.howOpen === m.id;
    h += '<div class="how' + (num ? '' : ' np') + '"><button class="lnk" data-how="' + m.id + '" aria-expanded="' + open + '">' + (open ? 'Hide how-to' : 'How to do it') + '</button>' + (open ? guidePanel(m) : '') + '</div>'; }
  return h + '</div>';
}
/** (c, d, e) Set-up, steps, the mistake to avoid, and demo links for one exercise. */
export function guidePanel(m) {
  const g = GUIDE[m.id], L = demoLinks(m.name.replace(/\s*\(.*\)$/, ''));
  return '<div class="gp"><div class="gp-k">Set up</div><p>' + esc(g.s) + '</p><div class="gp-k">Do it</div><ol>' + g.st.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' +
    (CUES[m.id] ? '<div class="gp-k">Your cue</div><p class="vt">' + esc(CUES[m.id]) + '</p>' : '') +
    '<div class="gp-k">Avoid</div><p>' + esc(g.a) + '</p>' +
    '<div class="gp-l"><a href="' + L.video + '" target="_blank" rel="noopener noreferrer">Watch a demo ' + svg(I.ext, 14) + '</a><a href="' + L.pics + '" target="_blank" rel="noopener noreferrer">See pictures ' + svg(I.ext, 14) + '</a></div>' +
    '<p class="fine" style="margin-top:8px">Links open a search on YouTube or Google Images. Pick a video from a qualified trainer and follow your own cue above if they differ.</p></div>';
}
/* ---------- v4: today's routine from mood, pain areas and body ---------- */
/** Mood applies to today only, so past days keep their own programme. */
export const moodFor = k => (k === today() ? ui.mood : null);
const lastWeigh = () => { const w = [...checkins(S.entries)].reverse().find(c => c.weight != null); return w || null; };
export function bodyNow() {
  // Whichever is newer: the weight typed under About you, or the latest weigh-in on the Progress tab.
  const st = S.settings, lw = lastWeigh(), useSet = st.weightKg && (!lw || (st.weightAt && st.weightAt >= lw.key)), kg = useSet ? st.weightKg : (lw ? lw.weight : st.weightKg || null);
  return { kg, fromWeigh: !useSet && lw ? lw.key : null, bmi: bmiOf(st.heightCm, kg) };
}
/** Pain is asked once a day, the first time a mood is picked: one tap if nothing changed. */
export const painCheckedToday = () => S.settings.troublesAsked && S.settings.troublesAt === today();
/** Today's programme: the routine if a mood is picked (and pain areas answered), else the weekday session. */
export function programmeFor(k) {
  const p = planFor(parseKey(k).getDay(), S.settings.restDow), mood = moodFor(k);
  const routine = mood && painCheckedToday() ? buildRoutine({ mood, troubles: S.settings.troubles || [], sharp: S.settings.troubleSharp || [], session: p, bmi: bodyNow().bmi, seed: daysBetween('2026-01-01', k) }) : null;
  return { p, mood, routine, ids: routine ? routine.items : (p.items || []) };
}
const MIN_CHOICES = [30, 45, 60, 75, 90, 120], MIN_LABEL = { 30: '30 min', 45: '45 min', 60: '1 hr', 75: '1\u00bc hr', 90: '1\u00bd hr', 120: '2 hr' };
const SEX_LABEL = { f: 'Female', m: 'Male' };
function aboutForm(first) {
  const a = ui.ab || {}, lw = lastWeigh(), tr = a.troubles || [], sh = a.sharp || [], st = S.settings, recheck = first && st.troublesAsked, prev = st.troubles || [];
  const n = (k, label, unit, ph, min, max, step) => '<label class="bf"><span>' + label + '</span><span class="bfi"><input class="inp v sm num" type="number" inputmode="decimal" min="' + min + '" max="' + max + '" step="' + step + '" placeholder="' + ph + '" data-ab="' + k + '" value="' + val(a[k]) + '"><span class="unit">' + unit + '</span></span></label>';
  const chip = t => { const on = tr.includes(t.id), sharp = sh.includes(t.id);
    return '<button class="' + (sharp ? 'sharp' : '') + '" aria-pressed="' + on + '" data-tr="' + t.id + '" aria-label="' + esc(t.label) + ': ' + (sharp ? 'sharp pain today' : on ? 'niggle or healing' : 'no trouble') + '">' + esc(t.label) + (sharp ? ' \u00b7 sharp' : '') + '</button>'; };
  let h = '<div class="about">' + (first ? '<div class="kick v">Before FitHit builds it</div><p class="ab-q">Any pain or trouble today?</p>' +
      (recheck ? '<p class="cue">Last check (' + (st.troublesAt ? shortDate(st.troublesAt) : 'earlier') + '): <b class="vt">' + esc(prev.length ? prev.map(t => TROUBLE_LABEL[t] + ((st.troubleSharp || []).includes(t) ? ' (sharp)' : '')).join(', ') : 'no trouble') + '</b>.</p><button class="save full" style="margin-top:12px" data-act="trsame"' + (ui.savingSettings ? ' disabled' : '') + '>' + (ui.savingSettings ? 'Saving\u2026' : 'Same as last time') + '</button><p class="cue" style="margin-top:14px">Or change it:</p>' : '')
    : '<div class="kick v">About you</div><p class="cue" style="margin-top:4px">Pain or trouble areas</p>') +
    '<p class="cue">Tap once for a niggle or healing area, twice for sharp pain today, a third time to clear. FitHit swaps or skips moves that load it, and rests the whole area if it\u2019s sharp.</p>' +
    '<div class="tchips" role="group" aria-label="Pain or trouble areas">' + TROUBLES.map(chip).join('') + '</div>' +
    '<p class="msg err" style="font-size:12.5px">' + esc(RED_FLAGS) + '</p>';
  if (!first || !st.troublesAsked) h += '<div class="bgrid" style="margin-top:14px">' + n('heightCm', 'Height', 'cm', '160', 120, 230, 1) + n('weightKg', 'Weight', 'kg', lw ? fmt(lw.weight, 1) : '70', 30, 250, 0.1) + '</div>' +
    '<label class="bf" style="margin-top:12px"><span>Gender</span><select class="inp v sel" data-ab="sex"><option value="">Prefer not to say</option><option value="f"' + (a.sex === 'f' ? ' selected' : '') + '>Female</option><option value="m"' + (a.sex === 'm' ? ' selected' : '') + '>Male</option></select></label>' +
    '<p class="fine">Height and weight give your BMI, which steers the cardio choice, and your calorie estimate. Gender sets your waist-to-hip health line (0.85 women, 0.90 men).' + (lw ? ' Leave weight blank to use your weigh-ins; FitHit always uses whichever weight is newer.' : '') + '</p>';
  h += '<p class="fine">Pain areas and body details stay private in your account, like your targets. Export and Delete in Targets & settings include them.</p>';
  return h + '<div class="ab-b">' + (first ? (recheck ? '' : '<button class="clr" data-act="trnone"' + (ui.savingSettings ? ' disabled' : '') + '>No trouble</button>') : '<button class="clr" data-act="about">Cancel</button>') + '<button class="save" data-act="saveabout"' + (ui.savingSettings ? ' disabled' : '') + '>' + (ui.savingSettings ? 'Saving\u2026' : first ? 'Build my routine' : 'Save') + '</button></div></div>';
}
function aboutSummary() {
  const st = S.settings, b = bodyNow(), tr = st.troubles || [], parts = [];
  if (st.heightCm) parts.push(st.heightCm + ' cm'); if (b.kg) parts.push(fmt(b.kg, 1) + ' kg' + (b.fromWeigh ? ' (weigh-in ' + shortDate(b.fromWeigh) + ')' : ''));
  if (b.bmi) parts.push('BMI ' + fmt(b.bmi.v, 1)); if (st.sex) parts.push(SEX_LABEL[st.sex]);
  return '<div class="absum"><span class="grow"><span class="cue">' + (parts.length ? esc(parts.join(' \u00b7 ')) : 'Add height and weight for your BMI and calorie estimate.') + '</span>' +
    '<span class="cue">' + (tr.length ? 'Pain today: <b class="vt">' + esc(tr.map(t => TROUBLE_LABEL[t] + ((st.troubleSharp || []).includes(t) ? ' (sharp)' : '')).join(', ')) + '</b>' : 'No pain today') + '</span></span><button class="lnk" data-act="about">Change</button></div>';
}
function bmiLine(bmi) {
  if (!bmi) return '';
  const words = { under: 'under 18.5 (underweight)', normal: 'in the healthy range', over: 'overweight on the Indian guideline (23\u201324.9)', obese: bmi.v >= 30 ? 'in the obesity range (WHO and Indian guidelines)' : 'in the obesity range on the Indian guideline (25+); WHO calls it overweight' };
  return '<p class="fine">BMI ' + fmt(bmi.v, 1) + ': ' + words[bmi.band] + '. BMI doesn\u2019t see muscle, so your waist and InBody numbers matter more.</p>';
}
function changesBlock(r) {
  if (!r.changes.length && !Object.keys(r.cues).length && !r.notes.length) return '';
  const nm = id => esc(BY_ID[id].name);
  let h = '<div class="adj"><div class="kick">Adjusted for you</div><ul>';
  const restedN = r.changes.filter(c => c.sharp).length;
  r.changes.filter(c => !c.sharp || restedN <= 3).forEach(c => { const area = esc(TROUBLE_LABEL[c.area].toLowerCase());
    h += '<li>' + (c.sharp ? '<b>Rest ' + nm(c.from) + '</b>: ' + esc(c.why) + '.' : c.to && !c.dup ? '<b>' + nm(c.from) + '</b> \u2192 <b class="vt">' + nm(c.to) + '</b>. Skipped for your ' + area + ': ' + esc(c.why) + '.'
      : '<b>Skip ' + nm(c.from) + '</b> for your ' + area + ': ' + esc(c.why) + '.' + (c.to ? ' ' + nm(c.to) + ' is already in your plan.' : '')) + '</li>'; });
  if (restedN > 3) h += '<li><b>' + plural(restedN, 'exercise') + ' rested</b> for sharp pain today.</li>';
  const modded = Object.keys(r.cues).filter(id => !r.changes.some(c => c.to === id));
  if (modded.length) h += '<li>' + plural(modded.length, 'move') + ' changed to protect ' + esc((S.settings.troubles || []).map(t => TROUBLE_LABEL[t].toLowerCase()).join(' and ')) + ': see the cue under each one.</li>';
  r.notes.forEach(x => { h += '<li>' + esc(x) + '</li>'; });
  return h + '</ul><p class="fine">If anything hurts sharply, stop that move. For pain that keeps coming back, see a physiotherapist. ' + esc(RED_FLAGS) + '</p></div>';
}
/* ---------- (a, b) plan the session to the time you have ---------- */
function planCard(P, plan) {
  const p = P.p, isToday = ui.selected === today(), mood = P.mood, M = mood ? MOOD_BY[mood] : null, r = P.routine, src = r ? r.session : p;
  let h = '<section class="pad"><div class="card plan"><div class="kick v">' + svg(I.clock, 14) + (isToday ? ' Plan today' : ' Plan your time') + '</div>';
  if (isToday) {
    h += '<p class="cue" style="margin-top:6px">How do you feel today?</p><div class="chips" role="radiogroup" aria-label="How you feel today">' + MOODS.map(m => '<button role="radio" aria-checked="' + (mood === m.id) + '" data-mood="' + m.id + '">' + esc(m.label) + '</button>').join('') + '</div>';
    if (M) h += '<p class="cue" style="margin-top:8px">' + esc(M.note) + (p.rest && mood === 'heavy' ? ' It\u2019s your rest day, so Light or Only cardio is the kinder choice.' : '') + '</p>';
  }
  h += '<p class="cue" style="margin-top:14px">How long can you stay?</p><div class="chips" role="radiogroup" aria-label="Minutes at the gym today">' + MIN_CHOICES.map(n => '<button role="radio" aria-checked="' + (ui.mins === n) + '" data-mins="' + n + '">' + MIN_LABEL[n] + '</button>').join('') + '</div>';
  if (mood && !painCheckedToday()) return h + aboutForm(true) + '</div></section>';
  if (mood) h += ui.aboutOpen ? aboutForm(false) : aboutSummary();
  if (r) h += changesBlock(r) + bmiLine(bodyNow().bmi);
  if (!plan) return h + (mood && !ui.mins ? '' : '') + '</div></section>';
  if (mood && !ui.mins) h += '<p class="msg">Planned for 1 hour. Pick your time above to change it.</p>';
  const row = (t, n, title, sub, cls) => '<li class="tl' + (cls ? ' ' + cls : '') + '"><span class="tl-t num">' + clock(t) + '</span><span class="grow"><b>' + (n ? '<span class="tl-n num">' + n + '</span>' : '') + esc(title) + '</b><span class="cue">' + sub + '</span></span></li>';
  h += '<ol class="tlist">' + row(0, '', 'Warm-up \u00b7 ' + plan.warm + ' min', 'Easy pace on a bike or the cross trainer. Gets blood to the muscles and loosens the joints.');
  let lastRank = 0;
  const cardioSub = () => esc(plan.cardio.ids.map(id => BY_ID[id].name).join(' or ')) + (mood === 'cardio' ? '. Split the time between them if you like. Moderate pace: you can talk, but not sing.' : mood === 'light' ? '. Easy pace: you can talk in full sentences.' : src.cardioFocus ? '. ' + esc((p.cues && p.cues[plan.cardio.ids[0]]) || '') : '. After weights, so you lift with full energy.');
  const cardioRow = () => plan.cardio ? row(plan.cardio.start, '', 'Cardio \u00b7 ' + plan.cardio.dur + ' min', cardioSub()) : '';
  if (src.cardioFocus) h += cardioRow();
  plan.steps.forEach((s, i) => { const m = BY_ID[s.id], why = s.rank !== lastRank && !src.cardioFocus ? ' \u00b7 ' + RANK_WHY[s.rank] : ''; lastRank = s.rank;
    const sets = m.g === 'core' ? '2\u20133 rounds' : M ? M.sets + ' sets \u00d7 ' + M.reps + ', ' + M.rest + ' rest' : PROGRESSION.sets + ' sets \u00d7 ' + PROGRESSION.repBottom + '\u2013' + PROGRESSION.repTop + ', 60 s rest';
    const sug = m.load === true ? suggestLoad(lastLoad(S.entries, s.id, ui.selected), mood) : null;
    const warmSet = mood === 'heavy' && i === 0 && m.load === true ? ' \u00b7 Start with 1 warm-up set: about half the weight, 10 easy reps' : '';
    const pain = r && r.cues[s.id] ? ' \u00b7 <span class="vt">' + esc(r.cues[s.id]) + '</span>' : '';
    h += row(s.start, pad(i + 1), m.name + ' \u00b7 ' + s.dur + ' min', esc(sets) + (sug ? ' \u00b7 ' + (mood === 'light' ? 'light: ' : 'today: ') + fmt(sug.kg, 1) + ' kg' : '') + pain + esc(warmSet + why)); });
  if (!src.cardioFocus) h += cardioRow();
  h += row(plan.coolStart, '', 'Stretch \u00b7 ' + plan.cool + ' min', 'Chest, upper back, calves and hamstrings, 20\u201330 s each. See Guide.') + '</ol>';
  if (plan.skipped.length) h += '<p class="msg">Left out to fit ' + plan.mins + ' min: ' + esc(plan.skipped.map(id => BY_ID[id].name).join(', ')) + '. Do them first next time, or on a longer day.</p>';
  if (plan.spare >= 10) h += '<p class="msg">' + plan.spare + ' min spare. Add the <button class="lnk" data-tab="guide">endurance circuit</button> (about 17 min) or stretch longer.</p>';
  if (mood) { const b = bodyNow(), kc = estimateKcal(plan, mood, b.kg);
    h += kc ? '<p class="msg">About <b class="vt">' + fmt(kc) + ' kcal</b> for this plan at ' + fmt(b.kg, 1) + ' kg. An estimate from standard activity values (2024 Compendium of Physical Activities); your machine screens may differ.</p>' : '<p class="msg">Add your weight under About you to see a calorie estimate.</p>'; }
  return h + '</div></section>';
}
function customExercises(d) {
  const names = [...new Set(Object.values(S.entries).flatMap(e => (e && e.cx ? e.cx.map(x => x.n) : [])))].slice(0, 30), f = ui.cx;
  let h = '<section class="sec"><div class="sec-h"><h2>Your own exercise</h2><span class="cap">Anything not on the lists</span></div>';
  if (d.cx.length) h += '<div class="list" style="margin-bottom:12px">' + d.cx.map((x, i) => '<div class="row on"><div class="fr"><span class="grow"><span class="nm"><b>' + esc(x.n) + '</b></span><span class="cue">' +
    esc([x.kg != null && x.kg !== '' ? x.kg + ' kg' : '', x.reps ? x.reps + ' reps' : '', x.min ? x.min + ' min' : '', x.kcal ? x.kcal + ' kcal' : ''].filter(Boolean).join(' \u00b7 ') || 'Done') +
    '</span></span><button class="ib" data-cxdel="' + i + '" aria-label="Remove ' + esc(x.n) + '">' + svg(I.x, 18) + '</button></div></div>').join('') + '</div>';
  const n = (k, label, unit, max, step) => '<label class="bf"><span>' + label + '</span><span class="bfi"><input class="inp v sm num" type="number" inputmode="decimal" min="0" max="' + max + '" step="' + step + '" placeholder="\u2013" data-cx="' + k + '" value="' + val(f[k]) + '"><span class="unit">' + unit + '</span></span></label>';
  h += '<div class="card cal"><label class="field" style="margin-top:0"><span>Exercise name</span><input class="email" type="text" maxlength="40" list="cx-names" placeholder="For example: Kettlebell swing" data-cx="n" value="' + val(f.n) + '"></label>' +
    '<datalist id="cx-names">' + names.map(x => '<option value="' + esc(x) + '">').join('') + '</datalist>' +
    '<div class="bgrid">' + n('kg', 'Weight', 'kg', 400, 0.5) + n('reps', 'Reps', 'reps', 200, 1) + n('min', 'Time', 'min', 300, 1) + n('kcal', 'Calories', 'kcal', 3000, 1) + '</div>' +
    '<p class="fine">Fill in only what applies. Name is enough to count it.</p><button class="save full" data-act="cxadd"' + (String(f.n || '').trim() ? '' : ' disabled') + '>Add exercise</button></div></section>';
  return h;
}
function kneeBlock(d) {
  const opts = [[0, 'Fine'], [1, 'Some discomfort'], [2, 'Had to stop']];
  return '<div class="card knee"><div class="kick">Knee today</div><div class="seg" role="radiogroup" aria-label="How was your knee today">' +
    opts.map(o => '<button role="radio" aria-checked="' + (d.knee === o[0]) + '" data-knee="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>' +
    (d.knee > 0 ? '<p class="cue" style="margin-top:10px">' + PAIN_RULE + (d.knee === 2 ? ' Two stops in two weeks is a good reason to see a physiotherapist.' : '') + '</p>' : '') + '</div>';
}
export function logView(D) {
  const d = draftFor(ui.selected), dow = parseKey(ui.selected).getDay(), P = programmeFor(ui.selected), p = P.p, ids = P.ids, r = P.routine;
  const src = r ? r.session : p, plan = buildPlan(src, ui.mins || (r ? 60 : null));
  // (b) always in a sensible order: big moves, smaller, arms, core, then cardio. With a time plan, planned items first.
  const rank = id => BY_ID[id].g === 'cardio' ? 9 : (RANK[id] || 5);
  let ordered = ids.map((id, i) => ({ id, i })).sort((a, b) => rank(a.id) - rank(b.id) || a.i - b.i).map(x => x.id);
  if (plan) { const lifts = plan.steps.map(s => s.id), cardio = plan.cardio ? plan.cardio.ids : [], first = src.cardioFocus ? cardio.concat(lifts) : lifts.concat(cardio); ordered = first.concat(ordered.filter(id => !first.includes(id))); }
  else if (src.cardioFocus) ordered = ordered.filter(id => BY_ID[id].g === 'cardio').concat(ordered.filter(id => BY_ID[id].g !== 'cardio'));
  const items = ordered.map((id, i) => ({ m: BY_ID[id], cue: (plan && plan.skipped.includes(id) ? 'Left out today to fit your time. ' : '') + ((r && r.cues[id]) || (!r && p.cues && p.cues[id]) || CUES[id] || ''), num: pad(i + 1) }));
  const isOn = m => m.g === 'cardio' ? has(d.cardio, m.id) : d.machines.includes(m.id);
  const done = items.filter(x => isOn(x.m)).length;
  const extra = d.machines.some(id => !ids.includes(id)) || Object.keys(d.cardio).some(id => !ids.includes(id));
  const open = ui.othersOpen !== null ? ui.othersOpen : (!ids.length || extra);
  const gymOn = isGymDay(d);
  let h = '<section class="card sess"><div class="kick">' + DAYNAMES[dow] + (r ? ' \u00b7 Today\u2019s routine' : p.rest ? ' \u00b7 Recovery' : ' \u00b7 Session') + '</div><h1>' + esc(r ? MOOD_BY[r.mood].label + (r.mood !== 'cardio' && !p.rest && p.focus !== 'full' ? ': ' + p.title : '') : p.title) + '</h1>';
  if (r && r.mood !== 'cardio') { const M = MOOD_BY[r.mood]; h += '<div class="rx tight"><div><b class="num">' + M.sets + '</b><span>Sets</span></div><div><b class="num">' + M.reps + '</b><span>Reps</span></div><div><b class="num">' + M.rest.replace(' s', '') + '</b><span>Rest (s)</span></div><div><b class="num">' + r.session.cardio + '</b><span>Cardio min</span></div></div>'; }
  else if (p.rx && !r) h += '<div class="rx">' + p.rx.map(r => '<div><b class="num' + (String(r.value).length >= 5 ? ' long' : '') + '">' + r.value + '</b><span>' + r.label + '</span></div>').join('') + '</div>';
  h += '<p class="note">' + esc(r ? 'Built from how you feel, your pain areas and your body. Your usual ' + p.title.toLowerCase() + ' plan returns when you clear the mood.' : p.note) + '</p>';
  if (ids.length) h += '<div class="prog"><div class="prog-h"><span class="kick">Session progress</span><span class="big num" aria-label="' + done + ' of ' + items.length + ' done"><span class="v">' + done + '</span>/' + items.length + '</span></div><div class="segs" aria-hidden="true">' +
    items.map(x => '<span' + (isOn(x.m) ? ' class="on"' : '') + '></span>').join('') + '</div></div>';
  h += '</section><div class="pad"><button class="gym' + (gymOn ? ' on' : '') + '" data-act="gym" aria-pressed="' + gymOn + '"><span style="color:var(--volt);display:grid">' + svg(I.dumbbell, 22) + '</span>' +
    '<span class="grow"><span class="gym-t">Went to the gym</span><span class="sub">' + (gymOn ? 'Counts toward your week' : 'Tick even if you only did a few machines') + '</span></span>' + (gymOn ? CHECK : BOX) + '</button>' + (gymOn ? kneeBlock(d) : '') + '</div>';
  if ((!p.rest && ids.length) || ui.selected === D.TODAY) h += planCard(P, plan);
  if (ids.length) h += '<section class="sec"><div class="sec-h"><h2>Programme</h2><span class="cap">Tap to tick off, then log the weight</span></div><p class="cue" style="margin:-6px 0 14px">' + (src.cardioFocus ? 'Cardio first, then core on the mat.' : 'In this order: big moves \u2192 smaller muscles \u2192 arms \u2192 core \u2192 cardio.') + ' Tap <b>How to do it</b> on any exercise.</p><div class="list">' + items.map(x => itemRow(x.m, x.cue, x.num, d)).join('') + '</div></section>';
  const groups = GROUPS.map(g => ({ g, items: MACHINES.filter(m => m.g === g.id && !ids.includes(m.id)) })).filter(x => x.items.length);
  const total = groups.reduce((a, x) => a + x.items.length, 0);
  h += '<section class="pad" style="margin-top:32px"><button class="disc" data-act="others" aria-expanded="' + !!open + '"><span class="t">' + (ids.length ? 'Other exercises' : 'All exercises') + '</span><span class="cap">' + total + ' available</span><span class="chev">' + svg(I.down, 18) + '</span></button>';
  if (open) h += groups.map(x => '<div class="grp"><div class="kick v">' + x.g.label + '</div>' + (x.g.hint ? '<div class="cap" style="margin-top:2px">' + x.g.hint + '</div>' : '') +
    '<div class="list">' + x.items.map(m => itemRow(m, CUES[m.id] || '', '', d)).join('') + '</div></div>').join('');
  return h + '</section>' + customExercises(d);
}
export function mealsSummary(d) {
  const t = dayTotals(d, { live: true }), goal = proteinGoal(), left = goal - t.p, kt = S.settings.kcalTarget;
  const veg = Number(d.veg) || 0, vg = S.settings.vegGoal;
  return '<div class="kick">Today</div><div class="ph-r"><div class="arcw">' + arcSvg(t.p / goal, 132, 12) +
    '<div class="ringc"><div class="ringn num">' + fmtG(t.p) + '</div><div class="ringl">of ' + goal + ' g protein</div></div></div>' +
    '<div class="grow" aria-live="polite"><div class="ph-s' + (left <= 0 ? ' v' : '') + '">' + (left <= 0 ? 'Protein goal reached' : fmtG(left) + ' g protein to go') + '</div>' +
    '<p class="ph-c num"><b class="' + (kt && t.k > kt ? 'warn' : '') + '">' + fmt(t.k) + ' kcal</b>' + (kt ? ' of ' + fmt(kt) + (t.k > kt ? ' \u00b7 ' + fmt(t.k - kt) + ' over' : ' \u00b7 ' + fmt(kt - t.k) + ' left') : ' \u00b7 <button class="lnk" data-act="opensettings">set a calorie target</button>') + '</p></div></div>' +
    '<div class="vegr"><span class="grow"><b>Vegetables & fruit</b><span class="cue">Servings today, aim for ' + vg + '. One serving \u2248 1 katori sabzi or 1 fruit.</span></span>' +
    '<span class="step"><button data-veg="-1" aria-label="Remove a vegetable or fruit serving"' + (veg ? '' : ' disabled') + '>' + svg(I.minus, 18, 2.5) + '</button><b class="num' + (veg >= vg ? ' hit' : '') + '">' + veg + '</b><button class="plus" data-veg="1" aria-label="Add a vegetable or fruit serving (now ' + veg + ')">' + svg(I.plus, 18, 2.5) + '</button></span></div>';
}
export function mealTiles(d) {
  return MEALS.map(m => { const t = mealTotals(d, m.id), tg = mealTarget(m.id);
    return '<button data-meal="' + m.id + '" aria-pressed="' + (ui.meal === m.id) + '" aria-label="' + m.label + ': ' + fmtG(t.p) + ' of ' + tg + ' grams protein"><span class="l">' + m.label + '</span><span class="g num">' + fmtG(t.p) + '<small>/' + tg + '</small></span><span class="tr"><i style="width:' + Math.min(100, Math.round(t.p / tg * 100)) + '%"></i></span></button>'; }).join('');
}
function foodRow(f, d) {
  const c = Number(d.meals[ui.meal][f.id]) || 0;
  return '<div class="row' + (c ? ' on' : '') + '"><div class="fr"><span class="grow"><span class="nm"><b>' + esc(f.name) + '</b></span>' +
    '<span class="cue">' + esc(f.serve) + ' \u00b7 ' + fmtG(f.p) + ' g protein \u00b7 ' + f.k + ' kcal' + (c ? ' \u00b7 <span class="vt">+' + fmtG(c * f.p) + ' g</span>' : '') + '</span>' +
    (f.cue ? '<span class="cue">' + esc(f.cue) + '</span>' : '') + '</span>' +
    '<span class="step"><button data-dec="' + f.id + '" aria-label="Remove a serving of ' + esc(f.name) + '"' + (c ? '' : ' disabled') + '>' + svg(I.minus, 18, 2.5) + '</button>' +
    '<b class="num" aria-hidden="true">' + c + '</b><button class="plus" data-inc="' + f.id + '" aria-label="Add a serving of ' + esc(f.name) + ' (now ' + c + ')">' + svg(I.plus, 18, 2.5) + '</button></span></div></div>';
}
/* ---------- (f, g) weigh it, count it, or add your own food ---------- */
export function calcFoods() {
  const built = FOODS.map(f => ({ key: 'b:' + f.id, name: f.name, ...foodMeasure(f) }));
  const mine = (S.settings.myFoods || []).map((f, i) => ({ key: 'm:' + i, name: f.n, u: f.u, p: f.p, k: f.k, mine: true }));
  return { built, mine, all: built.concat(mine) };
}
const unitWord = (u, q) => u === 'g' ? 'g' : (Number(q) === 1 ? u : u + (/(s|ch)$/.test(u) ? 'es' : 's'));
export function calcResult() {
  const c = ui.calc, F = calcFoods();
  if (c.food === 'new') { const q = Number(c.qty), per = { p: Number(c.p), k: Number(c.k) || 0 };
    if (!String(c.n || '').trim() || !(per.p >= 0) || c.p === '' || !(q > 0)) return { ok: false, text: 'Fill in the name, protein per ' + (c.u || 'serving') + ' and how many you had.' };
    const t = amountTotals(per, q); return { ok: true, t, text: q + ' ' + unitWord(c.u || 'serving', q) + ' of ' + c.n + ' = <b>' + fmtG(t.p) + ' g protein</b> \u00b7 ' + fmt(t.k) + ' kcal' }; }
  const f = F.all.find(x => x.key === c.food); if (!f) return { ok: false, text: '' };
  const q = Number(c.qty); if (!(q > 0)) return { ok: false, text: f.u === 'g' ? 'Type how many grams. Example: 120 g ' + f.name.toLowerCase() + ' = ' + fmtG(amountTotals(f, 120).p) + ' g protein.' : 'Type how many. Example: 2 ' + unitWord(f.u, 2) + ' = ' + fmtG(amountTotals(f, 2).p) + ' g protein.' };
  const t = amountTotals(f, q); return { ok: true, t, f, text: q + ' ' + unitWord(f.u, q) + ' ' + esc(f.name.toLowerCase()) + ' = <b>' + fmtG(t.p) + ' g protein</b> \u00b7 ' + fmt(t.k) + ' kcal' };
}
function foodCalc(d, meal) {
  const c = ui.calc, F = calcFoods(), list = d.cf[ui.meal] || [], sel = F.all.find(x => x.key === c.food), isNew = c.food === 'new';
  const opt = x => '<option value="' + x.key + '"' + (x.key === c.food ? ' selected' : '') + '>' + esc(x.name) + ' (per ' + (x.u === 'g' ? 'gram' : esc(x.u)) + ')</option>';
  let h = '<div class="grp"><div class="kick v">Weigh it, count it, or add your own</div><div class="cap" style="margin-top:2px">FitHit works out the protein. Example: 2 scoops of whey, or 120 g paneer.</div>';
  if (list.length) h += '<div class="list">' + list.map((x, i) => { const t = amountTotals(x, x.q);
    return '<div class="row on"><div class="fr"><span class="grow"><span class="nm"><b>' + esc(x.n) + '</b></span><span class="cue">' + fmtG(t.p) + ' g protein \u00b7 ' + fmt(t.k) + ' kcal</span></span>' +
      '<label class="lf"><span class="sr">Amount of ' + esc(x.n) + '</span><input class="inp v sm num" type="number" inputmode="decimal" min="0.1" max="2000" step="any" data-cfq="' + i + '" value="' + val(x.q) + '"></label><span class="unit">' + esc(unitWord(x.u, x.q)) + '</span>' +
      '<button class="ib" data-cfdel="' + i + '" aria-label="Remove ' + esc(x.n) + '">' + svg(I.x, 18) + '</button></div></div>'; }).join('') + '</div>';
  h += '<div class="card cal" style="margin-top:12px"><label class="bf"><span>Food</span><select class="inp v sel" data-calc="food">' +
    '<optgroup label="FitHit foods">' + F.built.map(opt).join('') + '</optgroup>' + (F.mine.length ? '<optgroup label="My foods">' + F.mine.map(opt).join('') + '</optgroup>' : '') +
    '<option value="new"' + (isNew ? ' selected' : '') + '>+ A new food from its label\u2026</option></select></label>';
  if (isNew) {
    const t = (k, label, ph, max) => '<label class="bf"><span>' + label + '</span><input class="email" type="text" maxlength="' + max + '" placeholder="' + ph + '" data-calc="' + k + '" value="' + val(c[k]) + '"></label>';
    const n = (k, label, unit) => '<label class="bf"><span>' + label + '</span><span class="bfi"><input class="inp v sm num" type="number" inputmode="decimal" min="0" max="2000" step="any" placeholder="\u2013" data-calc="' + k + '" value="' + val(c[k]) + '"><span class="unit">' + unit + '</span></span></label>';
    h += '<div class="bgrid">' + t('n', 'Name', 'My whey', 40) + t('u', 'One serving is a\u2026', 'scoop', 16) + n('p', 'Protein per ' + esc(c.u || 'serving'), 'g') + n('k', 'Calories per ' + esc(c.u || 'serving'), 'kcal') + '</div>' +
      '<label class="chk"><input type="checkbox" data-calc="save"' + (c.save ? ' checked' : '') + '> Save to My foods for next time</label>';
  }
  const unit = isNew ? (c.u || 'serving') : sel ? sel.u : 'serving';
  h += '<label class="bf" style="margin-top:12px"><span>' + (unit === 'g' ? 'How many grams' : 'How many ' + esc(unitWord(unit, 2))) + '</span><span class="bfi"><input class="inp v sm num" type="number" inputmode="decimal" min="0.1" max="2000" step="any" placeholder="' + (unit === 'g' ? '120' : '1') + '" data-calc="qty" value="' + val(c.qty) + '"><span class="unit">' + esc(unitWord(unit, 2)) + '</span></span></label>' +
    '<p class="msg" id="calc-res" aria-live="polite">' + calcResult().text + '</p>' +
    '<button class="save full" id="calc-add" data-act="calcadd"' + (calcResult().ok ? '' : ' disabled') + '>Add to ' + meal.label.toLowerCase() + '</button>' +
    (sel && sel.mine ? '<button class="lnk" style="margin-top:12px" data-act="myfooddel">Remove ' + esc(sel.name) + ' from My foods</button>' : '') + '</div></div>';
  return h;
}
export function proteinWeek(D) {
  const selMon = mondayOf(parseKey(ui.selected)), goal = proteinGoal(), top = Math.max(goal * 1.2, 1); let out = '';
  for (let i = 0; i < 7; i++) { const k = keyOf(addDays(selMon, i)), e = k === ui.selected ? draftFor(k) : S.entries[k], g = dayTotals(e, { live: k === ui.selected }).p, fut = k > D.TODAY;
    out += '<div class="pw-c"><div class="pw-g num">' + (g ? fmtG(g) : '') + '</div><div class="pw-b"' + (fut ? ' style="opacity:.35"' : '') + '><em style="bottom:' + (goal / top * 100) + '%"></em><i class="' + (g >= goal ? 'v' : '') + '" style="height:' + Math.min(100, g / top * 100) + '%"></i></div><div class="pw-l' + (k === ui.selected ? ' t' : '') + '">' + DOW[i] + '</div></div>'; }
  return out;
}
export function mealsView(D) {
  const d = draftFor(ui.selected), meal = MEALS.find(m => m.id === ui.meal), yk = keyOf(addDays(parseKey(ui.selected), -1)), y = viewOf(yk);
  const yMeal = y && y.meals && y.meals[ui.meal] && Object.keys(y.meals[ui.meal]).length ? y.meals[ui.meal] : null;
  const curEmpty = !Object.keys(d.meals[ui.meal]).length;
  let h = '<section class="card ph" id="m-sum">' + mealsSummary(d) + '</section><div class="mt" id="m-tiles" role="group" aria-label="Choose a meal">' + mealTiles(d) + '</div>';
  h += '<section class="sec"><div class="sec-h"><h2>' + meal.label + '</h2><span class="cap">About ' + mealTarget(ui.meal) + ' g protein</span></div>';
  if (yMeal && curEmpty) h += '<button class="disc cp" data-act="copymeal">' + svg(I.copy, 18) + '<span class="grow"><span class="t">Same as yesterday</span><span class="cap">' + esc(Object.keys(yMeal).map(f => yMeal[f] + ' \u00d7 ' + FOOD_BY[f].name.toLowerCase()).join(', ')) + '</span></span></button>';
  h += '<div class="kick v" style="margin-top:' + (yMeal && curEmpty ? 22 : 0) + 'px">Protein foods</div><div class="list" style="margin-top:12px">' + FOODS.filter(f => f.grp === 'p').map(f => foodRow(f, d)).join('') + '</div>';
  h += '<div class="grp"><div class="kick v">Everyday staples</div><div class="cap" style="margin-top:2px">Smaller amounts of protein, but they carry most of the calories.</div><div class="list">' + FOODS.filter(f => f.grp === 'e').map(f => foodRow(f, d)).join('') + '</div></div>';
  h += foodCalc(d, meal);
  const ex = d.extra[ui.meal], exk = d.extraK[ui.meal];
  h += '<div class="grp"><div class="kick v">Quick add: just the totals</div><div class="list"><div class="row' + (Number(ex) > 0 || Number(exk) > 0 ? ' on' : '') + '"><div class="kc np" style="padding-top:16px;flex-wrap:wrap">' +
    '<span class="grow" style="color:var(--tx);min-width:100%"><b style="display:block;font-weight:600;font-size:15.5px">From a label or another dish</b><span class="cue">For example, a whey scoop: 24 g protein, 120 kcal</span></span>' +
    '<label class="lf"><span class="sr">Extra protein in grams</span><input class="inp v sm num" type="number" inputmode="decimal" min="0" max="300" placeholder="0" data-extra="' + ui.meal + '" value="' + val(ex) + '"></label><span class="unit">g</span>' +
    '<label class="lf"><span class="sr">Extra calories</span><input class="inp sm num" type="number" inputmode="numeric" min="0" max="3000" placeholder="0" data-extrak="' + ui.meal + '" value="' + val(exk) + '"></label><span class="unit">kcal</span></div></div></div></div></section>';
  h += '<section class="sec"><div class="card cal"><div class="sec-h" style="margin:0"><h2 style="font-size:22px">Protein this week</h2><span class="cap" style="white-space:nowrap">Line: ' + proteinGoal() + ' g</span></div><div class="pw" id="m-week">' + proteinWeek(D) + '</div>' +
    '<p class="fine">Values are estimates for home-cooked portions. Ghee or oil adds about 45 kcal per teaspoon. For anything packaged, add it as a new food from its label.</p></div></section>';
  return h;
}
export function saveBar() {
  const sel = ui.selected, d = draftFor(sel), n = exerciseCount(d), kc = kcalBurned(d), t = dayTotals(d, { live: true }), gymOn = isGymDay(d), dirty = isDirty(sel), saved = !!S.entries[sel], pending = S.pending.has(sel);
  const parts = [];
  if (ui.tab === 'meals') { if (t.p) parts.push(fmtG(t.p) + ' g protein'); if (t.k) parts.push(fmt(t.k) + ' kcal'); }
  else { if (n) parts.push(plural(n, 'exercise')); else if (gymOn) parts.push('Checked in'); if (kc) parts.push(kc + ' kcal'); }
  const showClear = ui.tab === 'meals' ? (servings(d) > 0 || t.p > 0 || t.k > 0 || d.veg) : (n > 0 || gymOn);
  const status = S.saving === sel ? 'Saving\u2026' : pending ? 'Waiting for connection' : dirty ? 'Unsaved changes' : saved ? 'Saved' : 'Not logged';
  return '<div class="grow"><div class="s num">' + (parts.length ? parts.join(' \u00b7 ') : (ui.tab === 'meals' ? 'No food added yet' : 'Nothing ticked yet')) + '</div><div class="st' + (dirty ? ' v' : '') + '" role="status">' + status + '</div></div>' +
    (showClear ? '<button class="clr" data-act="clear" aria-label="' + (ui.tab === 'meals' ? 'Clear meals' : 'Clear workout') + '">Clear</button>' : '') +
    '<button class="save" data-act="save"' + ((S.saving || !dirty) ? ' disabled' : '') + '>Save day</button>';
}

function sparkline(list, target) {
  const pts = list.filter(c => c.weight != null).slice(-12); if (pts.length < 2) return '';
  const vals = pts.map(p => p.weight).concat(target ? [target] : []), lo = Math.min(...vals) - 0.5, hi = Math.max(...vals) + 0.5, W = 300, H = 80;
  const x = i => 8 + i * (W - 16) / (pts.length - 1), y = v => H - 6 - (v - lo) / (hi - lo) * (H - 12);
  return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Weight trend: ' + pts.map(p => fmt(p.weight, 1) + ' kg on ' + shortDate(p.key)).join(', ') + '">' +
    (target ? '<line x1="0" x2="' + W + '" y1="' + y(target) + '" y2="' + y(target) + '" stroke="var(--mu)" stroke-dasharray="4 4"/>' : '') +
    '<polyline fill="none" stroke="var(--volt)" stroke-width="2.5" points="' + pts.map((p, i) => x(i) + ',' + y(p.weight)).join(' ') + '"/>' +
    pts.map((p, i) => '<circle cx="' + x(i) + '" cy="' + y(p.weight) + '" r="3" fill="var(--volt)"/>').join('') + '</svg>';
}
function bodyCard(D) {
  const list = checkins(S.entries), last = list.length ? list[list.length - 1] : null, st = S.settings;
  const lastW = [...list].reverse().find(c => c.weight != null), firstW = list.find(c => c.weight != null);
  const lastVf = [...list].reverse().find(c => c.vf != null), lastWaist = [...list].reverse().find(c => c.waist != null);
  const start = st.startWeight || (firstW && firstW.weight), pace = weeklyPace(list), d = draftFor(D.TODAY), b = d.body;
  let h = '<section class="sec"><div class="sec-h"><h2>Body</h2><span class="cap">Weigh in weekly, same time of day</span></div><div class="card cal">';
  if (lastW) {
    h += '<div class="bstat"><div><b class="num">' + fmt(lastW.weight, 1) + '</b><span>kg now</span></div>' +
      (start ? '<div><b class="num">' + (lastW.weight - start > 0 ? '+' : '') + fmt(lastW.weight - start, 1) + '</b><span>kg since start</span></div>' : '') +
      (st.targetWeight ? '<div><b class="num">' + fmt(Math.max(0, lastW.weight - st.targetWeight), 1) + '</b><span>kg to target</span></div>' : '') + '</div>';
    h += sparkline(list, st.targetWeight);
    if (pace != null) {
      const fast = pace < -st.maxLossPerWeek, gain = pace > 0.2;
      h += '<p class="msg' + (fast || gain ? ' err' : '') + '">' + (pace < 0 ? 'Losing ' + fmt(-pace, 2) + ' kg a week' : pace > 0 ? 'Gaining ' + fmt(pace, 2) + ' kg a week' : 'Holding steady') + ' over the last 4 weeks. ' +
        (fast ? 'That\u2019s faster than ' + st.maxLossPerWeek + ' kg a week: eat closer to your calorie target and keep protein high so the loss stays fat, not muscle.' : gain ? 'Check your calories on the Meals tab.' : 'Within the safe range of 0.5\u20131 kg a week.') + '</p>';
    } else h += '<p class="msg">Two weigh-ins at least a week apart will show your weekly pace.</p>';
  } else h += '<p class="msg" style="margin-top:0">No weigh-ins yet. Add today\u2019s below to start your trend.</p>';
  const vfLine = lastVf ? 'Visceral fat ' + lastVf.vf + (lastVf.vf <= st.vfGoal ? ' \u00b7 milestone reached' : ' \u00b7 ' + (lastVf.vf - st.vfGoal) + ' to go to ' + st.vfGoal) : 'Visceral fat: add it from your next InBody';
  let retest = 'Set your last InBody date in Settings to get a retest reminder.';
  if (st.lastInbody) { const due = keyOf(addDays(parseKey(st.lastInbody), st.retestWeeks * 7)), left = daysBetween(D.TODAY, due);
    retest = left < 0 ? 'InBody retest overdue by ' + plural(-left, 'day') + '.' : 'Next InBody retest: ' + shortDate(due) + ' (' + plural(left, 'day') + '). Same time of day, before eating.'; }
  const whr = latestWhr(list), whrL = whrLimitFor(st.sex), whrWho = st.sex === 'm' ? 'men' : 'women';
  h += '<p class="msg">' + vfLine + (lastWaist ? ' \u00b7 Waist ' + fmt(lastWaist.waist, 1) + ' cm' : '') + '</p>' + (whr ? '<p class="msg' + (whr.whr >= whrL ? ' err' : '') + '">Waist-to-hip ratio ' + whr.whr.toFixed(2) + (whr.whr >= whrL ? ', at or above the ' + fmt(whrL, 2) + ' health-risk line for ' + whrWho + ' (WHO). Waist coming down is the best sign visceral fat is dropping.' : ', under ' + fmt(whrL, 2) + '. Well done.') + '</p>' : '<p class="msg">Add waist and hip to track your waist-to-hip ratio (health-risk line for ' + whrWho + ': ' + fmt(whrL, 2) + ').</p>') + '<p class="msg' + (retest.includes('overdue') ? ' err' : '') + '">' + retest + '</p>';
  const f = (k, label, unit, step, min, max) => '<label class="bf"><span>' + label + '</span><span class="bfi"><input class="inp v sm num" type="number" inputmode="decimal" step="' + step + '" min="' + min + '" max="' + max + '" placeholder="\u2013" data-body="' + k + '" value="' + val(b[k]) + '"><span class="unit">' + unit + '</span></span></label>';
  h += '<div class="kick" style="margin-top:20px">Today\u2019s check-in</div><div class="bgrid">' + f('weight', 'Weight', 'kg', '0.1', 30, 250) + f('waist', 'Waist', 'cm', '0.5', 40, 200) + f('hip', 'Hip', 'cm', '0.5', 50, 200) + f('bf', 'Body fat', '%', '0.1', 3, 70) + f('vf', 'Visceral fat', 'level', '1', 1, 30) + '</div>' +
    '<p class="fine">Measure waist at the navel and hip at the widest point, relaxed. Body fat and visceral fat come from your InBody report; leave them blank on normal weigh-ins.</p>' +
    '<button class="save full" id="body-save" data-act="savetoday"' + (isDirty(D.TODAY) && !S.saving ? '' : ' disabled') + '>Save check-in</button></div></section>';
  return h;
}
function strengthCard(D) {
  const rows = strengthSummary(S.entries, S.settings.strengthDrop).slice(0, 8);
  let h = '<section class="sec"><div class="sec-h"><h2>Strength</h2><span class="cap">Keeping muscle while losing fat</span></div>';
  if (!rows.length) return h + '<p class="empty">Log kg and reps on any machine to see your progress here.</p></section>';
  const drops = rows.filter(r => r.dropped);
  if (drops.length) h += '<p class="msg err" style="margin:0 0 12px">' + drops.map(r => esc(BY_ID[r.id].name)).join(', ') + (drops.length > 1 ? ' are' : ' is') + ' down 10% or more from your best. Losing strength while dieting can mean losing muscle: check you\u2019re hitting protein, sleeping enough and not eating too far under target.</p>';
  h += '<div class="list">' + rows.map(r => { const diff = r.last.kg - r.first.kg;
    return '<div class="card mu"><div class="mu-h"><b>' + esc(BY_ID[r.id].name) + '</b><span class="mu-r num">' + fmt(r.last.kg, 1) + ' kg \u00d7 ' + (r.last.reps || '?') + (r.dropped ? '<span class="due">Down</span>' : '') + '</span></div><div class="cue">' +
      (r.count > 1 ? (diff > 0 ? '+' + fmt(diff, 1) + ' kg' : diff < 0 ? fmt(diff, 1) + ' kg' : 'Same weight') + ' since ' + shortDate(r.first.key) + ' \u00b7 ' : '') + 'Best ' + fmt(r.best.kg, 1) + ' kg \u00b7 Last ' + shortDate(r.last.key) + '</div></div>'; }).join('');
  return h + '</div></section>';
}
function kneeSummary(D) {
  const from = keyOf(addDays(new Date(), -13)); let mild = 0, stop = 0;
  Object.keys(S.entries).forEach(k => { if (k < from || k > D.TODAY) return; const v = S.entries[k].knee; if (v === 1) mild++; if (v === 2) stop++; });
  if (!mild && !stop) return '';
  return '<p class="msg' + (stop >= 2 ? ' err' : '') + '">Knee, last 2 weeks: ' + plural(mild, 'day') + ' with discomfort, ' + plural(stop, 'day') + ' you had to stop.' + (stop >= 2 ? ' Please book a physiotherapist before pushing the leg sessions harder.' : '') + '</p>';
}
function settingsCard() {
  const s = ui.sd || S.settings, open = ui.settingsOpen;
  let h = '<section class="sec" id="settings"><button class="disc" data-act="togglesettings" aria-expanded="' + open + '"><span class="t">Targets & settings</span><span class="chev">' + svg(I.down, 18) + '</span></button>';
  if (!open) return h + '</section>';
  const n = (k, label, unit, step, min, max) => '<label class="bf"><span>' + label + '</span><span class="bfi"><input class="inp v sm num" type="number" inputmode="decimal" step="' + step + '" min="' + min + '" max="' + max + '" data-set="' + k + '" value="' + val(s[k]) + '"><span class="unit">' + unit + '</span></span></label>';
  h += '<div class="card cal" style="margin-top:12px"><div class="bgrid">' + n('proteinGoal', 'Protein goal', 'g/day', '1', 40, 200) + n('kcalTarget', 'Calorie target', 'kcal', '10', 1000, 4000) +
    n('startWeight', 'Start weight', 'kg', '0.1', 30, 250) + n('targetWeight', 'Target weight', 'kg', '0.1', 30, 250) + n('vfGoal', 'Visceral fat goal', 'level', '1', 1, 20) + n('sessionsGoal', 'Sessions goal', 'per week', '1', 1, 7) + '</div>' +
    '<label class="bf" style="margin-top:12px"><span>Weekday rest day</span><select class="inp v sel" data-set="restDow">' + [1, 2, 3, 4, 5].map(d => '<option value="' + d + '"' + (Number(s.restDow) === d ? ' selected' : '') + '>' + DAYNAMES[d] + '</option>').join('') + '</select></label>' +
    '<label class="bf" style="margin-top:12px"><span>Last InBody test</span><input class="inp v sel" type="date" data-set="lastInbody" value="' + val(s.lastInbody) + '" max="' + today() + '"></label>' +
    '<p class="fine">These stay private in your account, not in the app\u2019s code.</p><button class="save full" data-act="savesettings">Save settings</button></div>';
  h += '<div class="card acct"><span class="cap">Download everything FitHit has stored for you</span><button class="clr" data-act="export">Export</button></div>' +
    '<div class="card acct"><span class="cap">Delete all your FitHit days and settings</span><button class="clr danger" data-act="deleteall">Delete</button></div>';
  return h + '</section>';
}
export function progressView(D) {
  const E = D.E, lastT = {};
  Object.keys(E).forEach(k => { const e = E[k]; if (k > D.TODAY || !e) return;
    (e.machines || []).forEach(id => ((BY_ID[id] && BY_ID[id].m) || []).forEach(mu => { if (!lastT[mu] || k > lastT[mu]) lastT[mu] = k; }));
    if (e.cardio && Object.keys(e.cardio).length && (!lastT.Cardio || k > lastT.Cardio)) lastT.Cardio = k; });
  let h = '<section style="padding:12px 22px 0"><div class="card wk"><div class="kick" style="align-self:flex-start">This week</div><div class="ringw">' + ringSvg(D.week, { size: 210, width: 18, missWidth: 8, gap: 6 }) +
    '<div class="ringc"><div class="ringn num">' + D.weekHits + '</div><div class="ringl">of ' + S.settings.sessionsGoal + ' sessions</div></div></div><div class="dl" aria-label="Days trained this week">' +
    D.week.map(w => '<span class="' + (w.hit ? 'h' : w.today ? 't' : '') + '">' + w.letter + '</span>').join('') + '</div></div>';
  const stats = [[D.weekKcal.toLocaleString('en-GB'), 'Cardio kcal this week'], [D.proteinDays + '/' + D.elapsed, 'Protein goal days'], [D.last ? ago(daysBetween(D.last, D.TODAY)) : 'None', 'Last gym visit']];
  const moods = {}; D.week.forEach(w => { const e = E[w.key]; if (e && e.mood && isGymDay(e)) moods[e.mood] = (moods[e.mood] || 0) + 1; });
  const moodLine = MOODS.filter(m => moods[m.id]).map(m => moods[m.id] + ' ' + m.label.toLowerCase()).join(', ');
  h += '<div class="stats">' + stats.map(s => '<div class="card"><b class="num">' + s[0] + '</b><span>' + s[1] + '</span></div>').join('') + '</div>' + (moodLine ? '<p class="msg">Routines this week: ' + esc(moodLine) + '.</p>' : '<p class="msg">Pick how you feel on the Log tab and FitHit builds today\u2019s routine; it shows up here once you save the day.</p>') + kneeSummary(D) + '</section>';
  h += bodyCard(D) + strengthCard(D);
  h += '<section class="sec"><div class="sec-h"><h2>Last trained</h2><span class="cap">Due after 7 days</span></div><div class="list">' +
    MUSCLES.map(mu => { const dn = lastT[mu] ? daysBetween(lastT[mu], D.TODAY) : null, due = dn === null || dn >= 7, f = dn === null ? 0 : Math.max(0, 1 - dn / 7);
      return '<div class="card mu"><div class="mu-h"><b>' + mu + '</b><span class="mu-r">' + (dn === null ? 'Not logged' : ago(dn)) + (due ? '<span class="due">Due</span>' : '') + '</span></div><div class="track" aria-hidden="true"><i style="width:' + Math.round(f * 100) + '%"></i></div></div>'; }).join('') + '</div></section>';
  h += settingsCard();
  h += '<section class="sec"><div class="card acct"><span class="cap">Signed in as ' + esc(auth.user ? auth.user.email : '') + '</span><button class="clr" data-act="signout">Sign out</button></div></section>';
  return h;
}
export function calendarView(D) {
  const start = addDays(D.mon, -28), E = D.E, fm = dd => dd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  let cells = ''; for (let j = 0; j < 35; j++) { const dd = addDays(start, j), k = keyOf(dd), fut = k > D.TODAY, hit = isGymDay(E[k]), pg = dayTotals(E[k]).p >= proteinGoal();
    cells += '<button class="cc num' + (hit ? ' h' : '') + (k === D.TODAY ? ' t' : '') + (k === ui.selected ? ' s' : '') + '" data-day="' + k + '"' + (fut ? ' disabled' : '') + ' aria-label="' + dd.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) + (hit ? ', gym day' : '') + (pg ? ', protein goal met' : '') + '">' + dd.getDate() + (pg ? '<i></i>' : '') + '</button>'; }
  let h = '<section style="padding:12px 22px 0"><div class="card cal"><div class="sec-h" style="margin:0"><h2>Last 5 weeks</h2><span class="cap">' + fm(start) + ' \u2013 ' + fm(addDays(start, 34)) + '</span></div>' +
    '<div class="cg">' + DOW.map(x => '<div class="w" aria-hidden="true">' + x + '</div>').join('') + cells + '</div>' +
    '<div class="leg"><span><span class="sq" style="background:var(--volt)"></span>Gym day</span><span><span class="sq" style="border:1.5px solid var(--tx)"></span>Today</span><span><span class="sq" style="width:7px;height:7px;border-radius:50%;background:var(--ember)"></span>Protein goal met</span><span>Tap a day to edit it</span></div></div></section>';
  const recent = Object.keys(E).filter(k => k <= D.TODAY && isGymDay(E[k])).sort().reverse().slice(0, 6);
  h += '<section class="sec"><h2 class="h2" style="margin-bottom:10px">Recent sessions</h2>' + (recent.length ? '' : '<p class="empty">No sessions logged yet. Tick today\u2019s machines on the Log tab and tap Save day.</p>') + '<div class="list">' +
    recent.map(k => { const e = E[k], cc = exerciseCount(e), kk = kcalBurned(e), dd = parseKey(k), pp = planFor(dd.getDay(), S.settings.restDow);
      return '<button class="rs" data-day="' + k + '"><span class="rs-d"><b>' + dd.getDate() + '</b><span>' + dd.toLocaleDateString('en-GB', { weekday: 'short' }) + '</span></span><span class="grow"><b style="display:block;font-weight:600;font-size:15px">' + (pp.rest ? 'Extra session' : esc(pp.title)) + '</b><span class="cap">' + (cc ? plural(cc, 'exercise') : 'Checked in') + (kk ? ' \u00b7 ' + kk + ' kcal' : '') + (e.knee ? ' \u00b7 knee: ' + (e.knee === 2 ? 'stopped' : 'discomfort') : '') + '</span></span><span style="color:var(--mu);display:grid">' + svg(I.right, 18) + '</span></button>'; }).join('') + '</div></section>';
  return h;
}
/* ---------- Guide tab: beginner basics, every machine, free weights, functional circuit ---------- */
const BASICS = [
  ['How a session flows', 'Warm-up 5\u201310 min \u2192 big machines \u2192 smaller muscles \u2192 arms \u2192 core \u2192 cardio \u2192 stretch 5 min. On the Log tab, pick how long you have and FitHit lays this out with clock times.'],
  ['Sets, reps and rest', 'Example: \u201c3 \u00d7 12, 60 s rest\u201d means lift 12 times, rest 60 seconds, and do that 3 times. One exercise takes about 6 minutes.'],
  ['Picking a weight', 'Choose a weight where the last 2\u20133 reps are hard but still clean. Example: if 12 reps at 15 kg feel easy and you could do 5 more, try 17.5 kg next set.'],
  ['Getting stronger', 'Stay on a weight until you reach ' + PROGRESSION.repTop + ' reps in every set, then go up one step. Example: 20 kg \u00d7 15 this week \u2192 22.5 kg \u00d7 12 next week. FitHit suggests this for you.'],
  ['Breathing', 'Breathe out on the effort (pushing or pulling), breathe in on the way back. Never hold your breath.'],
  ['Pain', PAIN_RULE + ' Discomfort from effort is normal; joint pain is not.'],
  ['Busy machine?', 'Swap for one that works the same muscle: chest press \u2194 dumbbell bench press, lat pulldown \u2194 one-arm dumbbell row, shoulder press \u2194 seated dumbbell press.']];
const STRETCHES = [['Chest', 'Forearm on a door frame or pillar, step through gently.'], ['Upper back', 'Hold a rail at chest height, sit back and let your arms stretch long.'],
  ['Calves', 'Hands on a wall, one leg back, heel pressed down.'], ['Hamstrings', 'Sit on a bench, one leg straight along it, lean forward from the hips with a straight back.']];
export function guideView() {
  let h = '<section class="card sess"><div class="kick">Guide</div><h1>New to the gym? Start here</h1><p class="note">Basics first, then how to use every machine, free-weight and functional exercise. The same how-to opens from each exercise on the Log tab.</p></section>';
  h += '<section class="sec"><div class="sec-h"><h2>Basics</h2></div><div class="list">' + BASICS.map(b => '<div class="card mu"><b class="gb">' + esc(b[0]) + '</b><p class="msg" style="margin-top:6px">' + esc(b[1]) + '</p></div>').join('') + '</div></section>';
  const c = CIRCUIT, per = c.items.length * (c.work + c.rest), total = Math.round((per * c.rounds + c.roundRest * (c.rounds - 1)) / 60);
  h += '<section class="sec" id="circuit"><div class="sec-h"><h2>' + c.title + '</h2><span class="cap">About ' + total + ' min</span></div><div class="card cal"><p class="msg" style="margin-top:0">' + c.rounds + ' rounds. Each move: ' + c.work + ' s work, ' + c.rest + ' s rest. Rest ' + c.roundRest + ' s between rounds.</p><ol class="tlist">' +
    c.items.map((id, i) => '<li class="tl"><span class="tl-t num">' + pad(i + 1) + '</span><span class="grow"><b>' + esc(BY_ID[id].name) + '</b><span class="cue">' + esc(CUES[id] || '') + '</span></span></li>').join('') + '</ol><p class="fine">' + esc(c.why) + ' Do it after weights instead of part of the cardio, or on its own on a short day. Log each move under Functional & endurance on the Log tab.</p></div></section>';
  GROUPS.forEach(g => { const items = MACHINES.filter(m => m.g === g.id && GUIDE[m.id]);
    h += '<section class="sec"><div class="sec-h"><h2>' + esc(g.label) + '</h2><span class="cap">' + items.length + ' exercises</span></div><div class="list">' +
      items.map(m => '<details class="gd"><summary><span class="grow"><b>' + esc(m.name) + '</b>' + (m.paused ? '<span class="tag e">Paused</span>' : '') + '<span class="cue">' + esc(CUES[m.id] || m.paused || '') + '</span></span><span class="chev">' + svg(I.down, 18) + '</span></summary>' + guidePanel(m) + '</details>').join('') + '</div></section>'; });
  h += '<section class="sec"><div class="sec-h"><h2>Cool-down stretches</h2><span class="cap">20\u201330 s each, no bouncing</span></div><div class="list">' + STRETCHES.map(x => '<div class="card mu"><b class="gb">' + x[0] + '</b><p class="msg" style="margin-top:6px">' + esc(x[1]) + '</p></div>').join('') + '</div></section>';
  return h;
}
export function navHtml() {
  return [['log', 'Log', I.dumbbell], ['meals', 'Meals', I.utensils], ['guide', 'Guide', I.book], ['progress', 'Progress', I.activity], ['calendar', 'Calendar', I.calendar]]
    .map(x => '<button data-tab="' + x[0] + '"' + (ui.tab === x[0] ? ' aria-current="page"' : '') + '>' + svg(x[2], 22) + x[1] + '</button>').join('');
}
export function authView() {
  let h = '<header class="hdr"><div class="mark"><b>FITHIT</b><i></i></div></header><section class="auth">';
  if (auth.user && auth.member === false) return h + '<div class="kick v">Private app</div><h1>Not set up for this account</h1><p class="msg">This FitHit belongs to another account, so <b>' + esc(auth.user.email) + '</b> can\u2019t see or save anything here. If this is your FitHit, sign out and use the email you first signed in with.</p><button class="clr" style="margin-top:18px" data-act="signout">Sign out</button></section>';
  h += '<div class="kick v">Welcome back</div><h1>Sign in</h1>';
  if (auth.sent) h += '<p class="msg">We sent a sign-in link to <b>' + esc(auth.email) + '</b>. Open it on this device to continue. The link works once. If it hasn\u2019t arrived in a few minutes, check spam.</p><button class="clr" style="margin-top:18px" data-act="resend">Use a different email</button>';
  else h += '<p class="msg">Enter your email and we\u2019ll send you a link. No password needed. You stay signed in on this device.</p>' +
    '<form id="signin"><label class="field"><span>Email</span><input class="email" id="email" type="email" autocomplete="email" inputmode="email" required value="' + esc(auth.email) + '"></label>' +
    '<button class="save full" type="submit"' + (auth.busy ? ' disabled' : '') + '>' + (auth.busy ? 'Sending\u2026' : 'Send sign-in link') + '</button></form>';
  if (auth.error) h += '<p class="msg err" role="alert">' + esc(auth.error) + '</p>';
  return h + '</section>';
}

