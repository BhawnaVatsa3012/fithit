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
  assert.equal(planFor(3, 3).title, 'Rest day'); assert.equal(planFor(4, 3).title, 'Upper body B');
  assert.equal(planFor(2, 2).title, 'Rest day'); assert.equal(planFor(3, 2).title, 'Legs (knee-safe) + core');
  assert.equal(planFor(6, 3).title, 'Cardio intervals + core'); assert.equal(planFor(0, 3).title, 'Holiday');
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
import { SESSIONS, FOOD_BY } from '../src/catalogue.js';

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
test('planner: Saturday in 1 hr is bike first, then all three core moves', () => {
  const p = buildPlan(SESSIONS.saturday, 60);
  assert.ok(p.cardio.start < p.steps[0].start); assert.deepEqual(p.steps.map(s => s.id), ['dead_bug', 'bird_dog', 'plank']);
  assert.equal(p.cardio.dur, 33); assert.equal(p.coolStart + p.cool + p.spare, 60);
});
