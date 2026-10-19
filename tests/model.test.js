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
