// Everything FitHit "knows": machines, cues, the weekly plan, foods and default targets.
// Personal numbers (weights, targets) are NOT stored here: they live in your Supabase settings.

export const GROUPS = [
  { id: 'cardio', label: 'Cardio', hint: 'Tick the machine, then type the kcal from its screen. Machine readings tend to run high, so use them to compare sessions, not as exact burn.' },
  { id: 'upper', label: 'Upper body' }, { id: 'lower', label: 'Lower body' }, { id: 'core', label: 'Core' }, { id: 'free', label: 'Free weights' },
  { id: 'func', label: 'Functional & endurance', hint: 'Everyday-strength moves done for time or reps. Knee- and back-friendly versions.' }];
export const GROUP_LABEL = { cardio: 'Cardio', upper: 'Upper', lower: 'Lower', core: 'Core', free: 'Free weights', func: 'Functional' };

// load: true = log kg × reps; 'time' = hold or carry (seconds); 'reps' = bodyweight reps
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
  { id: 'face_pull', name: 'Face pull (cable or band)', g: 'upper', m: ['Shoulders', 'Back'], load: true },
  { id: 'calf', name: 'Calf raise', g: 'lower', m: ['Legs'], load: true },
  { id: 'dead_bug', name: 'Dead bug', g: 'core', m: ['Core'] }, { id: 'bird_dog', name: 'Bird dog', g: 'core', m: ['Core'] },
  { id: 'plank', name: 'Forearm plank', g: 'core', m: ['Core'], load: 'time' },
  { id: 'crunch', name: 'Crunch machine', g: 'core', m: ['Core'], paused: 'Paused for now: strains lower back' },
  { id: 'back_ext', name: 'Back extension', g: 'core', m: ['Core', 'Back'], paused: 'Paused for now: stresses lower back' },
  { id: 'db_bench', name: 'Dumbbell bench press', g: 'free', m: ['Chest', 'Arms'], load: true },
  { id: 'db_row', name: 'One-arm dumbbell row', g: 'free', m: ['Back', 'Arms'], load: true },
  { id: 'db_shoulder', name: 'Seated dumbbell shoulder press', g: 'free', m: ['Shoulders'], load: true },
  { id: 'db_lateral', name: 'Seated dumbbell lateral raise', g: 'free', m: ['Shoulders'], load: true },
  { id: 'db_fly', name: 'Dumbbell fly', g: 'free', m: ['Chest'], load: true },
  { id: 'db_curl', name: 'Dumbbell bicep curl', g: 'free', m: ['Arms'], load: true },
  { id: 'db_hammer', name: 'Hammer curl', g: 'free', m: ['Arms'], load: true },
  { id: 'db_ohtri', name: 'Seated overhead tricep extension', g: 'free', m: ['Arms'], load: true },
  { id: 'glute_bridge', name: 'Glute bridge', g: 'free', m: ['Legs', 'Core'], load: true },
  { id: 'goblet_box', name: 'Goblet squat to a high box', g: 'free', m: ['Legs'], load: true },
  { id: 'db_rdl', name: 'Dumbbell Romanian deadlift', g: 'free', m: ['Legs', 'Back'], paused: 'Paused for now: loads lower back', load: true },
  { id: 'goblet_squat', name: 'Goblet squat', g: 'free', m: ['Legs'], load: true },
  { id: 'db_reverse_lunge', name: 'Dumbbell reverse lunge', g: 'free', m: ['Legs'], load: true },
  { id: 'db_step_up', name: 'Dumbbell step-up (low step)', g: 'free', m: ['Legs'], load: true },
  { id: 'kb_swing', name: 'Kettlebell swing', g: 'free', m: ['Legs', 'Back'], load: true },
  { id: 'db_incline_row', name: 'Chest-supported dumbbell row', g: 'free', m: ['Back', 'Arms'], load: true },
  { id: 'db_floor_press', name: 'Dumbbell floor press', g: 'free', m: ['Chest', 'Arms'], load: true },
  { id: 'landmine_press', name: 'Half-kneeling landmine press', g: 'free', m: ['Shoulders', 'Chest'], load: true },
  { id: 'db_reverse_fly', name: 'Chest-supported reverse fly', g: 'free', m: ['Shoulders', 'Back'], load: true },
  { id: 'zottman_curl', name: 'Zottman curl', g: 'free', m: ['Arms'], load: true },
  { id: 'db_skull', name: 'Dumbbell skull crusher', g: 'free', m: ['Arms'], load: true },
  { id: 'db_shrug', name: 'Dumbbell shrug', g: 'free', m: ['Back'], load: true },
  { id: 'free_weights', name: 'Other free weights (tick only)', g: 'free', m: [] },
  { id: 'farmer_carry', name: 'Farmer\u2019s carry', g: 'func', m: ['Core', 'Arms'], load: 'time' },
  { id: 'suitcase_carry', name: 'Suitcase carry', g: 'func', m: ['Core'], load: 'time' },
  { id: 'incline_pushup', name: 'Incline push-up', g: 'func', m: ['Chest', 'Arms'], load: 'reps' },
  { id: 'sit_to_stand', name: 'Sit-to-stand from a bench', g: 'func', m: ['Legs'], load: 'reps' },
  { id: 'mountain_slow', name: 'Slow mountain climbers (hands on bench)', g: 'func', m: ['Core', 'Cardio'], load: 'time' },
  { id: 'bear_hold', name: 'Bear hold', g: 'func', m: ['Core'], load: 'time' },
  { id: 'side_plank', name: 'Side plank', g: 'func', m: ['Core'], load: 'time' },
  { id: 'shadow_box', name: 'Shadow boxing', g: 'func', m: ['Cardio', 'Shoulders'], load: 'time' }];
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
  cross_trainer: 'Smooth pace, stand tall', treadmill: 'Walk only, 3\u20136% incline',
  db_bench: 'Forearms vertical, lower slowly', db_row: 'Bench supports your back', db_shoulder: 'Back against the bench',
  db_fly: 'Light weight, soft elbows', db_curl: 'Elbows pinned to your sides', db_hammer: 'Palms face each other',
  db_ohtri: 'Seated with back support', glute_bridge: 'Knee- and back-friendly', goblet_box: 'High box only: knee bend about 60\u00b0',
  farmer_carry: '30\u201340 s, walk tall', suitcase_carry: '20\u201330 s per side, don\u2019t lean', incline_pushup: 'Hands on a bench, body straight',
  sit_to_stand: 'High bench, knee bend about 60\u00b0', mountain_slow: 'Slow knee drives, 30 s', bear_hold: 'Knees 2 cm off the floor, 20 s',
  side_plank: 'On knees if needed, 15\u201320 s a side', shadow_box: 'Light on your feet, 1 min rounds',
  goblet_squat: 'Chest tall, heels down', db_reverse_lunge: 'Step back, front knee over the ankle', db_step_up: 'Low step, whole foot on it',
  kb_swing: 'Hips drive it, arms only guide', db_incline_row: 'Chest stays on the bench', db_floor_press: 'Elbows touch the floor lightly, about 45\u00b0 out',
  landmine_press: 'Press up and forward, ribs down', db_reverse_fly: 'Light, squeeze shoulder blades together', zottman_curl: 'Up palms-up, down palms-down, slowly',
  db_skull: 'Elbows point at the ceiling', db_shrug: 'Straight up and down, no rolling', face_pull: 'Pull to your eyes, elbows high' };

