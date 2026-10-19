// Screens. Each function returns HTML for one part of the app; no saving or event handling here.
import { GROUPS, GROUP_LABEL, MACHINES, BY_ID, CUES, PAIN_RULE, planFor, DAYNAMES, MUSCLES, DOW, MEALS, FOODS, FOOD_BY } from './catalogue.js';
import { keyOf, parseKey, addDays, mondayOf, daysBetween, has, isGymDay, kcalBurned, exerciseCount, mealTotals, dayTotals, servings, lastLoad, nextStep, checkins, weeklyPace, latestWhr, strengthSummary, pad } from './model.js';
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
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>' };
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
  const step = nextStep(last);
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
  return h + '</div>';
}
function kneeBlock(d) {
  const opts = [[0, 'Fine'], [1, 'Some discomfort'], [2, 'Had to stop']];
  return '<div class="card knee"><div class="kick">Knee today</div><div class="seg" role="radiogroup" aria-label="How was your knee today">' +
    opts.map(o => '<button role="radio" aria-checked="' + (d.knee === o[0]) + '" data-knee="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>' +
    (d.knee > 0 ? '<p class="cue" style="margin-top:10px">' + PAIN_RULE + (d.knee === 2 ? ' Two stops in two weeks is a good reason to see a physiotherapist.' : '') + '</p>' : '') + '</div>';
}
export function logView(D) {
  const d = draftFor(ui.selected), dow = parseKey(ui.selected).getDay(), p = planFor(dow, S.settings.restDow), ids = p.items || [];
  const items = ids.map((id, i) => ({ m: BY_ID[id], cue: (p.cues && p.cues[id]) || CUES[id] || '', num: pad(i + 1) }));
  const isOn = m => m.g === 'cardio' ? has(d.cardio, m.id) : d.machines.includes(m.id);
  const done = items.filter(x => isOn(x.m)).length;
  const extra = d.machines.some(id => !ids.includes(id)) || Object.keys(d.cardio).some(id => !ids.includes(id));
  const open = ui.othersOpen !== null ? ui.othersOpen : (!ids.length || extra);
  const gymOn = isGymDay(d);
  let h = '<section class="card sess"><div class="kick">' + DAYNAMES[dow] + (p.rest ? ' \u00b7 Recovery' : ' \u00b7 Session') + '</div><h1>' + esc(p.title) + '</h1>';
  if (p.rx) h += '<div class="rx">' + p.rx.map(r => '<div><b class="num">' + r.value + '</b><span>' + r.label + '</span></div>').join('') + '</div>';
  h += '<p class="note">' + esc(p.note) + '</p>';
  if (ids.length) h += '<div class="prog"><div class="prog-h"><span class="kick">Session progress</span><span class="big num" aria-label="' + done + ' of ' + items.length + ' done"><span class="v">' + done + '</span>/' + items.length + '</span></div><div class="segs" aria-hidden="true">' +
    items.map(x => '<span' + (isOn(x.m) ? ' class="on"' : '') + '></span>').join('') + '</div></div>';
  h += '</section><div class="pad"><button class="gym' + (gymOn ? ' on' : '') + '" data-act="gym" aria-pressed="' + gymOn + '"><span style="color:var(--volt);display:grid">' + svg(I.dumbbell, 22) + '</span>' +
    '<span class="grow"><span class="gym-t">Went to the gym</span><span class="sub">' + (gymOn ? 'Counts toward your week' : 'Tick even if you only did a few machines') + '</span></span>' + (gymOn ? CHECK : BOX) + '</button>' + (gymOn ? kneeBlock(d) : '') + '</div>';
  if (ids.length) h += '<section class="sec"><div class="sec-h"><h2>Programme</h2><span class="cap">Tap to tick off, then log the weight</span></div><div class="list">' + items.map(x => itemRow(x.m, x.cue, x.num, d)).join('') + '</div></section>';
  const groups = GROUPS.map(g => ({ g, items: MACHINES.filter(m => m.g === g.id && !ids.includes(m.id)) })).filter(x => x.items.length);
  const total = groups.reduce((a, x) => a + x.items.length, 0);
  h += '<section class="pad" style="margin-top:32px"><button class="disc" data-act="others" aria-expanded="' + !!open + '"><span class="t">' + (ids.length ? 'Other exercises' : 'All exercises') + '</span><span class="cap">' + total + ' available</span><span class="chev">' + svg(I.down, 18) + '</span></button>';
  if (open) h += groups.map(x => '<div class="grp"><div class="kick v">' + x.g.label + '</div>' + (x.g.hint ? '<div class="cap" style="margin-top:2px">' + x.g.hint + '</div>' : '') +
    '<div class="list">' + x.items.map(m => itemRow(m, CUES[m.id] || '', '', d)).join('') + '</div></div>').join('');
  return h + '</section>';
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
  const ex = d.extra[ui.meal], exk = d.extraK[ui.meal];
  h += '<div class="grp"><div class="kick v">Something else</div><div class="list"><div class="row' + (Number(ex) > 0 || Number(exk) > 0 ? ' on' : '') + '"><div class="kc np" style="padding-top:16px;flex-wrap:wrap">' +
    '<span class="grow" style="color:var(--tx);min-width:100%"><b style="display:block;font-weight:600;font-size:15.5px">From a label or another dish</b><span class="cue">For example, a whey scoop: 24 g protein, 120 kcal</span></span>' +
    '<label class="lf"><span class="sr">Extra protein in grams</span><input class="inp v sm num" type="number" inputmode="decimal" min="0" max="300" placeholder="0" data-extra="' + ui.meal + '" value="' + val(ex) + '"></label><span class="unit">g</span>' +
    '<label class="lf"><span class="sr">Extra calories</span><input class="inp sm num" type="number" inputmode="numeric" min="0" max="3000" placeholder="0" data-extrak="' + ui.meal + '" value="' + val(exk) + '"></label><span class="unit">kcal</span></div></div></div></div></section>';
  h += '<section class="sec"><div class="card cal"><div class="sec-h" style="margin:0"><h2 style="font-size:22px">Protein this week</h2><span class="cap" style="white-space:nowrap">Line: ' + proteinGoal() + ' g</span></div><div class="pw" id="m-week">' + proteinWeek(D) + '</div>' +
    '<p class="fine">Values are estimates for home-cooked portions. Ghee or oil adds about 45 kcal per teaspoon. For anything packaged, use Something else and copy its label.</p></div></section>';
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
  const whr = latestWhr(list);
  h += '<p class="msg">' + vfLine + (lastWaist ? ' \u00b7 Waist ' + fmt(lastWaist.waist, 1) + ' cm' : '') + '</p>' + (whr ? '<p class="msg' + (whr.whr > st.whrLimit ? ' err' : '') + '">Waist-to-hip ratio ' + whr.whr.toFixed(2) + (whr.whr > st.whrLimit ? ', above the ' + st.whrLimit + ' health-risk line for women. Waist coming down is the best sign visceral fat is dropping.' : ', at or under ' + st.whrLimit + '. Well done.') + '</p>' : '<p class="msg">Add waist and hip to track your waist-to-hip ratio (health-risk line: ' + st.whrLimit + ').</p>') + '<p class="msg' + (retest.includes('overdue') ? ' err' : '') + '">' + retest + '</p>';
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
  h += '<div class="stats">' + stats.map(s => '<div class="card"><b class="num">' + s[0] + '</b><span>' + s[1] + '</span></div>').join('') + '</div>' + kneeSummary(D) + '</section>';
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
export function navHtml() {
  return [['log', 'Log', I.dumbbell], ['meals', 'Meals', I.utensils], ['progress', 'Progress', I.activity], ['calendar', 'Calendar', I.calendar]]
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

