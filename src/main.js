import './style.css';
import { BY_ID, planFor, MEALS, DEFAULT_SETTINGS } from './catalogue.js';
import { keyOf, parseKey, addDays, has, clone, ensure, normalize, isEmpty, isGymDay, exerciseCount, lastLoad, nextStep } from './model.js';
import { sb, claim, loadAll, saveDay, loadSettings, saveSettings, exportAll, deleteAll, cache, draftStore, clearDevice } from './store.js';
import { S, auth, ui, today, draftFor, isDirty, anyDirty, viewOf, persistDrafts, derive } from './state.js';
import { header, switcher, logView, mealsSummary, mealTiles, proteinWeek, mealsView, saveBar, progressView, calendarView, navHtml, authView } from './views.js';

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
  else h += calendarView(D);
  root.innerHTML = h; nav.innerHTML = navHtml();
}
const FOCUS_KEYS = ['m', 'inc', 'dec', 'meal', 'act', 'tab', 'day', 'kcal', 'extra', 'extrak', 'knee', 'veg', 'body', 'set'];
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
  else return;
  changed(); partial();
});
document.addEventListener('change', ev => { const t = ev.target; if (t.dataset && t.dataset.set) { ui.sd = ui.sd || {}; ui.sd[t.dataset.set] = t.value; } });
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