/* ---------- workout order (b) ----------
   1 = big multi-joint moves, 2 = single-muscle, 3 = small arm muscles, 4 = core, 5 = functional, 9 = cardio.
   Bigger muscles first while you're fresh; small muscles that help the big lifts come after; core last so it
   can steady you through everything before; cardio after weights so you lift with full energy. */
export const RANK = {
  chest_press: 1, lat_pulldown: 1, shoulder_press: 1, leg_press: 1, smith: 1, db_bench: 1, db_row: 1, db_shoulder: 1, goblet_box: 1, db_rdl: 1,
  pullover: 2, dip: 2, pec_deck: 2, leg_ext: 2, hip_abd: 2, hip_add: 2, calf: 2, db_lateral: 2, db_fly: 2, glute_bridge: 2,
  bicep_curl: 3, tricep_ext: 3, db_curl: 3, db_hammer: 3, db_ohtri: 3, free_weights: 3,
  goblet_squat: 1, db_reverse_lunge: 1, kb_swing: 1, db_incline_row: 1, db_floor_press: 1, landmine_press: 1,
  db_step_up: 2, db_reverse_fly: 2, face_pull: 2, db_shrug: 2, zottman_curl: 3, db_skull: 3,
  dead_bug: 4, bird_dog: 4, plank: 4, crunch: 4, back_ext: 4,
  farmer_carry: 5, suitcase_carry: 5, incline_pushup: 5, sit_to_stand: 5, mountain_slow: 5, bear_hold: 5, side_plank: 5, shadow_box: 5 };
export const RANK_WHY = {
  1: 'Big multi-joint move: first, while you\u2019re fresh', 2: 'Works one muscle: after the big moves',
  3: 'Small arm muscle: last of the weights, the big moves already tired it', 4: 'Core: near the end, so it steadied you through the lifts',
  5: 'Functional: after weights, before cardio' };
/** Minutes one exercise takes: 3 sets x (about 40 s work + rest) + setting up the machine. */
export const MINUTES = { lift: 6, core: 4 };

/* ---------- how-to guides (c, d, e) ----------
   s = set-up, st = steps, a = common mistake to avoid. Standard technique as taught by ACE / NASM trainers,
   adjusted to the knee and back limits in CUES. Video and picture links open a search, not a fixed clip. */
