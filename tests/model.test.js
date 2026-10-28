import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, dayTotals, isEmpty, nextStep, lastLoad, weeklyPace, checkins, sameDay, latestWhr, strengthSummary } from '../src/model.js';
import { planFor } from '../src/catalogue.js';

test('protein and kcal totals (2 paneer + 1 egg + 2 roti)', () => {
  const n = normalize({ meals: { b: { paneer: 2, egg: 1 }, l: { roti: 2 } } });
  assert.deepEqual(n.t, { p: 30, k: 582 }); // 18+6+6 g; 270+72+240 kcal
});
test('snapshot totals win over current values', () => {
  assert.deepEqual(dayTotals({ meals: { b: { paneer: 2 } }, t: { p: 99, k: 1 } }), { p: 99, k: 1 });
});
test('invalid values are dropped, not saved', () => {
  const n = normalize({ machines: ['leg_press', 'nope'], loads: { leg_press: { kg: -5, reps: 12 } }, body: { weight: 900, waist: 95 } });
  assert.deepEqual(n.machines, ['leg_press']); assert.deepEqual(n.loads, { leg_press: { reps: 12 } }); assert.deepEqual(n.body, { waist: 95 });
});
test('an unticked machine keeps no load', () => {
  assert.equal(normalize({ loads: { leg_press: { kg: 40, reps: 12 } } }).loads, undefined);
});
test('empty day is empty; weigh-in alone is not', () => {
  assert.ok(isEmpty(normalize({}))); assert.ok(!isEmpty(normalize({ body: { weight: 78.8 } })));
});
test('order of ticks does not create unsaved changes', () => {
  assert.ok(sameDay({ machines: ['pec_deck', 'chest_press'] }, { machines: ['chest_press', 'pec_deck'] }));
});
test('double progression', () => {
  assert.equal(nextStep({ kg: 40, reps: 15 }).kg, 42.5); assert.equal(nextStep({ kg: 10, reps: 15 }).kg, 11); assert.equal(nextStep({ kg: 40, reps: 12 }).kg, 40);
});
test('last load looks only at earlier days', () => {
  const e = { '2026-10-01': { loads: { leg_press: { kg: 30, reps: 12 } } }, '2026-10-05': { loads: { leg_press: { kg: 35, reps: 12 } } } };
  assert.equal(lastLoad(e, 'leg_press', '2026-10-05').kg, 30);
});
test('weekly pace', () => {
  const e = { '2026-09-25': { body: { weight: 78.8 } }, '2026-10-09': { body: { weight: 77.4 } } };
  assert.equal(Math.round(weeklyPace(checkins(e)) * 100) / 100, -0.7);
});
test('rest day moves the weekday sessions', () => {
  assert.equal(planFor(3, 3).title, 'Rest day'); assert.equal(planFor(4, 3).title, 'Cardio');
  assert.equal(planFor(2, 2).title, 'Rest day'); assert.equal(planFor(3, 2).title, 'Upper body A');
  assert.equal(planFor(1, 3).title, 'Legs (knee-safe) + core'); assert.equal(planFor(2, 3).title, 'Upper body A'); assert.equal(planFor(5, 3).title, 'Strength training');
  assert.equal(planFor(6, 3).title, 'Cardio'); assert.equal(planFor(0, 3).title, 'Holiday');
});

test('waist-to-hip ratio uses the latest check-in with both', () => {
  const e = { '2026-09-25': { body: { waist: 104, hip: 105 } }, '2026-10-09': { body: { weight: 77 } } };
  assert.deepEqual(latestWhr(checkins(e)), { key: '2026-09-25', whr: 0.99 });
});
test('strength drop of 10% or more below best is flagged', () => {
  const e = { '2026-10-01': { loads: { leg_press: { kg: 40, reps: 12 } } }, '2026-10-08': { loads: { leg_press: { kg: 35, reps: 12 } } },
    '2026-10-02': { loads: { chest_press: { kg: 20, reps: 12 } } }, '2026-10-09': { loads: { chest_press: { kg: 19, reps: 12 } } } };
  const s = Object.fromEntries(strengthSummary(e).map(r => [r.id, r.dropped]));
  assert.equal(s.leg_press, true); assert.equal(s.chest_press, false);
});
test('ghee counts calories but no protein', () => {
  assert.deepEqual(normalize({ meals: { l: { ghee: 2, roti: 2 } } }).t, { p: 6, k: 330 });
});

