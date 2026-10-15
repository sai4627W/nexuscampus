/* ============================================================
   store.js - localStorage-backed reactive state store
   ============================================================ */
window.Nexus = window.Nexus || {};

Nexus.store = (function () {
  const KEY = 'nexuscampus.state.v1';
  const listeners = new Set();
  let state = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.nodes && parsed.subjects) return parsed;
      }
    } catch (e) { console.warn('State load failed, reseeding.', e); }
    const fresh = Nexus.seed();
    persist(fresh);
    return fresh;
  }

  function persist(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); }
    catch (e) { console.warn('State persist failed', e); }
  }

  function init() { state = load(); return state; }

  function get() { return state; }

  function set(mutator, opts = {}) {
    if (typeof mutator === 'function') mutator(state);
    else Object.assign(state, mutator);
    persist(state);
    if (!opts.silent) emit(opts.event || 'change');
    return state;
  }

  function reset() {
    state = Nexus.seed();
    persist(state);
    emit('change');
    emit('reset');
    return state;
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function emit(event) {
    listeners.forEach((fn) => { try { fn(state, event); } catch (e) { console.error(e); } });
  }

  // ---------- domain helpers ----------
  function updateSubject(id, present) {
    set((s) => {
      const sub = s.subjects.find((x) => x.id === id);
      if (!sub) return;
      sub.total += 1;
      if (present) sub.attended += 1;
      s.attendanceLog.unshift({
        id: 'log_' + Math.random().toString(36).slice(2, 8),
        subjectId: id, code: sub.code, present: !!present, at: new Date().toISOString()
      });
      s.attendanceLog = s.attendanceLog.slice(0, 40);
    }, { event: 'attendance' });
  }

  function addTxn(amount, label) {
    set((s) => { s.profile.wallet = Math.round((s.profile.wallet - amount) * 100) / 100; }, { silent: true });
    return label;
  }

  function topUp(amount) {
    set((s) => { s.profile.wallet = Math.round((s.profile.wallet + amount) * 100) / 100; }, { event: 'wallet' });
  }

  function addOrder(order) {
    set((s) => { s.orders.unshift(order); }, { event: 'orders' });
  }

  function updateOrder(id, patch) {
    set((s) => {
      const o = s.orders.find((x) => x.id === id);
      if (o) Object.assign(o, patch);
    }, { event: 'orders' });
  }

  function addGatePass(pass) {
    set((s) => { s.gatePasses.unshift(pass); }, { event: 'gatepass' });
  }

  function updateGatePass(id, patch) {
    set((s) => {
      const g = s.gatePasses.find((x) => x.id === id);
      if (g) Object.assign(g, patch);
    }, { event: 'gatepass' });
  }

  function addTicket(ticket) {
    set((s) => { s.tickets.unshift(ticket); }, { event: 'tickets' });
  }

  function updateTicket(id, patch) {
    set((s) => {
      const t = s.tickets.find((x) => x.id === id);
      if (t) Object.assign(t, patch);
    }, { event: 'tickets' });
  }

  function updateAsset(kind, id, patch) {
    set((s) => {
      const list = kind === 'machine' ? s.machines : s.pods;
      const item = list.find((x) => x.id === id);
      if (item) Object.assign(item, patch);
    }, { event: 'facilities' });
  }

  function setCrowd(nodeId, level) {
    set((s) => { s.crowd[nodeId] = level; }, { silent: true });
  }

  return {
    init, get, set, reset, subscribe,
    updateSubject, addTxn, topUp, addOrder, updateOrder,
    addGatePass, updateGatePass, addTicket, updateTicket,
    updateAsset, setCrowd, KEY
  };
})();