export const GUIDE = {
  treadmill: { s: 'Stand on the side rails, clip the safety key to your clothing, then start the belt at a slow walk.', st: ['Step on and walk in the middle of the belt; let go of the rails once you\u2019re steady.', 'Raise to a brisk walk (about 5\u20136 km/h), then set the incline to 3\u20136%.', 'Stand tall, take short natural steps and let your arms swing.', 'To finish, lower incline and speed for 2\u20133 minutes before stopping.'], a: 'Holding the rails on an incline: it takes away most of the work.' },
  cross_trainer: { s: 'Hold the fixed handles, step onto the pedals and choose a low resistance.', st: ['Push and pull the moving handles as your legs go round.', 'Keep your whole foot on the pedal, heels down.', 'Stand tall with your tummy lightly braced; add resistance once 5 minutes feels easy.'], a: 'Leaning on the handles or letting your heels lift.' },
  upright_bike: { s: 'Seat height: with the pedal at the bottom, your knee should still be slightly bent. Handlebars at an easy reach.', st: ['Put the balls of your feet over the pedal centres and tighten the straps.', 'Warm up at a light resistance, about 70\u201390 turns a minute.', 'Raise the resistance until you breathe faster but can still talk.'], a: 'Seat too low, so the knee bends sharply at the top: this loads the knee.' },
  recumbent_bike: { s: 'Slide the seat so your knee stays slightly bent when the pedal is furthest away. Sit back against the backrest.', st: ['Strap your feet in and start at a light resistance.', 'Pedal smoothly at 70\u201390 turns a minute.', 'For intervals: 2 minutes easy, 1 minute harder, repeat.'], a: 'Sitting so close that your knees come up near your chest.' },
  rower: { s: 'Strap your feet across the widest part of the foot; set the damper (side lever) to 3\u20135.', st: ['Push with your legs first, then lean back slightly, then pull the handle to your lower ribs.', 'Return in reverse: arms out, lean forward, then bend your knees to slide back.', 'Quick push, slow return.'], a: 'Pulling with your arms before your legs have pushed.' },
  chest_press: { s: 'Set the seat so the handles line up with the middle of your chest. Back and head on the pad, feet flat.', st: ['Hold the handles with straight wrists.', 'Breathe out and press forward until your arms are almost straight. Don\u2019t lock the elbows.', 'Breathe in and come back slowly over 2\u20133 seconds, until you feel a light stretch across the chest.'], a: 'Shoulders rolling forward off the pad, or bouncing at the end of the return.' },
  pec_deck: { s: 'Set the seat so your upper arms are level with your shoulders, elbows slightly bent. Back on the pad.', st: ['Bring the pads or handles together in front of your chest in a wide arc.', 'Pause for 1 second.', 'Open slowly until you feel a gentle stretch across the chest.'], a: 'Opening so far that the front of the shoulder feels pulled.' },
  shoulder_press: { s: 'Set the seat so the handles start at about shoulder height. Back flat on the pad.', st: ['Breathe out and press up until your arms are nearly straight.', 'Lower slowly back to shoulder height.'], a: 'Arching your lower back off the pad to push the weight up.' },
  lat_pulldown: { s: 'Set the knee pad so your thighs fit snugly underneath. Hold the bar a little wider than your shoulders.', st: ['Sit tall, chest up, leaning back very slightly.', 'Pull the bar down to the top of your chest, leading with your elbows.', 'Squeeze your shoulder blades together, then let the bar rise slowly until your arms are straight.'], a: 'Pulling the bar behind your neck, or swinging your body back.' },
  pullover: { s: 'Set the seat so your shoulders line up with the machine\u2019s pivot point. Elbows on the pads, back on the backrest.', st: ['Start with your arms up and back.', 'Push the pads down in an arc with your elbows, towards your tummy.', 'Return slowly to the start.'], a: 'Lower back lifting off the pad.' },
  bicep_curl: { s: 'Set the seat so your upper arms lie flat on the pad and your elbows line up with the pivot.', st: ['Curl the handles up towards your shoulders.', 'Squeeze for 1 second, then lower slowly until your arms are nearly straight.'], a: 'Lifting your elbows off the pad or rocking your body.' },
  tricep_ext: { s: 'Set the seat so your elbows line up with the pivot and your upper arms rest on the pad.', st: ['Push the handles until your arms are straight.', 'Return slowly until your elbows are bent to about a right angle.'], a: 'Letting your elbows drift apart.' },
  dip: { s: 'Assisted dip: kneel on the pad; more weight on the stack means more help. Seated dip machine: set the seat so the handles are at your sides.', st: ['Keep your shoulders down, away from your ears, chest up.', 'Press down until your arms are straight.', 'Come back slowly until your elbows reach a right angle, no deeper.'], a: 'Shrugging, or going deeper than a right angle at the elbow.' },
  leg_press: { s: 'Back and hips flat on the pad. Feet hip-width apart in the middle of the platform, knees pointing the same way as your toes.', st: ['Push through your whole foot to straighten your legs, stopping just before the knees lock.', 'Release the safety handles, then lower slowly until your knees bend to about 60\u00b0 (your limit).', 'Push back up, breathing out.', 'Put the safety handles back before you get off.'], a: 'Going so low that your hips curl off the pad, or snapping the knees straight.' },
  leg_ext: { s: 'Back on the pad, knee joint level with the machine\u2019s pivot, ankle pad just above your ankles.', st: ['Lift the pad by straightening your knees, for you only to half-straight.', 'Lower slowly.'], a: 'Kicking the weight up quickly.' },
  hip_abd: { s: 'Sit with your back on the pad and the pads on the outside of your knees.', st: ['Push your legs apart slowly and pause for 1 second.', 'Come back slowly without letting the weights touch.'], a: 'Leaning forward or using a swing.' },
  hip_add: { s: 'Sit with your back on the pad and the pads on the inside of your knees, legs apart.', st: ['Squeeze your legs together slowly and pause for 1 second.', 'Open slowly, only as far as is comfortable.'], a: 'Starting with the legs opened too wide.' },
  calf: { s: 'Balls of your feet on the edge of the step, heels hanging off. Pads on your shoulders (standing) or thighs (seated).', st: ['Rise up onto your toes as high as you can and pause for 1 second.', 'Lower slowly until your heels are just below the step.'], a: 'Bouncing at the bottom.' },
  smith: { s: 'Bar resting on your upper back, feet a little in front of the bar.', st: ['Unhook the bar by turning it.', 'Bend your knees and hips to lower, then stand back up.', 'Turn the bar to hook it again.'], a: 'Paused for you: it loads the knee and spine.' },
  dead_bug: { s: 'Lie on your back, arms pointing at the ceiling, knees bent at a right angle above your hips.', st: ['Press your lower back gently into the floor.', 'Breathing out, slowly lower one arm and the opposite leg towards the floor.', 'Come back and switch sides. 8\u201310 per side.'], a: 'Lower back arching off the floor. If it does, make the movement smaller.' },
  bird_dog: { s: 'On hands and knees, hands under shoulders, knees under hips.', st: ['Reach one arm forward and the opposite leg back until both are level with your body.', 'Hold for 2 seconds with your hips level, then come back.', '8\u201310 per side.'], a: 'Twisting the hips or arching the back.' },
  plank: { s: 'Forearms on the floor, elbows under your shoulders.', st: ['Lift into a straight line from head to heels, or from head to knees for an easier version.', 'Squeeze your glutes and tummy and keep breathing.', 'Hold for 20\u201330 seconds.'], a: 'Hips sagging down or sticking up.' },
  crunch: { s: 'Set the seat so the chest pad sits on your upper chest.', st: ['Curl forward by bringing your ribs towards your hips.', 'Return slowly.'], a: 'Paused for you: it strains the lower back.' },
  back_ext: { s: 'Hip pad just below your hip bones, feet locked in.', st: ['Lower your upper body slowly.', 'Lift until your body is in a straight line, no further.'], a: 'Paused for you: it stresses the lower back.' },
  db_bench: { s: 'Sit on a flat bench with the dumbbells on your thighs. Lie back and bring them to the sides of your chest.', st: ['Press up until your arms are nearly straight above your chest.', 'Lower slowly until your elbows are just below the bench, forearms upright.'], a: 'Dumbbells drifting over your face, or elbows flared straight out to the sides.' },
  db_row: { s: 'One hand and the same-side knee on a flat bench, back flat. Dumbbell in the other hand, arm hanging straight.', st: ['Pull the dumbbell up to your hip, elbow close to your side.', 'Lower slowly until your arm is straight.', 'Do all the reps, then switch sides.'], a: 'Rounding your back or twisting your body to lift.' },
  db_shoulder: { s: 'Set the bench upright and sit with your back against it. Dumbbells at shoulder height, palms facing forward.', st: ['Press up until your arms are nearly straight.', 'Lower slowly back to shoulder height.'], a: 'Arching away from the backrest.' },
  db_lateral: { s: 'Sit upright with back support, a light dumbbell in each hand at your sides.', st: ['Lift your arms out to the sides to shoulder height, elbows slightly bent.', 'Lower slowly over 2\u20133 seconds.'], a: 'Swinging the weights or shrugging your shoulders.' },
  db_fly: { s: 'Lie on a flat bench with the dumbbells above your chest, palms facing each other.', st: ['Keeping a soft bend in your elbows, open your arms in a wide arc until you feel a stretch across the chest.', 'Bring them back together over your chest.'], a: 'Lowering too far, or straightening the arms. Keep the weights light.' },
  db_curl: { s: 'Stand or sit tall with the dumbbells at your sides, palms facing forward.', st: ['Curl both dumbbells up, elbows staying at your sides.', 'Lower slowly until your arms are straight.'], a: 'Swinging your body to lift the weight.' },
  db_hammer: { s: 'Stand or sit tall with the dumbbells at your sides, palms facing your body.', st: ['Curl up keeping your palms facing each other, as if holding a hammer.', 'Lower slowly.'], a: 'Elbows moving forward as you lift.' },
  db_ohtri: { s: 'Sit with back support. Hold one dumbbell with both hands straight above your head.', st: ['Lower it behind your head by bending only your elbows.', 'Straighten your arms to lift it back up.'], a: 'Elbows flaring out wide: keep them pointing forward.' },
  glute_bridge: { s: 'Lie on your back, knees bent, feet flat and hip-width apart. Optional: a dumbbell resting on your hips.', st: ['Squeeze your glutes and lift your hips until your body is straight from knees to shoulders.', 'Hold for 1\u20132 seconds, then lower slowly.'], a: 'Pushing through your toes or over-arching your lower back.' },
  goblet_box: { s: 'Hold one dumbbell upright against your chest. Stand just in front of a high box or bench, feet shoulder-width.', st: ['Sit back and down until you lightly touch the box.', 'Stand up by pushing through your whole foot.'], a: 'A low box: keep your knee bend to about 60\u00b0, the same limit as the leg press.' },
  db_rdl: { s: 'Stand holding the dumbbells in front of your thighs.', st: ['Push your hips back with a flat back until you feel a hamstring stretch.', 'Stand back up by squeezing your glutes.'], a: 'Paused for you: it loads the lower back.' },
  farmer_carry: { s: 'Pick up a fairly heavy dumbbell in each hand, bending your knees, not your back. Stand tall.', st: ['Walk with short, steady steps for 30\u201340 seconds.', 'Keep your shoulders down and tummy braced.', 'Bend your knees to put the weights down. Rest 60 seconds.'], a: 'Leaning to one side or rounding your shoulders.' },
  suitcase_carry: { s: 'Hold one dumbbell in one hand only, the other hand free.', st: ['Walk tall for 20\u201330 seconds without leaning towards the weight.', 'Switch hands and repeat.'], a: 'Tipping sideways: your core\u2019s job is to stop that.' },
  incline_pushup: { s: 'Hands on a bench or a racked bar, a little wider than your shoulders. Walk your feet back so your body is straight.', st: ['Lower your chest towards the bench, elbows at about 45\u00b0 from your body.', 'Push back up. The higher the hands, the easier it is.'], a: 'Hips sagging, or the head poking forward.' },
  sit_to_stand: { s: 'Sit near the front of a high bench, feet flat and hip-width apart, arms crossed or reaching forward.', st: ['Lean forward slightly and stand up through your whole foot.', 'Sit back down slowly, lightly touching the bench.'], a: 'A low bench: keep your knee bend to about 60\u00b0.' },
  mountain_slow: { s: 'Hands on a bench, body in a straight line like an incline push-up.', st: ['Bring one knee towards your chest, then put it back.', 'Alternate legs at a steady pace for 30 seconds.'], a: 'Bouncing your hips up and down.' },
  bear_hold: { s: 'On hands and knees, hands under shoulders, knees under hips, toes tucked under.', st: ['Brace your tummy and lift your knees 2\u20133 cm off the floor.', 'Hold for 15\u201320 seconds, breathing normally.'], a: 'Holding your breath or letting your back sag.' },
  side_plank: { s: 'Lie on your side, elbow under your shoulder. Knees bent for the easier version.', st: ['Lift your hips so your body makes a straight line.', 'Hold 15\u201320 seconds, then switch sides.'], a: 'Hips dropping towards the floor.' },
  goblet_squat: { s: 'Hold one dumbbell upright against your chest, elbows tucked. Feet shoulder-width, toes turned out slightly.', st: ['Sit your hips back and down between your heels, chest tall.', 'Go only as low as you can keep your heels down and back flat.', 'Push through your whole foot to stand up.'], a: 'Heels lifting or knees caving in towards each other.' },
  db_reverse_lunge: { s: 'Stand tall with a light dumbbell in each hand at your sides.', st: ['Take a long step backwards and lower your back knee towards the floor.', 'Keep your front knee over your ankle and your chest upright.', 'Push through the front heel to step back to standing. Alternate legs.'], a: 'Front knee shooting past the toes, or leaning forward.' },
  db_step_up: { s: 'Use a low, stable step or bench (knee no higher than your hip). Dumbbells at your sides.', st: ['Put your whole foot on the step.', 'Push through that heel to stand up on the step; don\u2019t push off the back foot.', 'Step down slowly with the same leg. Do all reps, then switch.'], a: 'A step that\u2019s too high, or bouncing off the bottom foot.' },
  kb_swing: { s: 'Feet a little wider than your hips, kettlebell on the floor just in front of you.', st: ['Hinge at the hips with a flat back and grip the handle with both hands.', 'Hike the bell back between your legs, then snap your hips forward to stand tall.', 'Let the bell float to chest height, arms relaxed; let it swing back down and hinge again.'], a: 'Squatting the movement or lifting with your arms: the power comes from your hips.' },
  db_incline_row: { s: 'Set a bench to about 30\u201345\u00b0. Lie face down with your chest on the pad, a dumbbell in each hand hanging straight.', st: ['Pull both dumbbells up towards your lower ribs, elbows close to your sides.', 'Squeeze your shoulder blades together for 1 second.', 'Lower slowly until your arms are straight.'], a: 'Lifting your chest off the pad to heave the weight.' },
  db_floor_press: { s: 'Lie on the floor, knees bent, a dumbbell in each hand above your chest.', st: ['Lower the dumbbells until your upper arms lightly touch the floor, elbows about 45\u00b0 from your body.', 'Pause, then press back up.'], a: 'Bouncing your elbows off the floor.' },
  landmine_press: { s: 'Wedge one end of a barbell in a corner or landmine holder. Kneel on one knee and hold the other end at shoulder height in the opposite hand.', st: ['Brace your tummy and press the bar up and forward until your arm is straight.', 'Lower it back to your shoulder slowly.', 'Do all reps, then switch sides.'], a: 'Leaning back or arching your lower back as you press.' },
  db_reverse_fly: { s: 'Lie face down on a bench set to about 30\u201345\u00b0, a light dumbbell in each hand.', st: ['With a soft bend in your elbows, raise your arms out to the sides to shoulder level.', 'Squeeze your shoulder blades together, then lower slowly.'], a: 'Using weights that are too heavy and shrugging to lift them.' },
  zottman_curl: { s: 'Stand or sit tall, dumbbells at your sides, palms facing forward.', st: ['Curl up with your palms facing up.', 'At the top, turn your palms to face down.', 'Lower slowly with palms down, then turn them back up at the bottom.'], a: 'Rushing the slow lowering part, which does most of the work.' },
  db_skull: { s: 'Lie on a flat bench with a dumbbell in each hand, arms straight above your shoulders, palms facing each other.', st: ['Bending only your elbows, lower the dumbbells beside your head.', 'Straighten your arms to lift them back up.'], a: 'Elbows flaring out or moving forward and back.' },
  db_shrug: { s: 'Stand tall with a dumbbell in each hand at your sides.', st: ['Lift your shoulders straight up towards your ears.', 'Hold for 1 second, then lower slowly.'], a: 'Rolling your shoulders in circles or bending your elbows.' },
  face_pull: { s: 'Set a cable rope (or tie a band) at about face height. Hold the ends with your thumbs pointing back.', st: ['Step back so your arms are straight and there\u2019s some tension.', 'Pull the rope towards your eyes, elbows high and out to the sides.', 'Squeeze your shoulder blades, then return slowly.'], a: 'Leaning back or pulling down to your chest.' },
  shadow_box: { s: 'Stand with feet shoulder-width, one foot slightly forward, hands up by your chin.', st: ['Throw light, quick punches: straight, cross, hook.', 'Stay light on your feet and keep moving.', '1-minute rounds, 30 seconds rest.'], a: 'Locking your elbows hard at the end of a punch.' } };