test('a suggested weight is not saved unless reps are logged', () => {
  assert.equal(normalize({ machines: ['leg_press'], loads: { leg_press: { kg: 32.5, sug: true } } }).loads, undefined);
  assert.deepEqual(normalize({ machines: ['leg_press'], loads: { leg_press: { kg: 32.5, sug: true, reps: 12 } } }).loads, { leg_press: { kg: 32.5, reps: 12 } });
});

/* ---------- v3: planner, protein by weight, your own exercises and foods ---------- */
import { buildPlan, foodMeasure, amountTotals, exerciseCount, kcalBurned } from '../src/model.js';
import { SESSIONS, FOOD_BY, BY_ID } from '../src/catalogue.js';

test('protein by weight: 120 g paneer = 21.6 g protein, 324 kcal', () => {
  assert.deepEqual(amountTotals(foodMeasure(FOOD_BY.paneer), 120), { p: 21.6, k: 324 });
});
test('protein by count: 2 scoops whey = 48 g protein, 240 kcal', () => {
  const m = foodMeasure(FOOD_BY.whey); assert.equal(m.u, 'scoop'); assert.deepEqual(amountTotals(m, 2), { p: 48, k: 240 });
});
test('your own food counts in the day total and is saved with its per-unit values', () => {
  const n = normalize({ cf: { b: [{ n: 'My whey', u: 'scoop', q: 1.5, p: 25, k: 130 }] }, meals: { b: { egg: 2 } } });
  assert.deepEqual(n.t, { p: 49.5, k: 339 }); // 37.5 + 12 g; 195 + 144 kcal
  assert.deepEqual(n.cf.b[0], { n: 'My whey', u: 'scoop', q: 1.5, p: 25, k: 130 });
});
test('own foods with no name, no amount or silly protein are dropped', () => {
  assert.equal(normalize({ cf: { b: [{ n: '', q: 1, p: 5 }, { n: 'x', q: 0, p: 5 }, { n: 'y', q: 50, p: 100 }] } }).cf, undefined);
});
test('your own exercise counts as a gym day, an exercise and its kcal', () => {
  const n = normalize({ cx: [{ n: '  Kettlebell   swing <b>', kg: 8, reps: 15, kcal: 40 }, { n: '' }] });
  assert.deepEqual(n.cx, [{ n: 'Kettlebell swing b', kg: 8, reps: 15, kcal: 40 }]);
  assert.ok(n.gym); assert.equal(exerciseCount(n), 1); assert.equal(kcalBurned(n), 40);
});
test('reps-only exercises keep reps', () => {
  assert.deepEqual(normalize({ machines: ['incline_pushup'], loads: { incline_pushup: { reps: 12, kg: 9 } } }).loads, { incline_pushup: { reps: 12 } });
});
test('planner: 2 hours fits the whole Upper A session plus 40 min cardio, big moves first', () => {
  const p = buildPlan(SESSIONS.upperA, 120);
  assert.deepEqual(p.steps.map(s => s.id), ['chest_press', 'lat_pulldown', 'shoulder_press', 'pec_deck', 'bicep_curl', 'tricep_ext']);
  assert.equal(p.cardio.dur, 40); assert.equal(p.skipped.length, 0); assert.equal(p.spare, 120 - 10 - 36 - 40 - 5);
});
test('planner: 45 min keeps the big moves, drops arms, and still leaves 10 min cardio', () => {
  const p = buildPlan(SESSIONS.upperA, 45); // 10 warm + 5 cool = 30 left; 10 cardio -> 20 for weights -> 3 big moves
  assert.deepEqual(p.steps.map(s => s.id), ['chest_press', 'lat_pulldown', 'shoulder_press']);
  assert.equal(p.cardio.dur, 12); assert.deepEqual(p.skipped, ['pec_deck', 'bicep_curl', 'tricep_ext']);
  assert.equal(p.coolStart + p.cool + p.spare, 45);
});
test('planner: legs day puts leg press first and core after the machines', () => {
  const ids = buildPlan(SESSIONS.legs, 90).steps.map(s => s.id);
  assert.equal(ids[0], 'leg_press'); assert.deepEqual(ids.slice(-3), ['dead_bug', 'bird_dog', 'plank']);
});
test('planner: nothing for rest days or under 20 minutes', () => {
  assert.equal(buildPlan(SESSIONS.rest, 60), null); assert.equal(buildPlan(SESSIONS.upperA, 15), null);
});
test('planner: a Cardio day in 1 hr is warm-up, 45 min cardio, stretch, and nothing else', () => {
  const p = buildPlan(SESSIONS.saturday, 60);
  assert.equal(p.steps.length, 0); assert.equal(p.cardio.dur, 45); assert.equal(p.coolStart + p.cool + p.spare, 60);
});

