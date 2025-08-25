// UI gate switches for tiers (library lock/watermark notes, etc.)
// Today this is static text; when Supabase is enabled we read entitlements
// and toggle classes accordingly.

export function applyEntitlements() {
  // Example: add a CSS class if user is Diamond (future)
  // document.body.classList.add('entitlement-diamond');
  // For now we just ensure copy is present (already in HTML).
}