export const demoLinks = name => ({
  video: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + ' proper form beginner'),
  pics: 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(name + ' exercise form') });

/* ---------- Functional endurance circuit (e) ---------- */
export const CIRCUIT = { title: 'Endurance circuit', rounds: 3, work: 40, rest: 20, roundRest: 60,
  items: ['farmer_carry', 'incline_pushup', 'sit_to_stand', 'mountain_slow', 'shadow_box'],
  why: 'Endurance means repeating moderate effort with short rests, so your heart and muscles learn to keep going. Each move works a different area, so one rests while the next works.' };

export const PROGRESSION = { repTop: 15, repBottom: 12, sets: 3 };
export const PAIN_RULE = 'Stop for sharp pain, pain that builds during a set, or swelling the next day.';

const RX = [{ label: 'Sets', value: '3' }, { label: 'Reps', value: '12\u201315' }, { label: 'Rest', value: '60 s' }, { label: 'Cardio', value: '40 min' }];
const LEGS = ['leg_press', 'hip_abd', 'hip_add', 'leg_ext', 'calf', 'dead_bug', 'bird_dog', 'plank'];
const WU = '10 min easy bike warm-up. Weights first, then ';
export const SESSIONS = {
  upperA: { focus: 'upper', title: 'Upper body A', rx: RX, note: WU + '40 min on either bike.', cardio: 40, items: ['chest_press', 'lat_pulldown', 'shoulder_press', 'pec_deck', 'bicep_curl', 'tricep_ext', 'recumbent_bike', 'upright_bike'] },
  legs: { focus: 'lower', title: 'Legs (knee-safe) + core', rx: RX, note: WU + '40 min cross trainer.', cardio: 40, items: LEGS.concat(['cross_trainer']) },
  upperB: { focus: 'upper', title: 'Upper body B', rx: RX, note: WU + '40 min recumbent bike.', cardio: 40, items: ['lat_pulldown', 'pullover', 'chest_press', 'dip', 'db_lateral', 'bicep_curl', 'tricep_ext', 'recumbent_bike'] },
  legs2: { focus: 'lower', title: 'Legs (knee-safe) + core', rx: RX, note: WU + '40 min incline walk or cross trainer.', cardio: 40, items: LEGS.concat(['treadmill', 'cross_trainer']) },
  // Cardio day: cardio machines only, nothing else (v4.1).
  saturday: { focus: 'cardio', title: 'Cardio', rx: [{ label: 'Total', value: '1 hr' }, { label: 'Cardio', value: '45 min' }, { label: 'Pace', value: 'Intervals' }], note: '10 min easy warm-up, then 45 min intervals on the bikes or cross trainer. Cardio only today.', cardio: 45, cardioFocus: true, items: ['recumbent_bike', 'upright_bike', 'cross_trainer'], cues: { recumbent_bike: '2 min easy, 1 min harder \u00d7 10\u201312 rounds', upright_bike: '2 min easy, 1 min harder \u00d7 10\u201312 rounds', cross_trainer: '3 min easy, 1 min harder, or steady at a pace where you can talk' } },
  // Strength day: big compound moves, machines and free weights, whole body (v4.1).
  strength: { focus: 'strength', title: 'Strength training', rx: [{ label: 'Sets', value: '3' }, { label: 'Reps', value: '8\u201312' }, { label: 'Rest', value: '90 s' }, { label: 'Cardio', value: '15 min' }], note: '10 min easy bike warm-up. Big moves for the whole body with machines and free weights, then 15 min easy cardio.', cardio: 15, items: ['leg_press', 'goblet_box', 'chest_press', 'lat_pulldown', 'db_incline_row', 'db_floor_press', 'glute_bridge', 'plank', 'cross_trainer'] },
  rest: { rest: true, title: 'Rest day', note: 'Muscle rebuilds on rest days. A relaxed walk is fine. If you do go in, keep it to cardio only.' },
  sunday: { rest: true, title: 'Holiday', note: 'Sunday off. Enjoy it.' } };
