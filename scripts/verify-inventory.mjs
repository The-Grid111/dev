// scripts/verify-inventory.mjs
import fs from "node:fs";

const INDEX = "index.html";
const html = fs.readFileSync(INDEX, "utf8");

// 1) “Details” must NOT go to Stripe
const detailsToStripe = /<a[^>]+class="[^"]*\bdetails\b[^"]*"[^>]+href="https?:\/\/(?:buy\.)?stripe\.com/gi.test(html);

// 2) “Choose” SHOULD go to Stripe (at least one)
const chooseToStripe = /<a[^>]+class="[^"]*\bchoose\b[^"]*"[^>]+href="https?:\/\/(?:buy\.)?stripe\.com/gi.test(html);

// 3) Trial banner presence (button + dismiss + label)
const trialBannerPresent =
  /Start\s*Trial/i.test(html) && /Dismiss/i.test(html) && /Launch\s*Trial/i.test(html);

let failed = false;

if (detailsToStripe) {
  console.error("❌ Policy: A 'Details' button points to Stripe. Only 'Choose' may link to Stripe.");
  failed = true;
} else {
  console.log("✅ Policy: No 'Details' buttons to Stripe.");
}

if (!chooseToStripe) {
  console.error("❌ Policy: No 'Choose' button links to Stripe. At least one must.");
  failed = true;
} else {
  console.log("✅ Policy: At least one 'Choose' links to Stripe.");
}

if (!trialBannerPresent) {
  console.error("❌ Policy: Trial banner not detected (need headline, Start Trial, and Dismiss).");
  failed = true;
} else {
  console.log("✅ Policy: Trial banner present.");
}

process.exit(failed ? 1 : 0);
