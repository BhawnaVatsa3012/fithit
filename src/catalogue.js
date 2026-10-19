// Everything FitHit "knows": machines, cues, the weekly plan, foods and default targets.
// Personal numbers (weights, targets) are NOT stored here: they live in your Supabase settings.

export const GROUPS = [
  { id: 'cardio', label: 'Cardio', hint: 'Tick the machine, then type the kcal from its screen. Machine readings tend to run high, so use them to compare sessions, not as exact burn.' },
  { id: 'upper', label: 'Upper body' }, { id: 'lower', label: 'Lower body' }, { id: 'core', label: 'Core' }, { id: 'free', label: 'Free weights' }];
export const GROUP_LABEL = { cardio: 'Cardio', upper: 'Upper', lower: 'Lower', core: 'Core', free: 'Free weights' };

// load: true = log kg × reps; 'time' = bodyweight hold (seconds)
export const MACHINES = [
  { id: 'treadmill', name: 'Treadmill', g: 'cardio' }, { id: 'cross_trainer', name: 'Cross trainer', g: 'cardio' },
  { id: 'upright_bike', name: 'Upright bike', g: 'cardio' }, { id: 'recumbent_bike', name: 'Recumbent bike', g: 'cardio' },
  { id: 'rower', name: 'Rowing machine', g: 'cardio', paused: 'Paused for now: deep knee bend' },
  { id: 'chest_press', name: 'Chest press', g: 'upper', m: ['Chest'], load: true }, { id: 'pec_deck', name: 'Pec deck', g: 'upper', m: ['Chest'], load: true },
  { id: 'shoulder_press', name: 'Shoulder press', g: 'upper', m: ['Shoulders'], load: true }, { id: 'lat_pulldown', name: 'Lat pulldown', g: 'upper', m: ['Back'], load: true },
  { id: 'pullover', name: 'Pullover machine', g: 'upper', m: ['Back'], load: true }, { id: 'bicep_curl', name: 'Bicep curl', g: 'upper', m: ['Arms'], load: true },
  { id: 'tricep_ext', name: 'Tricep extension', g: 'upper', m: ['Arms'], load: true }, { id: 'dip', name: 'Dip machine', g: 'upper', m: ['Arms', 'Chest'], load: true },
  { id: 'leg_press', name: 'Leg press', g: 'lower', m: ['Legs'], load: true }, { id: 'leg_ext', name: 'Leg extension', g: 'lower', m: ['Legs'], load: true },
  { id: 'smith', name: 'Smith machine', g: 'lower', m: ['Legs'], paused: 'Paused for now: loads knee and spine', load: true },
  { id: 'hip_abd', name: 'Hip abduction', g: 'lower', m: ['Legs'], load: true }, { id: 'hip_add', name: 'Hip adduction', g: 'lower', m: ['Legs'], load: true },
  { id: 'calf', name: 'Calf raise', g: 'lower', m: ['Legs'], load: true },
  { id: 'dead_bug', name: 'Dead bug', g: 'core', m: ['Core'] }, { id: 'bird_dog', name: 'Bird dog', g: 'core', m: ['Core'] },
  { id: 'plank', name: 'Forearm plank', g: 'core', m: ['Core'], load: 'time' },
  { id: 'crunch', name: 'Crunch machine', g: 'core', m: ['Core'], paused: 'Paused for now: strains lower back' },
  { id: 'back_ext', name: 'Back extension', g: 'core', m: ['Core', 'Back'], paused: 'Paused for now: stresses lower back' },
  { id: 'db_lateral', name: 'Seated dumbbell lateral raise', g: 'free', m: ['Shoulders'], load: true },
  { id: 'free_weights', name: 'Other free weights', g: 'free', m: [] }];
export const BY_ID = Object.fromEntries(MACHINES.map(m => [m.id, m]));

export const CUES = {
  leg_press: 'Bend knees only to about 60\u00b0', leg_ext: 'Lift only halfway: from bent to half-straight',
  hip_abd: 'Slow and controlled, protects the knee', hip_add: 'Slow and controlled', calf: 'Full range, pause at the top',
  chest_press: 'Back flat against the pad', shoulder_press: 'Back flat against the pad',
  lat_pulldown: 'Pull to upper chest, don\u2019t lean back', pec_deck: 'Slight bend in the elbows',
  pullover: 'Keep lower back against the pad', dip: 'Use the assist, shoulders down',
  bicep_curl: 'No swinging', tricep_ext: 'Keep elbows still', db_lateral: 'Seated with back support, light weight',
  dead_bug: 'Lower back pressed to the floor', bird_dog: 'Slow, hips level', plank: '20\u201330 s, on knees if needed',
  upright_bike: 'Seat high: knee slightly bent at the bottom', recumbent_bike: 'Seat far enough that the knee stays slightly bent',
  cross_trainer: 'Smooth pace, stand tall', treadmill: 'Walk only, 3\u20136% incline' };

export const PROGRESSION = { repTop: 15, repBottom: 12, sets: 3 };
export const PAIN_RULE = 'Stop for sharp pain, pain that builds during a set, or swelling the next day.';