/* v4.1: a fixed pattern of day types. The four weekday training days run Lower, Upper, Cardio, Strength in that order
   (the rest day is skipped); Saturday is Cardio and Sunday is off. Any day's type can be changed from the Log tab. */
export const DAY_TYPES = [{ id: 'lower', label: 'Lower body' }, { id: 'upper', label: 'Upper body' }, { id: 'cardio', label: 'Cardio' }, { id: 'strength', label: 'Strength training' }];
export const DAY_TYPE_LABEL = Object.fromEntries(DAY_TYPES.map(t => [t.id, t.label]));
export const WEEKDAY_PATTERN = ['lower', 'upper', 'cardio', 'strength'];
const SATURDAY_TYPE = 'cardio';
/** Day type for a weekday (0 = Sun): one of DAY_TYPES ids, 'rest' or 'holiday'. restDow is the weekday rest day (1–5). */
export function dayTypeFor(dow, restDow = 3) {
  if (dow === 0) return 'holiday';
  if (dow === 6) return SATURDAY_TYPE;
  if (dow === restDow) return 'rest';
  return WEEKDAY_PATTERN[[1, 2, 3, 4, 5].filter(d => d !== restDow).indexOf(dow)];
}
/** Session for a day type. week alternates the A/B versions of the upper and lower days for variety. */
export function sessionForType(type, week = 0) {
  const odd = Math.abs(week) % 2 === 1;
  if (type === 'upper') return odd ? SESSIONS.upperB : SESSIONS.upperA;
  if (type === 'lower') return odd ? SESSIONS.legs2 : SESSIONS.legs;
  if (type === 'cardio') return SESSIONS.saturday;
  if (type === 'strength') return SESSIONS.strength;
  return type === 'holiday' ? SESSIONS.sunday : SESSIONS.rest;
}
/** Session for a weekday (0 = Sun). restDow is the weekday rest day (1–5). */
export function planFor(dow, restDow = 3, week = 0) { return sessionForType(dayTypeFor(dow, restDow), week); }
/** The weekly plan before v4.1 (Upper A, Legs, Upper B, Legs, Saturday cardio). Only used to name older saved days. */
export function legacyPlanFor(dow, restDow = 3) {
  if (dow === 0) return SESSIONS.sunday;
  if (dow === 6) return { title: 'Cardio intervals + core' };
  if (dow === restDow) return SESSIONS.rest;
  return SESSIONS[['upperA', 'legs', 'upperB', 'legs2'][[1, 2, 3, 4, 5].filter(d => d !== restDow).indexOf(dow)]];
}
/** Which exercises belong on a day type, for the "Other exercises" list. Lifting days keep cardio for the finish. */
const UPPER_M = ['Chest', 'Back', 'Shoulders', 'Arms'];
export function fitsDayType(m, type) {
  if (!m || !DAY_TYPE_LABEL[type]) return true;
  if (m.g === 'cardio') return true;
  if (type === 'cardio') return false;
  if (type === 'strength') return true;
  const mus = m.m || [];
  if (type === 'upper') return m.g === 'upper' || (m.g !== 'lower' && m.g !== 'core' && mus.some(x => UPPER_M.includes(x)) && !mus.includes('Legs'));
  return m.g === 'lower' || m.g === 'core' || mus.includes('Legs') || (m.g === 'func' && mus.every(x => x === 'Core' || x === 'Cardio')); // lower body + core
}

