import './style.css';
import { BY_ID, planFor, MEALS, DEFAULT_SETTINGS } from './catalogue.js';
import { keyOf, parseKey, addDays, has, clone, ensure, normalize, isEmpty, isGymDay, exerciseCount, lastLoad, nextStep, cleanText } from './model.js';
import { sb, claim, loadAll, saveDay, loadSettings, saveSettings, exportAll, deleteAll, cache, draftStore, clearDevice } from './store.js';
import { S, auth, ui, today, draftFor, isDirty, anyDirty, viewOf, persistDrafts, derive, rememberMins } from './state.js';
import { header, switcher, logView, mealsSummary, mealTiles, proteinWeek, mealsView, saveBar, progressView, calendarView, navHtml, authView, guideView, calcResult, calcFoods } from './views.js';

/* ---------------- render ---------------- */
function render() {
  const root = document.getElementById('root'), nav = document.getElementById('nav');
  if (!auth.ready) { root.innerHTML = '<div class="loading">Loading FitHit\u2026</div>'; nav.hidden = true; return; }
  if (!auth.user || auth.member === false) { root.innerHTML = authView(); nav.hidden = true; return; }
  nav.hidden = false;
  if (ui.selected > today()) ui.selected = today();
  const D = derive(); let h = header(D);
  if (ui.tab === 'log' || ui.tab === 'meals') h += switcher(D) + (ui.tab === 'log' ? logView(D) : mealsView(D)) + '<div class="bar" id="bar">' + saveBar() + '</div>';
  else if (ui.tab === 'progress') h += progressView(D);
  else if (ui.tab === 'guide') h += guideView();
  else h += calendarView(D);
  root.innerHTML = h; nav.innerHTML = navHtml();
}
const FOCUS_KEYS = ['m', 'inc', 'dec', 'meal', 'act', 'tab', 'day', 'kcal', 'extra', 'extrak', 'knee', 'veg', 'body', 'set', 'mins', 'how', 'cx', 'calc', 'cfq'];
function rerender() {
  const a = document.activeElement; let sel = null;
  if (a && a.dataset) FOCUS_KEYS.some(k => { if (a.dataset[k] != null) { sel = '[data-' + k + '="' + a.dataset[k] + '"]' + (a.dataset.f ? '[data-f="' + a.dataset.f + '"]' : ''); return true; } return false; });
  if (a && a.dataset && a.dataset.load) sel = '[data-load="' + a.dataset.load + '"][data-f="' + a.dataset.f + '"]';
  render();
  if (sel) { const el = document.querySelector(sel); if (el && !el.disabled) el.focus({ preventScroll: true }); }
}
function partial() {
  const d = draftFor(ui.selected), b = document.getElementById('bar'); if (b) b.innerHTML = saveBar();
  if (ui.tab === 'meals') { const s = document.getElementById('m-sum'); if (s) s.innerHTML = mealsSummary(d); const t = document.getElementById('m-tiles'); if (t) t.innerHTML = mealTiles(d); const w = document.getElementById('m-week'); if (w) w.innerHTML = proteinWeek(derive()); }
  const bs = document.getElementById('body-save'); if (bs) bs.disabled = !(isDirty(today()) && !S.saving);
  const cr = document.getElementById('calc-res'); if (cr) { const r = calcResult(); cr.innerHTML = r.text; const b = document.getElementById('calc-add'); if (b) b.disabled = !r.ok; }
  const ca = document.querySelector('[data-act="cxadd"]'); if (ca) ca.disabled = !String(ui.cx.n || '').trim();
}
let toastT;
function toast(msg, long) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), long ? 6000 : 2600); }