/* ---------- v4: today's routine (mood, pain areas, body) ---------- */
import { buildRoutine, adjustFor, bmiOf, whrLimitFor, suggestLoad, estimateKcal } from '../src/model.js';
import { MOODS } from '../src/catalogue.js';

test('BMI: 160 cm, 78 kg = 30.5; obese on the Indian lines and the WHO lines', () => {
  assert.deepEqual(bmiOf(160, 78), { v: 30.5, band: 'obese', who: 'obese' });
});
test('BMI: 24 counts as overweight in India but normal for WHO', () => {
  assert.deepEqual(bmiOf(170, 69.4), { v: 24, band: 'over', who: 'normal' });
  assert.equal(bmiOf(0, 70), null); assert.equal(bmiOf(170, ''), null);
});
test('waist-to-hip line follows sex: women 0.85, men 0.90, women if not set', () => {
  assert.equal(whrLimitFor('f'), 0.85); assert.equal(whrLimitFor('m'), 0.9); assert.equal(whrLimitFor(null), 0.85);
});
test('shoulder trouble swaps the shoulder press for a landmine press and says why', () => {
  assert.deepEqual(adjustFor('shoulder_press', ['shoulder']), { id: 'landmine_press', from: 'shoulder_press', area: 'shoulder', why: 'pressing straight overhead', cues: ['Stop if it pinches'] });
});
test('a swap that another pain area also rules out is dropped instead', () => {
  // knee says goblet squat -> box squat; fine. Ankle says step-up -> leg press; knee keeps leg press with a cue.
  assert.equal(adjustFor('db_step_up', ['knee', 'ankle']).id, 'glute_bridge');
  assert.equal(adjustFor('shadow_box', ['ankle']).id, null);
});
test('exercises that stay collect a cue from every pain area', () => {
  assert.deepEqual(adjustFor('leg_press', ['knee', 'back']).cues, ['Bend knees only to about 60°', 'Hips stay flat on the pad, shallow range']);
  assert.deepEqual(adjustFor('chest_press', []), { id: 'chest_press', cues: [] });
});
test('heavy upper day with shoulder trouble: no overhead pressing anywhere, 3 free weights added', () => {
  const r = buildRoutine({ mood: 'heavy', troubles: ['shoulder'], session: SESSIONS.upperA, seed: 0 });
  ['shoulder_press', 'db_shoulder', 'dip', 'pullover', 'db_ohtri', 'db_fly'].forEach(id => assert.ok(!r.items.includes(id), id));
  assert.ok(r.items.includes('landmine_press')); assert.deepEqual(r.changes.map(c => c.from), ['shoulder_press']);
  const free = r.items.filter(id => !SESSIONS.upperA.items.includes(id) && BY_ID[id].g !== 'cardio' && id !== 'landmine_press');
  assert.equal(free.length, 3); free.forEach(id => assert.equal(BY_ID[id].g, 'free'));
});
test('free-weight picks rotate from day to day', () => {
  const a = buildRoutine({ mood: 'heavy', session: SESSIONS.upperA, seed: 0 }).items, b = buildRoutine({ mood: 'heavy', session: SESSIONS.upperA, seed: 1 }).items;
  assert.notDeepEqual(a, b);
});
test('heavy legs day with knee and back trouble: no lunges, step-ups, swings or deep squats; still 3 free weights', () => {
  const r = buildRoutine({ mood: 'heavy', troubles: ['knee', 'back'], session: SESSIONS.legs, seed: 0 });
  ['goblet_squat', 'db_reverse_lunge', 'db_step_up', 'kb_swing', 'smith', 'db_rdl'].forEach(id => assert.ok(!r.items.includes(id), id));
  const added = r.items.filter(id => !SESSIONS.legs.items.includes(id) && BY_ID[id].g !== 'cardio');
  assert.equal(added.length, 3); assert.ok(r.cues.leg_press.includes('60'));
  assert.equal(r.items[r.items.length - 2], 'recumbent_bike'); // knee trouble: seated bike first
});
test('light day: 2 sets of 4 minutes per machine, 20 min cardio, 2 free weights', () => {
  const r = buildRoutine({ mood: 'light', session: SESSIONS.upperB, seed: 2 });
  assert.equal(r.session.liftMins, 4); assert.equal(r.session.cardio, 20);
  assert.equal(r.items.filter(id => !SESSIONS.upperB.items.includes(id) && BY_ID[id].g !== 'cardio').length, 2);
});
test('only cardio: cardio machines only, no core or weights', () => {
  const r = buildRoutine({ mood: 'cardio', troubles: ['wrist'], session: SESSIONS.upperA });
  assert.deepEqual(r.items, ['recumbent_bike', 'cross_trainer']); assert.ok(r.items.every(id => BY_ID[id].g === 'cardio'));
  const p = buildPlan(r.session, 60); assert.equal(p.steps.length, 0); assert.equal(p.cardio.dur, 45);
});
test('rest day or Saturday + heavy = a full-body session', () => {
  const r = buildRoutine({ mood: 'heavy', session: SESSIONS.rest, seed: 0 });
  ['leg_press', 'chest_press', 'lat_pulldown'].forEach(id => assert.ok(r.items.includes(id)));
});
test('underweight: shorter cardio, with a note', () => {
  const r = buildRoutine({ mood: 'heavy', session: SESSIONS.upperA, bmi: bmiOf(170, 50) });
  assert.equal(r.session.cardio, 10); assert.equal(r.notes.length, 1);
});
test('light-day weight is about 60% of last time, rounded to 0.5 kg', () => {
  assert.deepEqual(suggestLoad({ kg: 25, reps: 12 }, 'light'), { kg: 15, reason: 'Light day: about 60% of your last weight' });
  assert.equal(suggestLoad({ kg: 22.5, reps: 12 }, 'light').kg, 13.5);
  assert.equal(suggestLoad({ kg: 40, reps: 15 }, 'heavy').kg, 42.5); assert.equal(suggestLoad(null, 'light'), null);
});
test('kcal estimate: MET x kg x hours, block by block', () => {
  const plan = { warm: 10, cool: 5, steps: [{ id: 'chest_press', dur: 6 }, { id: 'plank', dur: 4 }], cardio: { dur: 20 } };
  // (10x3.5 + 5x2.3 + 6x5.0 + 4x2.8 + 20x5.0) = 187.7 MET-min x 78 kg / 60 = 244 -> 240
  assert.equal(estimateKcal(plan, 'heavy', 78), 240); assert.equal(estimateKcal(plan, 'heavy', null), null);
});
test('every mood has a label and a note', () => { MOODS.forEach(m => { assert.ok(m.label); assert.ok(m.note); }); });