export const DAYNAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio'];
export const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const MEALS = [{ id: 'b', label: 'Breakfast', share: 0.3 }, { id: 'l', label: 'Lunch', share: 0.3 }, { id: 's', label: 'Snack', share: 0.1 }, { id: 'd', label: 'Dinner', share: 0.3 }];

// p = grams protein, k = kcal per serving. gw = grams (or ml) in one serving, so FitHit can work out any weight;
// unit = what one serving is called when it isn't weighed (egg, scoop). Estimates for home-cooked portions (verified Oct 2026 against IFCT-based and label sources).
export const FOODS = [
  { id: 'soya', name: 'Soya chunks', serve: '30 g dry', gw: 30, p: 15, k: 105, cue: 'Keep to 50 g dry a day', grp: 'p' },
  { id: 'paneer', name: 'Paneer', serve: '50 g', gw: 50, p: 9, k: 135, cue: 'High in fat: 2 servings = 270 kcal', grp: 'p' },
  { id: 'egg', name: 'Whole egg', serve: '1 large', unit: 'egg', p: 6, k: 72, grp: 'p' },
  { id: 'egg_white', name: 'Egg white', serve: '1 large', unit: 'white', p: 3.5, k: 17, cue: 'Most protein per kcal on this list', grp: 'p' },
  { id: 'whey', name: 'Whey protein', serve: '1 scoop (about 30 g)', unit: 'scoop', p: 24, k: 120, cue: 'Brands differ: check your tub and add it under My foods if it\u2019s different', grp: 'p' },
  { id: 'hung_curd', name: 'Hung curd', serve: '100 g', gw: 100, p: 8, k: 100, grp: 'p' },
  { id: 'chana', name: 'Roasted chana', serve: '30 g, a handful', gw: 30, p: 6, k: 110, grp: 'p' },
  { id: 'dal', name: 'Dal', serve: '1 katori (150 g), cooked', gw: 150, p: 7, k: 145, grp: 'p' },
  { id: 'rajma', name: 'Rajma or chole', serve: '1 katori (150 g), cooked', gw: 150, p: 8, k: 150, grp: 'p' },
  { id: 'besan_chilla', name: 'Besan chilla', serve: '1, from 30 g besan', unit: 'chilla', p: 6.5, k: 150, grp: 'p' },
  { id: 'peanuts', name: 'Peanuts', serve: '30 g', gw: 30, p: 7.5, k: 170, grp: 'p' },
  { id: 'milk', name: 'Milk (toned)', serve: '1 glass, 200 ml', gw: 200, p: 6.5, k: 120, grp: 'e' },
  { id: 'curd', name: 'Curd (dahi)', serve: '1 katori, 150 g', gw: 150, p: 5, k: 90, grp: 'e' },
  { id: 'roti', name: 'Roti', serve: '1 medium (40 g), no ghee', gw: 40, p: 3, k: 120, grp: 'e' },
  { id: 'rice', name: 'Rice', serve: '1 katori (150 g), cooked', gw: 150, p: 4, k: 195, grp: 'e' },
  { id: 'ghee', name: 'Ghee or oil', serve: '1 teaspoon (5 g)', gw: 5, p: 0, k: 45, cue: 'Count what goes on the roti or in the tadka', grp: 'e' }];