/* ---------------- saving ---------------- */
async function save(k) {
  if (S.saving || !isDirty(k)) return;
  const n = normalize(S.drafts[k]), data = isEmpty(n) ? null : n;
  S.saving = k; partial();
  const r = await saveDay(auth.user.id, k, data, S.meta[k] || null);
  S.saving = null;
  if (r.ok) {
    if (data) S.entries[k] = data; else delete S.entries[k];
    if (r.updated_at) S.meta[k] = r.updated_at; else delete S.meta[k];
    delete S.drafts[k]; S.pending.delete(k); persistDrafts(); cache.set(auth.user.id, S.entries, S.meta, S.settings);
    rerender(); toast(k === today() || ui.tab !== 'progress' ? 'Day saved' : 'Saved');
  } else if (r.conflict) {
    await refresh(); toast('This day changed on another device. Your edits are kept: check them and save again.', true);
  } else if (r.offline) {
    S.pending.add(k); persistDrafts(); rerender(); toast('No connection. Kept on this phone; it will save when you\u2019re back online.', true);
  } else { partial(); toast('Couldn\u2019t save: ' + (r.error.message || 'unknown error') + '. Your changes are kept.', true); }
}
async function flushPending() { for (const k of [...S.pending]) { if (!navigator.onLine) return; await save(k); } }
async function refresh() {
  try {
    const { entries, meta } = await loadAll();
    S.entries = entries; S.meta = meta; auth.loaded = true;
    Object.keys(S.drafts).forEach(k => { if (!isDirty(k)) delete S.drafts[k]; });
    cache.set(auth.user.id, S.entries, S.meta, S.settings);
  } catch (e) { toast('Couldn\u2019t reach the server. Showing what\u2019s saved on this phone.', true); }
  const a = document.activeElement; if (!(a && (a.tagName === 'INPUT' || a.tagName === 'SELECT'))) rerender(); else partial();
}
async function startSession(user) {
  try { auth.member = await claim(); }
  catch (e) { auth.member = /fithit_claim|function|404|PGRST202/i.test((e && (e.message || e.code)) || '') ? true : null; }
  if (auth.member === false) { render(); return; }
  const c = cache.get(user.id); if (c) { S.entries = c.entries || {}; S.meta = c.meta || {}; if (c.settings) S.settings = { ...DEFAULT_SETTINGS, ...c.settings }; }
  const saved = draftStore.get(user.id); const restored = Object.keys(saved);
  restored.forEach(k => { S.drafts[k] = ensure(saved[k]); S.pending.add(k); });
  render();
  try { S.settings = await loadSettings(); } catch (e) { /* settings table not there yet: keep defaults */ }
  await refresh();
  S.pending.forEach(k => { if (!isDirty(k)) S.pending.delete(k); });
  if (S.pending.size) { toast('Restored unsaved changes from last time. Saving them now.', true); flushPending(); }
}
function setUser(user) {
  const wasReady = auth.ready, prev = auth.user ? auth.user.id : null, next = user ? user.id : null;
  auth.user = user || null; auth.ready = true;
  if (wasReady && prev === next) return;
  S.drafts = {}; S.entries = {}; S.meta = {}; S.pending = new Set(); S.settings = { ...DEFAULT_SETTINGS }; auth.loaded = false; auth.member = null;
  if (user) startSession(user); else render();
}