const RX = [{ label: 'Sets', value: '3' }, { label: 'Reps', value: '12\u201315' }, { label: 'Rest', value: '60 s' }, { label: 'Cardio', value: '40 min' }];
const LEGS = ['leg_press', 'hip_abd', 'hip_add', 'leg_ext', 'calf', 'dead_bug', 'bird_dog', 'plank'];
const WU = '10 min easy bike warm-up. Weights first, then ';
export const SESSIONS = {
  upperA: { title: 'Upper body A', rx: RX, note: WU + '40 min on either bike.', items: ['chest_press', 'lat_pulldown', 'shoulder_press', 'pec_deck', 'bicep_curl', 'tricep_ext', 'recumbent_bike', 'upright_bike'] },
  legs: { title: 'Legs (knee-safe) + core', rx: RX, note: WU + '40 min cross trainer.', items: LEGS.concat(['cross_trainer']) },
  upperB: { title: 'Upper body B', rx: RX, note: WU + '40 min recumbent bike.', items: ['lat_pulldown', 'pullover', 'chest_press', 'dip', 'db_lateral', 'bicep_curl', 'tricep_ext', 'recumbent_bike'] },
  legs2: { title: 'Legs (knee-safe) + core', rx: RX, note: WU + '40 min incline walk or cross trainer.', items: LEGS.concat(['treadmill', 'cross_trainer']) },
  saturday: { title: 'Cardio intervals + core', rx: [{ label: 'Total', value: '1 hr' }, { label: 'Bike', value: '45 min' }, { label: 'Core', value: '10 min' }], note: '45 min bike intervals, then 10 min core on the mat.', items: ['recumbent_bike', 'upright_bike', 'dead_bug', 'bird_dog', 'plank'], cues: { recumbent_bike: '2 min easy, 1 min harder \u00d7 10\u201312 rounds', upright_bike: '2 min easy, 1 min harder \u00d7 10\u201312 rounds' } },
  rest: { rest: true, title: 'Rest day', note: 'Muscle rebuilds on rest days. A relaxed walk is fine. If you do go in, keep it to cardio only.' },
  sunday: { rest: true, title: 'Holiday', note: 'Sunday off. Enjoy it.' } };
const WEEKDAY_ORDER = ['upperA', 'legs', 'upperB', 'legs2'];

/** Session for a weekday (0 = Sun). restDow is the weekday rest day (1–5). */
export function planFor(dow, restDow = 3) {
  if (dow === 0) return SESSIONS.sunday;
  if (dow === 6) return SESSIONS.saturday;
  if (dow === restDow) return SESSIONS.rest;
  const training = [1, 2, 3, 4, 5].filter(d => d !== restDow);
  return SESSIONS[WEEKDAY_ORDER[training.indexOf(dow)]];
}

export const DAYNAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio'];
export const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const MEALS = [{ id: 'b', label: 'Breakfast', share: 0.3 }, { id: 'l', label: 'Lunch', share: 0.3 }, { id: 's', label: 'Snack', share: 0.1 }, { id: 'd', label: 'Dinner', share: 0.3 }];

// p = grams protein, k = kcal per serving. Estimates for home-cooked portions (verified Oct 2026 against IFCT-based and label sources).
export const FOODS = [
  { id: 'soya', name: 'Soya chunks', serve: '30 g dry', p: 15, k: 105, cue: 'Keep to 50 g dry a day', grp: 'p' },
  { id: 'paneer', name: 'Paneer', serve: '50 g', p: 9, k: 135, cue: 'High in fat: 2 servings = 270 kcal', grp: 'p' },
  { id: 'egg', name: 'Whole egg', serve: '1 large', p: 6, k: 72, grp: 'p' },
  { id: 'egg_white', name: 'Egg white', serve: '1 large', p: 3.5, k: 17, cue: 'Most protein per kcal on this list', grp: 'p' },
  { id: 'hung_curd', name: 'Hung curd', serve: '100 g', p: 8, k: 100, grp: 'p' },
  { id: 'chana', name: 'Roasted chana', serve: '30 g, a handful', p: 6, k: 110, grp: 'p' },
  { id: 'dal', name: 'Dal', serve: '1 katori (150 g), cooked', p: 7, k: 145, grp: 'p' },
  { id: 'rajma', name: 'Rajma or chole', serve: '1 katori (150 g), cooked', p: 8, k: 150, grp: 'p' },
  { id: 'besan_chilla', name: 'Besan chilla', serve: '1, from 30 g besan', p: 6.5, k: 150, grp: 'p' },
  { id: 'peanuts', name: 'Peanuts', serve: '30 g', p: 7.5, k: 170, grp: 'p' },
  { id: 'milk', name: 'Milk (toned)', serve: '1 glass, 200 ml', p: 6.5, k: 120, grp: 'e' },
  { id: 'curd', name: 'Curd (dahi)', serve: '1 katori, 150 g', p: 5, k: 90, grp: 'e' },
  { id: 'roti', name: 'Roti', serve: '1 medium (40 g), no ghee', p: 3, k: 120, grp: 'e' },
  { id: 'rice', name: 'Rice', serve: '1 katori (150 g), cooked', p: 4, k: 195, grp: 'e' },
  { id: 'ghee', name: 'Ghee or oil', serve: '1 teaspoon (5 g)', p: 0, k: 45, cue: 'Count what goes on the roti or in the tadka', grp: 'e' }];
export const FOOD_BY = Object.fromEntries(FOODS.map(f => [f.id, f]));

export const DEFAULT_SETTINGS = {
  proteinGoal: 85, proteinGoalHi: 90, kcalTarget: null, vegGoal: 5,
  sessionsGoal: 5, restDow: 3,
  targetWeight: null, startWeight: null, vfGoal: 10, lastInbody: null, retestWeeks: 5,
  maxLossPerWeek: 1, whrLimit: 0.85, strengthDrop: 0.1 };