export const FOOD_BY = Object.fromEntries(FOODS.map(f => [f.id, f]));

export const DEFAULT_SETTINGS = {
  proteinGoal: 85, proteinGoalHi: 90, kcalTarget: null, vegGoal: 5,
  sessionsGoal: 5, restDow: 3,
  targetWeight: null, startWeight: null, vfGoal: 10, lastInbody: null, retestWeeks: 5,
  maxLossPerWeek: 1, whrLimit: 0.85, strengthDrop: 0.1, myFoods: [],
  heightCm: null, weightKg: null, weightAt: null, sex: null, troubles: [], troubleSharp: [], troublesAsked: false, troublesAt: null };

/* ---------- Today's routine: mood, pain areas, body (v4) ---------- */
export const MOODS = [
  { id: 'heavy', label: 'Heavy workout', sets: 3, reps: '12\u201315', rest: '60\u201390 s', liftMin: 6, coreMin: 4, cardio: 20, freeAdd: 3, met: 5.0, cardioMet: 5.0,
    note: 'Today\u2019s machines at your working weight, plus free weights, then 20 min moderate cardio.' },
  { id: 'light', label: 'Light', sets: 2, reps: '15', rest: '45 s', liftMin: 4, coreMin: 3, cardio: 20, freeAdd: 2, loadPct: 0.6, met: 3.5, cardioMet: 4.0,
    note: 'Same moves at about 60% of your usual weight, fewer sets, then 20 min easy cardio. Good for a tired or busy day.' },
  { id: 'cardio', label: 'Only cardio', cardioFocus: true, coreMin: 4, met: 2.8, cardioMet: 5.0,
    note: 'Low-impact cardio machines only. No weights or mat work today.' }];
export const MOOD_BY = Object.fromEntries(MOODS.map(m => [m.id, m]));

/** Pain or trouble areas FitHit asks about. */
export const TROUBLES = [
  { id: 'knee', label: 'Knee' }, { id: 'shoulder', label: 'Shoulder / shoulder blade' }, { id: 'back', label: 'Lower back' },
  { id: 'neck', label: 'Neck' }, { id: 'wrist', label: 'Wrist' }, { id: 'elbow', label: 'Elbow' }, { id: 'ankle', label: 'Ankle' }];
export const TROUBLE_LABEL = Object.fromEntries(TROUBLES.map(t => [t.id, t.label]));

/* For each area: skip = exercises to refrain from, as [safer swap or null, why]; mod = how to change an exercise that stays.
   General, conservative guidance used by trainers for a sore or recovering joint. It is not a diagnosis or a rehab plan. */
export const TROUBLE_RULES = {
  knee: {
    skip: { smith: ['leg_press', 'deep knee bend with the bar on your back'], goblet_squat: ['goblet_box', 'deep knee bend under load'],
      db_reverse_lunge: ['glute_bridge', 'deep knee bend on one leg'], db_step_up: ['glute_bridge', 'pushes up through one bent knee'],
      rower: ['recumbent_bike', 'deep knee bend on every stroke'] },
    mod: { leg_press: 'Bend knees only to about 60\u00b0', leg_ext: 'Lift only to half-straight, light weight', goblet_box: 'High box: knee bend about 60\u00b0',
      sit_to_stand: 'High bench, knee bend about 60\u00b0', upright_bike: 'Seat high: knee slightly bent at the bottom', recumbent_bike: 'Seat far enough that the knee stays slightly bent',
      treadmill: 'Walk only, no running', shadow_box: 'Feet planted, no bouncing', kb_swing: 'Hinge at the hips, knees only soft', mountain_slow: 'Small, slow knee drives' } },
  shoulder: {
    skip: { shoulder_press: ['landmine_press', 'pressing straight overhead'], db_shoulder: ['landmine_press', 'pressing straight overhead'],
      dip: ['tricep_ext', 'deep stretch at the front of the shoulder'], pullover: ['db_incline_row', 'arms overhead under load'],
      db_ohtri: ['tricep_ext', 'arms overhead under load'], db_fly: ['db_floor_press', 'big stretch at the front of the shoulder'] },
    mod: { lat_pulldown: 'Pull to upper chest only, never behind the neck', pec_deck: 'Don\u2019t open past your chest line', chest_press: 'Elbows about 45\u00b0 from your body',
      db_bench: 'Elbows about 45\u00b0, stop at chest level', db_floor_press: 'Elbows about 45\u00b0 from your body', db_lateral: 'Light, lift only to just below shoulder height',
      incline_pushup: 'Hands high, elbows tucked in', landmine_press: 'Stop if it pinches', kb_swing: 'Arms just guide the bell, chest height only',
      side_plank: 'On your elbow, knees down', shadow_box: 'Slow punches, don\u2019t snap the arm straight', face_pull: 'Light weight, smooth', db_reverse_fly: 'Very light' } },
  back: {
    skip: { smith: ['leg_press', 'the bar loads your spine'], db_rdl: ['glute_bridge', 'bending forward under load'], kb_swing: ['glute_bridge', 'fast forward bending'],
      crunch: ['dead_bug', 'repeated curling of the spine'], back_ext: ['bird_dog', 'arching the back under load'], rower: ['cross_trainer', 'rounded back on every stroke'],
      db_row: ['db_incline_row', 'bent-over position'], goblet_squat: ['goblet_box', 'weight held in front during a deep squat'] },
    mod: { leg_press: 'Hips stay flat on the pad, shallow range', shoulder_press: 'Back flat on the pad', db_shoulder: 'Seated, back against the bench',
      farmer_carry: 'Lighter weight, stand tall', suitcase_carry: 'Light, don\u2019t lean', plank: 'On your knees, 20 s', glute_bridge: 'Don\u2019t over-arch at the top',
      db_reverse_lunge: 'Chest upright, light weight', db_step_up: 'Chest upright', db_ohtri: 'Seated with back support', goblet_box: 'Chest upright',
      treadmill: 'Walk, low incline', landmine_press: 'Ribs down, don\u2019t arch' } },
  neck: {
    skip: { db_shrug: ['db_reverse_fly', 'loads the neck muscles directly'] },
    mod: { lat_pulldown: 'Look straight ahead, never behind the neck', farmer_carry: 'Shoulders down, lighter', suitcase_carry: 'Shoulders down',
      shoulder_press: 'Head against the pad, look ahead', dead_bug: 'Head resting on the mat', plank: 'Look at the floor, neck long', landmine_press: 'Look straight ahead' } },
  wrist: {
    skip: { bear_hold: ['dead_bug', 'weight on bent wrists'], mountain_slow: ['dead_bug', 'weight on bent wrists'],
      db_skull: ['tricep_ext', 'strain on the wrist at the bottom'], zottman_curl: ['db_hammer', 'twisting the wrist under load'] },
    mod: { incline_pushup: 'On fists or push-up handles, wrists straight', bird_dog: 'On fists, wrists straight', plank: 'On your forearms',
      db_curl: 'Wrists straight, lighter', farmer_carry: 'Lighter, or use straps', suitcase_carry: 'Lighter', db_bench: 'Wrists stacked over elbows', side_plank: 'On your forearm' } },
  elbow: {
    skip: { db_skull: ['tricep_ext', 'strains the elbow'], dip: ['tricep_ext', 'strains the elbow at the bottom'], db_ohtri: ['tricep_ext', 'elbow fully bent under load'],
      zottman_curl: ['db_hammer', 'twisting the forearm under load'] },
    mod: { bicep_curl: 'Lighter, don\u2019t lock out', db_curl: 'Lighter, no swinging', tricep_ext: 'Lighter, smooth', db_hammer: 'Lighter',
      incline_pushup: 'Elbows soft at the top', farmer_carry: 'Lighter' } },
  ankle: {
    skip: { db_step_up: ['leg_press', 'balancing on one ankle'], db_reverse_lunge: ['glute_bridge', 'balancing on one ankle'], shadow_box: [null, 'bouncing on your feet'] },
    mod: { treadmill: 'Walk on a flat or low incline', cross_trainer: 'Low resistance, heels down', calf: 'Light, small range, stop if sore',
      farmer_carry: 'Short walks on a flat floor', suitcase_carry: 'Short walks', goblet_squat: 'Heels flat' } } };

