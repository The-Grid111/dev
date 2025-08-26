(() => {
  const KEY = 'grid.v1';
  const S = {
    read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } },
    write(data) { localStorage.setItem(KEY, JSON.stringify(data)); },
    get(path, dflt=null) {
      const obj = S.read(); return path.split('.').reduce((a,k)=> (a && a[k]!==undefined)?a[k]:dflt, obj);
    },
    set(path, value) {
      const obj = S.read(); const keys = path.split('.');
      keys.slice(0,-1).reduce((a,k)=> (a[k] ??= {}), obj)[keys.at(-1)] = value; S.write(obj);
    },
    remove(path){ const obj = S.read(); const ks=path.split('.'); const last=ks.pop(); const parent=ks.reduce((a,k)=> a?.[k], obj); if(parent && last in parent){ delete parent[last]; S.write(obj);} }
  };
  window.Store = S;
})();
