// Collider tool bridge (v8.5). Every in-app editor/viewer page runs in an
// iframe inside a Collider window. The page and the app talk with
// postMessage; nothing leaves the app.
//   app -> page : {collider:true, type:'open', name, mime, bytes:Uint8Array, extra}
//                 {collider:true, type:'request', what:'save'|'export'|'thumb'}
//                 {collider:true, type:'result', id, ok, bytes?, error?}
//   page -> app : {collider:true, type:'ready'}
//                 {collider:true, type:'save', name, mime, bytes, asNew}
//                 {collider:true, type:'download', name, mime, bytes}
//                 {collider:true, type:'notice', text}
//                 {collider:true, type:'call', id, fn, args}   (app services, e.g. AI fill)
(function () {
  const handlers = {};
  const pending = {};
  let seq = 0;
  const B = (window.ColliderBridge = {
    on(type, fn) { handlers[type] = fn; },
    send(msg) { window.parent.postMessage(Object.assign({ collider: true }, msg), '*'); },
    save(name, mime, bytes, asNew) { B.send({ type: 'save', name, mime, bytes, asNew: !!asNew }); },
    download(name, mime, bytes) { B.send({ type: 'download', name, mime, bytes }); },
    notice(text) { B.send({ type: 'notice', text }); toast(text); },
    call(fn, args) {
      const id = 'c' + ++seq;
      return new Promise((res, rej) => { pending[id] = { res, rej }; B.send({ type: 'call', id, fn, args }); });
    },
  });
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || !d.collider) return;
    if (d.type === 'result' && pending[d.id]) {
      const p = pending[d.id]; delete pending[d.id];
      d.ok ? p.res(d) : p.rej(new Error(d.error || 'failed'));
      return;
    }
    const h = handlers[d.type];
    if (h) h(d);
  });
  function toast(text) {
    let t = document.getElementById('c-toast');
    if (!t) { t = document.createElement('div'); t.id = 'c-toast'; document.body.appendChild(t); }
    t.textContent = text; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600);
  }
  window.cToast = toast;
  window.addEventListener('load', () => B.send({ type: 'ready' }));
  // Standalone use (opened directly, no app): ?demo loads nothing.
  window.cBytesFromFile = (file) => file.arrayBuffer().then((b) => new Uint8Array(b));
  window.cDownloadLocal = (name, mime, bytes) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytes], { type: mime }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
})();
