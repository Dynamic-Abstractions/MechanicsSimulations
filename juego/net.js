/* Misión Física · connection layer
   - Online: PeerJS (WebRTC). The projector page is the hub; phones connect to it by room code.
   - Local test mode (?local=1): BroadcastChannel between tabs of the same browser. */
const Net = (() => {
  const PREFIX = 'misionfisica-utm-';
  const LOCAL = /[?&]local=1/.test(location.search) || window.MF_LOCAL === true;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const rid = n => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)]; return s; };

  /* ---------- host ---------- */
  function host(opts) {
    // opts: {onMsg(pid,msg), onLeave(pid), onReady(room), onError(text)}
    const conns = new Map();      // pid -> connection-like {send}
    let room = opts.room || rid(4), peer = null, bc = null;
    const api = {
      get room() { return room; },
      send(pid, msg) { const c = conns.get(pid); if (c) try { c.send(msg); } catch (e) {} },
      broadcast(msg) { conns.forEach(c => { try { c.send(msg); } catch (e) {} }); },
      connected(pid) { return conns.has(pid); },
      kick(pid) { conns.delete(pid); }
    };
    const attach = (pid, sender) => { conns.set(pid, sender); };
    const detach = (pid, sender) => { if (conns.get(pid) === sender) { conns.delete(pid); opts.onLeave && opts.onLeave(pid); } };

    if (LOCAL) {
      bc = new BroadcastChannel(PREFIX + room);
      bc.onmessage = e => {
        const d = e.data; if (!d || d.to !== 'host') return;
        let s = conns.get(d.from);
        if (!s || d.msg.t === 'hello') { s = {send: m => bc.postMessage({to: d.from, msg: m})}; attach(d.from, s); }
        if (d.msg.t === 'bye') { detach(d.from, s); return; }
        opts.onMsg(d.from, d.msg);
      };
      setTimeout(() => opts.onReady(room), 0);
      return api;
    }

    const start = () => {
      peer = new Peer(PREFIX + room, {debug: 0});
      peer.on('open', () => opts.onReady(room));
      peer.on('error', err => {
        if (err.type === 'unavailable-id') { peer.destroy(); room = rid(4); start(); return; }
        if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') opts.onError && opts.onError('Sin conexión con el servidor de enlace. Revisa el internet del proyector.');
      });
      peer.on('disconnected', () => { setTimeout(() => { try { peer.reconnect(); } catch (e) {} }, 1500); });
      peer.on('connection', conn => {
        let pid = null;
        const sender = {send: m => conn.open && conn.send(m)};
        conn.on('data', msg => {
          if (!msg || typeof msg !== 'object') return;
          if (msg.t === 'hello') { pid = String(msg.pid).slice(0, 40); attach(pid, sender); }
          if (!pid) return;
          opts.onMsg(pid, msg);
        });
        conn.on('close', () => pid && detach(pid, sender));
        conn.on('error', () => pid && detach(pid, sender));
      });
    };
    start();
    return api;
  }

  /* ---------- player ---------- */
  function join(room, opts) {
    // opts: {onMsg(msg), onStatus(state: 'connecting'|'open'|'lost'|'error', text)}
    const forced = (location.search.match(/[?&]pid=([A-Za-z0-9]{1,20})/) || [])[1];
    let pid = forced || store.get('mf-pid'); if (!pid) { pid = rid(10); store.set('mf-pid', pid); }
    room = String(room || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    let sendRaw = () => false, hello = null, open = false;
    const api = {
      pid,
      send(msg) { return sendRaw(msg); },
      hello(h) { hello = h; if (open) sendRaw(Object.assign({t: 'hello', pid}, h)); },
      get open() { return open; }
    };
    const status = (s, t) => opts.onStatus && opts.onStatus(s, t);

    if (LOCAL) {
      const bc = new BroadcastChannel(PREFIX + room);
      bc.onmessage = e => { const d = e.data; if (d && d.to === pid) opts.onMsg(d.msg); };
      sendRaw = m => { bc.postMessage({to: 'host', from: pid, msg: m}); return true; };
      open = true; setTimeout(() => { status('open'); if (hello) api.hello(hello); }, 0);
      addEventListener('pagehide', () => sendRaw({t: 'bye'}));
      return api;
    }

    let peer = null, conn = null, retry = 0, timer = null;
    const connect = () => {
      clearTimeout(timer); status('connecting');
      if (!peer || peer.destroyed) {
        peer = new Peer({debug: 0});
        peer.on('open', () => connect());
        peer.on('error', err => {
          if (err.type === 'peer-unavailable') status('error', 'No se encontró la sala ' + room + '. Revisa el código en el proyector.');
          schedule();
        });
        peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) {} });
        return;
      }
      if (!peer.open) return;
      conn = peer.connect(PREFIX + room, {reliable: true, serialization: 'json'});
      conn.on('open', () => {
        retry = 0; open = true; status('open');
        sendRaw = m => { if (conn && conn.open) { conn.send(m); return true; } return false; };
        if (hello) sendRaw(Object.assign({t: 'hello', pid}, hello));
      });
      conn.on('data', m => opts.onMsg(m));
      conn.on('close', () => { open = false; status('lost'); schedule(); });
      conn.on('error', () => { open = false; schedule(); });
    };
    const schedule = () => { clearTimeout(timer); retry++; timer = setTimeout(connect, Math.min(1000 * retry, 5000)); };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !open) { retry = 0; connect(); } });
    connect();
    return api;
  }

  return {host, join, LOCAL, store, rid};
})();