/* ---------------- settings & data ---------------- */
async function doSaveSettings() {
  const s = { ...S.settings, ...ui.sd }, out = {};
  const numF = { proteinGoal: [40, 200], kcalTarget: [1000, 4000], startWeight: [30, 250], targetWeight: [30, 250], vfGoal: [1, 20], sessionsGoal: [1, 7], restDow: [1, 5] };
  for (const k of Object.keys(numF)) { const v = s[k]; if (v === '' || v == null) { out[k] = DEFAULT_SETTINGS[k]; continue; } const n = Number(v); if (!isFinite(n) || n < numF[k][0] || n > numF[k][1]) { toast('Check ' + k.replace(/([A-Z])/g, ' $1').toLowerCase() + ': it should be between ' + numF[k][0] + ' and ' + numF[k][1] + '.', true); return; } out[k] = Math.round(n * 10) / 10; }
  out.lastInbody = s.lastInbody && /^\d{4}-\d\d-\d\d$/.test(s.lastInbody) && s.lastInbody <= today() ? s.lastInbody : null;
  const next = { ...S.settings, ...out }, r = await saveSettings(auth.user.id, next);
  if (r.error) { toast('Couldn\u2019t save settings: ' + r.error.message, true); return; }
  S.settings = next; ui.sd = null; cache.set(auth.user.id, S.entries, S.meta, S.settings); rerender(); toast('Settings saved');
}
/* ---------- My foods (saved with your settings, so they follow you to any device) ---------- */
async function saveMyFoods(list) {
  const r = await saveSettings(auth.user.id, { ...S.settings, myFoods: list });
  if (r.error) { toast('Couldn\u2019t save to My foods: ' + r.error.message, true); return false; }
  S.settings = { ...S.settings, myFoods: list }; cache.set(auth.user.id, S.entries, S.meta, S.settings); return true;
}
function addCalcFood() {
  const c = ui.calc, r = calcResult(); if (!r.ok) return;
  const d = draftFor(ui.selected), q = Math.round(Number(c.qty) * 10) / 10; let item;
  if (c.food === 'new') {
    item = { n: cleanText(c.n, 40), u: cleanText(c.u, 16) || 'serving', q, p: Number(c.p), k: Number(c.k) || 0 };
    if (!item.n || !(item.p >= 0 && item.p <= 200) || !(item.k >= 0 && item.k <= 2000)) { toast('Check the protein and calories per serving.', true); return; }
    if (c.save) { const mine = (S.settings.myFoods || []).filter(f => f.n.toLowerCase() !== item.n.toLowerCase()).concat([{ n: item.n, u: item.u, p: item.p, k: item.k }]).slice(-30);
      saveMyFoods(mine).then(ok => { if (ok) { ui.calc.food = 'm:' + (mine.length - 1); rerender(); toast(item.n + ' saved to My foods'); } }); }
  } else { const f = calcFoods().all.find(x => x.key === c.food); item = { n: f.name, u: f.u, q, p: f.p, k: f.k }; }
  d.cf[ui.meal] = (d.cf[ui.meal] || []).concat([item]); ui.calc.qty = '';
  if (c.food === 'new') ui.calc = { ...ui.calc, n: '', u: '', p: '', k: '' };
  changed(); rerender(); toast('Added ' + r.t.p + ' g protein to ' + MEALS.find(m => m.id === ui.meal).label.toLowerCase());
}
async function doExport() {
  try { const data = await exportAll(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'fithit-export-' + today() + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Export downloaded'); } catch (e) { toast('Couldn\u2019t export: check your connection.', true); }
}
async function doDeleteAll() {
  if (!window.confirm('Delete ALL your FitHit days and settings? This can\u2019t be undone. Tip: tap Export first.')) return;
  const typed = window.prompt('Type DELETE to confirm'); if (typed !== 'DELETE') { toast('Nothing deleted'); return; }
  const r = await deleteAll(auth.user.id); if (r.error) { toast('Couldn\u2019t delete: ' + r.error.message, true); return; }
  S.entries = {}; S.meta = {}; S.drafts = {}; S.pending = new Set(); S.settings = { ...DEFAULT_SETTINGS }; clearDevice(); rerender(); toast('All FitHit data deleted');
}

/* ---------------- events ---------------- */
function goTo(tab) { ui.tab = tab; render(); window.scrollTo({ top: 0 }); }
function changed() { persistDrafts(); }
document.addEventListener('click', ev => {
  const t = ev.target.closest('button'); if (!t || t.disabled) return;
  const ds = t.dataset; let d;
  if (ds.tab) { goTo(ds.tab); return; }
  if (ds.day) { ui.selected = ds.day; ui.othersOpen = null; goTo('log'); return; }
  if (ds.m) { d = draftFor(ui.selected); const m = BY_ID[ds.m];
    if (m.g === 'cardio') { if (has(d.cardio, m.id)) delete d.cardio[m.id]; else d.cardio[m.id] = null; }
    else { const i = d.machines.indexOf(m.id); if (i > -1) d.machines.splice(i, 1); else d.machines.push(m.id); }
    const ticked = m.g === 'cardio' ? has(d.cardio, m.id) : d.machines.includes(m.id);
    let focusSel = m.g === 'cardio' ? '[data-kcal="' + m.id + '"]' : '[data-load="' + m.id + '"]';
    if (ticked && m.load === true && !(d.loads[m.id] && d.loads[m.id].kg != null)) {
      const step = nextStep(lastLoad(S.entries, m.id, ui.selected));
      if (step) { d.loads[m.id] = { ...(d.loads[m.id] || {}), kg: step.kg, sug: true }; focusSel = '[data-load="' + m.id + '"][data-f="reps"]'; }
    }
    if (exerciseCount(d)) d.gym = true; changed(); rerender();
    const sel = focusSel;
    if ((m.g === 'cardio' ? has(d.cardio, m.id) : d.machines.includes(m.id))) { const inp = document.querySelector(sel); if (inp && !inp.value) inp.focus({ preventScroll: true }); }
    return; }
  if (ds.inc || ds.dec) { d = draftFor(ui.selected); const id = ds.inc || ds.dec; let cur = Number(d.meals[ui.meal][id]) || 0;
    cur = ds.inc ? Math.min(20, cur + 1) : Math.max(0, cur - 1); if (cur) d.meals[ui.meal][id] = cur; else delete d.meals[ui.meal][id]; changed(); rerender(); return; }
  if (ds.veg) { d = draftFor(ui.selected); d.veg = Math.max(0, Math.min(15, (Number(d.veg) || 0) + Number(ds.veg))); changed(); rerender(); return; }
  if (ds.knee != null) { d = draftFor(ui.selected); const v = Number(ds.knee); d.knee = d.knee === v ? null : v; changed(); rerender(); return; }
  if (ds.meal) { ui.meal = ds.meal; rerender(); return; }
  if (ds.mins) { const v = Number(ds.mins); ui.mins = ui.mins === v ? null : v; rememberMins(ui.mins); rerender(); return; }
  if (ds.how) { ui.howOpen = ui.howOpen === ds.how ? null : ds.how; rerender(); return; }
  if (ds.cxdel != null) { d = draftFor(ui.selected); d.cx.splice(Number(ds.cxdel), 1); changed(); rerender(); return; }
  if (ds.cfdel != null) { d = draftFor(ui.selected); d.cf[ui.meal].splice(Number(ds.cfdel), 1); changed(); rerender(); return; }
  switch (ds.act) {
    case 'prev': ui.selected = keyOf(addDays(parseKey(ui.selected), -1)); ui.othersOpen = null; rerender(); break;
    case 'next': if (ui.selected < today()) { ui.selected = keyOf(addDays(parseKey(ui.selected), 1)); ui.othersOpen = null; rerender(); } break;
    case 'gym': d = draftFor(ui.selected); if (isGymDay(d)) { d.gym = false; d.machines = []; d.cardio = {}; d.loads = {}; d.knee = null; } else d.gym = true; changed(); rerender(); break;
    case 'others': { const dd = draftFor(ui.selected), ids = planFor(parseKey(ui.selected).getDay(), S.settings.restDow).items || [];
      const auto = !ids.length || dd.machines.some(x => !ids.includes(x)) || Object.keys(dd.cardio).some(x => !ids.includes(x));
      ui.othersOpen = !(ui.othersOpen !== null ? ui.othersOpen : auto); rerender(); break; }
    case 'clear': d = draftFor(ui.selected);
      if (ui.tab === 'meals') { d.meals = {}; d.extra = {}; d.extraK = {}; d.veg = null; ensure(d); } else { d.gym = false; d.machines = []; d.cardio = {}; d.loads = {}; d.knee = null; }
      changed(); rerender(); break;
    case 'copymeal': { d = draftFor(ui.selected); const y = viewOf(keyOf(addDays(parseKey(ui.selected), -1)));
      if (y && y.meals && y.meals[ui.meal]) { d.meals[ui.meal] = clone(y.meals[ui.meal]); changed(); rerender(); toast('Copied yesterday\u2019s ' + MEALS.find(m => m.id === ui.meal).label.toLowerCase() + '. Adjust if needed, then save.'); } break; }
    case 'cxadd': { d = draftFor(ui.selected); const f = ui.cx, n = cleanText(f.n, 40); if (!n) break;
      d.cx.push({ n, kg: f.kg || null, reps: f.reps || null, min: f.min || null, kcal: f.kcal || null }); d.gym = true; ui.cx = {}; changed(); rerender(); toast(n + ' added. Tap Save day.'); break; }
    case 'calcadd': addCalcFood(); break;
    case 'myfooddel': { const i = Number(String(ui.calc.food).slice(2)), mine = (S.settings.myFoods || []).filter((_, j) => j !== i);
      saveMyFoods(mine).then(ok => { if (ok) { ui.calc.food = 'b:whey'; rerender(); toast('Removed from My foods'); } }); break; }
    case 'save': save(ui.selected); break;
    case 'savetoday': save(today()); break;
    case 'opensettings': ui.settingsOpen = true; goTo('progress'); setTimeout(() => { const el = document.getElementById('settings'); if (el) el.scrollIntoView(); }, 0); break;
    case 'togglesettings': ui.settingsOpen = !ui.settingsOpen; if (!ui.settingsOpen) ui.sd = null; rerender(); break;
    case 'savesettings': doSaveSettings(); break;
    case 'export': doExport(); break;
    case 'deleteall': doDeleteAll(); break;
    case 'signout':
      if (anyDirty() && !window.confirm('You have unsaved changes. Sign out anyway? They\u2019ll be lost.')) break;
      sb.auth.signOut().then(() => clearDevice()); break;
    case 'resend': auth.sent = false; auth.error = ''; render(); break;
  }
});
document.addEventListener('input', ev => {
  const t = ev.target, ds = t.dataset; if (!ds) return; let d;
  if (ds.kcal) { d = draftFor(ui.selected); d.cardio[ds.kcal] = t.value === '' ? null : t.value; }
  else if (ds.load) { d = draftFor(ui.selected); d.loads[ds.load] = d.loads[ds.load] || {}; d.loads[ds.load][ds.f] = t.value === '' ? null : t.value; if (ds.f === 'kg') delete d.loads[ds.load].sug; }
  else if (ds.extra) { d = draftFor(ui.selected); if (t.value === '' || Number(t.value) <= 0) delete d.extra[ds.extra]; else d.extra[ds.extra] = t.value; }
  else if (ds.extrak) { d = draftFor(ui.selected); if (t.value === '' || Number(t.value) <= 0) delete d.extraK[ds.extrak]; else d.extraK[ds.extrak] = t.value; }
  else if (ds.body) { d = draftFor(today()); d.body[ds.body] = t.value === '' ? null : t.value; }
  else if (ds.set) { ui.sd = ui.sd || {}; ui.sd[ds.set] = t.value; return; }
  else if (ds.cx) { ui.cx[ds.cx] = t.value; partial(); return; }
  else if (ds.calc) { if (ds.calc === 'save') ui.calc.save = t.checked; else if (ds.calc !== 'food') ui.calc[ds.calc] = t.value; partial(); return; }
  else if (ds.cfq != null) { d = draftFor(ui.selected); const it = d.cf[ui.meal][Number(ds.cfq)]; if (it) it.q = t.value; }
  else return;
  changed(); partial();
});
document.addEventListener('change', ev => { const t = ev.target, ds = t.dataset || {};
  if (ds.set) { ui.sd = ui.sd || {}; ui.sd[ds.set] = t.value; }
  if (ds.calc === 'food') { ui.calc.food = t.value; ui.calc.qty = ''; rerender(); }
  if (ds.calc === 'u' || ds.cfq != null) rerender(); });
document.addEventListener('submit', ev => {
  if (ev.target.id !== 'signin') return; ev.preventDefault();
  const email = (document.getElementById('email').value || '').trim(); if (!email) return;
  auth.email = email; auth.busy = true; auth.error = ''; render();
  sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin, shouldCreateUser: true } }).then(res => {
    auth.busy = false;
    if (res.error) auth.error = /rate|seconds/i.test(res.error.message) ? 'Too many links requested. Wait a few minutes, then try again.' : 'Couldn\u2019t send the link: ' + res.error.message;
    else auth.sent = true;
    render();
  });
});
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.matches && ev.target.matches('input')) ev.target.blur(); });
window.addEventListener('beforeunload', ev => { if (anyDirty()) { persistDrafts(); ev.preventDefault(); ev.returnValue = ''; } });
window.addEventListener('online', () => { if (auth.user && S.pending.size) flushPending(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && auth.user && auth.member !== false && !S.saving) { if (S.pending.size) flushPending(); else refresh(); } });

/* ---------------- start ---------------- */
render();
sb.auth.onAuthStateChange((_evt, session) => setUser(session ? session.user : null));
sb.auth.getSession().then(r => {
  setUser(r.data && r.data.session ? r.data.session.user : null);
  if (window.location.hash && /access_token|error/.test(window.location.hash)) history.replaceState(null, '', window.location.pathname);
});