/* ---------- panel review round 1 fixes ---------- */
test('C1: with too little time, your usual moves stay and the free-weight extras are left out first', () => {
  const r = buildRoutine({ mood: 'heavy', session: SESSIONS.upperA, seed: 0 }), p = buildPlan(r.session, 60);
  const usual = SESSIONS.upperA.items.filter(id => BY_ID[id].g !== 'cardio');
  const extras = r.items.filter(id => r.session.prio[id] === 1);
  assert.equal(extras.length, 3);
  extras.forEach(id => assert.ok(p.skipped.includes(id), id + ' should be left out before usual moves'));
  assert.ok(p.steps.map(s => s.id).includes('bicep_curl'));
  assert.ok(usual.filter(id => !p.steps.map(s => s.id).includes(id)).length <= 1);
});
test('C2: the mood is saved with a gym day, and only with a gym day', () => {
  assert.equal(normalize({ machines: ['chest_press'], mood: 'light' }).mood, 'light');
  assert.equal(normalize({ mood: 'light' }).mood, undefined);
  assert.equal(normalize({ machines: ['chest_press'], mood: 'nonsense' }).mood, undefined);
});
test('C4: sharp knee pain rests every leg exercise and leaves only the seated bike', () => {
  const r = buildRoutine({ mood: 'heavy', troubles: ['knee'], sharp: ['knee'], session: SESSIONS.legs, seed: 0 });
  r.items.filter(id => BY_ID[id].g !== 'cardio').forEach(id => assert.ok(!(BY_ID[id].m || []).includes('Legs'), id));
  assert.deepEqual(r.items.filter(id => BY_ID[id].g === 'cardio'), ['recumbent_bike']);
  assert.ok(r.changes.some(c => c.sharp && c.from === 'leg_press'));
  assert.ok(r.notes.some(n => /Sharp pain today/.test(n)));
});
test('C4: a niggle (not sharp) keeps leg work with the knee cues', () => {
  const r = buildRoutine({ mood: 'heavy', troubles: ['knee'], session: SESSIONS.legs, seed: 0 });
  assert.ok(r.items.includes('leg_press')); assert.ok(r.cues.leg_press.includes('60'));
});
test('C4: sharp lower-back pain allows only two gentle core moves and easy cardio', () => {
  const r = buildRoutine({ mood: 'light', troubles: ['back'], sharp: ['back'], session: SESSIONS.upperA, seed: 0 });
  assert.deepEqual(r.items.filter(id => BY_ID[id].g !== 'cardio'), []);
  assert.ok(r.notes.some(n => /Nothing is safe to lift/.test(n)));
  const c = buildRoutine({ mood: 'cardio', troubles: ['back'], sharp: ['back'], session: SESSIONS.upperA });
  assert.deepEqual(c.items, ['recumbent_bike', 'treadmill']);
});
test('C4: sharp only counts for areas that are ticked', () => {
  const r = buildRoutine({ mood: 'heavy', troubles: [], sharp: ['knee'], session: SESSIONS.legs, seed: 0 });
  assert.ok(r.items.includes('leg_press')); assert.equal(r.changes.length, 0);
});

