/* ===== THE GRID – Owner signature check (non-blocking) =====
   This is a safety shim. In production you can replace verifyOwnerSignature()
   with a real HMAC/Ed25519 verifier. For now it NEVER blocks rendering.
*/
(function(){
  function readMeta(name){
    const m = document.querySelector(`meta[name="${name}"]`);
    return m ? m.getAttribute('content') : null;
  }

  async function verifyOwnerSignature(payload){
    try{
      // DEV MODE: accept if no signature present
      const sig = readMeta('thegrid-signature') || localStorage.getItem('thegrid.signature');
      if(!sig){ console.info('[TheGrid] Signature not present — DEV bypass.'); return true; }

      // Optional: simple integrity hint (not cryptographic)
      const expectedSlug = (readMeta('thegrid-owner')||'').trim().toLowerCase();
      if(expectedSlug && typeof payload?.brand?.name === 'string'){
        const ok = payload.brand.name.toLowerCase().includes('grid');
        if(!ok) console.warn('[TheGrid] Owner hint mismatch (non-blocking).');
      }
      return true; // never block UI
    }catch(err){
      console.warn('[TheGrid] Signature check failed (non-blocking):', err);
      return true;
    }
  }

  window.TheGridVerify = { verifyOwnerSignature };
})();