/* Sharp pain today: rest the whole region instead of working around it. muscles = rest any exercise working these;
   only = the only lifts allowed; cardio = the only cardio allowed (null = any). */
export const SHARP_RULES = {
  knee: { muscles: ['Legs'], cardio: ['recumbent_bike'], rest: 'leg exercises' },
  ankle: { muscles: ['Legs'], cardio: ['recumbent_bike'], rest: 'leg exercises' },
  shoulder: { muscles: ['Chest', 'Shoulders', 'Back', 'Arms'], cardio: ['recumbent_bike', 'upright_bike', 'treadmill'], rest: 'upper-body exercises' },
  elbow: { muscles: ['Chest', 'Shoulders', 'Back', 'Arms'], cardio: ['recumbent_bike', 'upright_bike', 'treadmill'], rest: 'upper-body exercises' },
  wrist: { muscles: ['Chest', 'Shoulders', 'Back', 'Arms'], cardio: ['recumbent_bike', 'upright_bike', 'treadmill'], rest: 'upper-body exercises' },
  neck: { muscles: ['Shoulders', 'Back', 'Arms'], cardio: ['recumbent_bike', 'upright_bike', 'treadmill'], rest: 'shoulder, back and arm exercises' },
  back: { only: ['dead_bug', 'bird_dog'], cardio: ['recumbent_bike', 'treadmill'], rest: 'all lifting except two gentle core moves' } };
/** Signs that need a doctor, not a workaround. */
export const RED_FLAGS = 'Numbness, tingling, swelling, pain at night or at rest, or pain after a fall or twist: don\u2019t train that area, see a doctor.';

/** Cardio machines best-first. Knee or ankle trouble puts the seated bikes first. */
export const CARDIO_ORDER = ['recumbent_bike', 'cross_trainer', 'upright_bike', 'treadmill'];

/** Free-weight moves FitHit adds on heavy and light days, by the focus of the day. Rotates daily for variety. */
export const FREE_ADD = {
  upper: ['db_incline_row', 'db_floor_press', 'landmine_press', 'db_reverse_fly', 'face_pull', 'zottman_curl', 'db_skull', 'db_shrug'],
  lower: ['goblet_squat', 'kb_swing', 'db_reverse_lunge', 'db_step_up', 'glute_bridge'],
  full: ['goblet_squat', 'db_incline_row', 'db_floor_press', 'kb_swing', 'db_reverse_fly', 'landmine_press'],
  strength: ['kb_swing', 'db_reverse_fly', 'landmine_press', 'db_reverse_lunge', 'face_pull', 'db_step_up'] };
/** Base for heavy or light on a day without a weights session (Saturday, rest day, Sunday). */
export const FULL_BODY = ['leg_press', 'chest_press', 'lat_pulldown', 'glute_bridge', 'dead_bug', 'bird_dog'];
export const CARDIO_CORE = ['dead_bug', 'bird_dog', 'side_plank'];

/* BMI bands. WHO: 18.5 underweight line, 25 overweight, 30 obesity. Indian consensus (Misra et al., 2009): 23 overweight, 25 obesity.
   FitHit uses the Indian lines because they flag risk earlier. */
export const BMI_BANDS = { under: 18.5, over: 23, obese: 25, whoOver: 25, whoObese: 30 };
/* Waist-to-hip ratio: WHO expert consultation (2008): substantially increased risk at 0.85 or more for women, 0.90 or more for men. */
export const WHR_LIMIT = { f: 0.85, m: 0.9 };
/* MET values from the 2024 Adult Compendium of Physical Activities: warm-up bike very light 3.5 (01210), stretching mild 2.3 (02101).
   Weights: moderate effort 5.0 (02052), multiple exercises 8\u201315 reps 3.5 (02054). Core/plank 2.8 (02024).
   Cardio: elliptical moderate 5.0 (02048) and bike 60 W 5.0 (01216); easy bike 50 W 4.0 (01214). kcal = MET \u00d7 kg \u00d7 hours. */
export const MET = { warm: 3.5, cool: 2.3, core: 2.8 };