/* ---------- v4.1: fixed day pattern + focus dropdown ---------- */
import { dayTypeFor, sessionForType, fitsDayType, DAY_TYPES, MACHINES, legacyPlanFor } from '../src/catalogue.js';
test('v4.1: weekdays run Lower, Upper, Cardio, Strength around the rest day; Saturday cardio, Sunday off', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 0].map(d => dayTypeFor(d, 3)), ['lower', 'upper', 'rest', 'cardio', 'strength', 'cardio', 'holiday']);
  assert.deepEqual([1, 2, 3, 4, 5].map(d => dayTypeFor(d, 1)), ['rest', 'lower', 'upper', 'cardio', 'strength']);
});
test('v4.1: every day type has a session, and upper/lower alternate A and B by week', () => {
  DAY_TYPES.forEach(t => assert.ok(sessionForType(t.id).items.length, t.id));
  assert.equal(sessionForType('upper', 0).title, 'Upper body A'); assert.equal(sessionForType('upper', 1).title, 'Upper body B');
  assert.equal(sessionForType('lower', 1), SESSIONS.legs2);
});
test('v4.1: a Cardio day has cardio machines only', () => {
  assert.ok(sessionForType('cardio').items.every(id => BY_ID[id].g === 'cardio'));
  ['heavy', 'light', 'cardio'].forEach(mood => {
    const r = buildRoutine({ mood, session: sessionForType('cardio'), seed: 3 });
    assert.ok(r.items.length && r.items.every(id => BY_ID[id].g === 'cardio'), mood);
  });
  assert.ok(buildRoutine({ mood: 'light', session: sessionForType('cardio') }).session.cardio < buildRoutine({ mood: 'heavy', session: sessionForType('cardio') }).session.cardio);
});
test('v4.1: the other-exercises list follows the focus', () => {
  const list = t => MACHINES.filter(m => fitsDayType(m, t)).map(m => m.id);
  assert.ok(list('cardio').every(id => BY_ID[id].g === 'cardio'));
  assert.ok(list('upper').includes('chest_press') && !list('upper').includes('leg_press') && !list('upper').includes('goblet_squat') && !list('upper').includes('plank'));
  assert.ok(list('lower').includes('leg_press') && list('lower').includes('goblet_squat') && list('lower').includes('plank') && !list('lower').includes('chest_press'));
  assert.equal(list('strength').length, MACHINES.length);
});
test('v4.1: switching focus changes the routine (upper vs lower)', () => {
  const up = buildRoutine({ mood: 'light', session: sessionForType('upper'), seed: 0 }).items, lo = buildRoutine({ mood: 'light', session: sessionForType('lower'), seed: 0 }).items;
  assert.ok(up.includes('chest_press') && !up.includes('leg_press')); assert.ok(lo.includes('leg_press') && !lo.includes('chest_press'));
  const st = buildRoutine({ mood: 'heavy', session: sessionForType('strength'), seed: 0 }).items;
  assert.ok(st.includes('leg_press') && st.includes('lat_pulldown'));
});
test('v4.1: the focus is saved with a gym day; Only cardio saves as cardio', () => {
  assert.equal(normalize({ machines: ['chest_press'], dtype: 'upper' }).dtype, 'upper');
  assert.equal(normalize({ dtype: 'upper' }).dtype, undefined);
  assert.equal(normalize({ machines: ['chest_press'], dtype: 'junk' }).dtype, undefined);
  assert.equal(normalize({ cardio: { treadmill: 100 }, mood: 'cardio', dtype: 'upper' }).dtype, 'cardio');
});
test('v4.1: older days keep their old names', () => { assert.equal(legacyPlanFor(4, 3).title, 'Upper body B'); });
