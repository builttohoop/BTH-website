// Pins the client_reference_id the site emits (BTH-GOAL-0057 Deliverable 7, Ty ruling R3).
//
// WHAT THIS PROTECTS. Mail OS has shipped an abandoned-checkout recovery email since
// 2026-08-18 (sequence 30) and it had never sent once: 24 abandons → 24 anonymous rows →
// 0 emails. Stripe's checkout.session.expired carries an email only when the abandoner
// typed one into Stripe and then stopped, and client_reference_id carried no identity at
// all — assets/bth-click-id.js encoded only the GA client id and the gclid, and bailed out
// entirely when both were absent, which is exactly organic and direct traffic.
//
// The fix stamps the signed lead token ("<contact_id>.<HMAC>", localStorage bth_lead_ref)
// into the reference. The worker re-verifies that HMAC before it touches a contact
// (verifyLeadToken), so this file makes no security claim — it makes the SHAPE claim the
// worker's parser depends on, from the website side:
//
//   l_<id>x<sig>[_c_<cid1>x<cid2>][_g_<gclid>]   with a lead token
//   c_<cid1>x<cid2>[_g_<gclid>]  /  g_<gclid>    without one — byte-identical to the
//                                                 legacy shapes already in the wild
//
// It runs the REAL function, sliced out of assets/bth-click-id.js between the
// [unit:clientReference] markers, so a copy in this file can never drift from the shipped
// one. The worker side is pinned by bth-mail-os scripts/unit-goal0057-checkout-identity.mjs
// against the same literals.
//
// Usage: node .github/scripts/check-client-reference.mjs   (exit 0 pass, 1 fail)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(here, "..", "..", "assets", "bth-click-id.js");

const src = readFileSync(SOURCE, "utf8");
const OPEN = "/* [unit:clientReference] */";
const CLOSE = "/* [/unit:clientReference] */";
const start = src.indexOf(OPEN);
const end = src.indexOf(CLOSE);
if (start === -1 || end === -1 || end < start) {
  console.error(`check-client-reference: markers ${OPEN} / ${CLOSE} not found in assets/bth-click-id.js.`);
  console.error("They bracket the function this check runs. Restore them rather than deleting this check.");
  process.exit(1);
}
const body = src.slice(start + OPEN.length, end);

// eslint-disable-next-line no-new-func — deliberate: running the shipped source is the point.
const clientReference = new Function(`${body}; return clientReference;`)();

let failures = 0;
function check(label, actual, expected) {
  try {
    assert.equal(actual, expected);
    console.log(`  ok   ${label}`);
  } catch (error) {
    failures += 1;
    console.error(`  FAIL ${label}`);
    console.error(`       expected ${JSON.stringify(expected)}`);
    console.error(`       actual   ${JSON.stringify(actual)}`);
  }
}

const SIG = "BNcYEQfMLuPIt-UfwrQyYna2_xKQhZ3wXyJ4mLpQrSt"; // 43 base64url chars, shape only
const TOKEN = `42.${SIG}`;
const LEAD = `l_42x${SIG}`;
const CID = "1234567890.1699999999";
const GCLID = "EAIaIQobChMI123";

console.log("client_reference_id — signature width");
check("the fixture signature is 43 chars (the width the worker parser pins)", SIG.length, 43);

console.log("client_reference_id — legacy shapes are byte-identical (regression guard)");
check("cid + gclid, no lead", clientReference(CID, GCLID, ""), "c_1234567890x1699999999_g_EAIaIQobChMI123");
check("cid alone, no lead", clientReference(CID, "", ""), "c_1234567890x1699999999");
check("gclid alone, no lead", clientReference("", GCLID, ""), "g_EAIaIQobChMI123");
check("nothing at all still yields nothing", clientReference("", "", ""), "");

console.log("client_reference_id — the lead token (the fix)");
check(
  "THE DEFECT, FIXED: organic/direct with only a lead token used to produce \"\"",
  clientReference("", "", TOKEN),
  LEAD
);
check("lead + cid", clientReference(CID, "", TOKEN), `${LEAD}_c_1234567890x1699999999`);
check("lead + gclid", clientReference("", GCLID, TOKEN), `${LEAD}_g_EAIaIQobChMI123`);
check(
  "lead + cid + gclid — lead first, legacy tail unchanged",
  clientReference(CID, GCLID, TOKEN),
  `${LEAD}_c_1234567890x1699999999_g_EAIaIQobChMI123`
);

console.log("client_reference_id — a malformed lead token is skipped, never guessed at");
for (const [label, bad] of [
  ["unsigned (bare contact id)", "42"],
  ["empty signature", "42."],
  ["signature too short", `42.${SIG.slice(0, 20)}`],
  ["signature too long", `42.${SIG}AAAA`],
  ["non-numeric contact id", `abc.${SIG}`],
  ["contact id too long", `1234567890123.${SIG}`],
  ["signature with a character outside base64url", `42.${SIG.slice(0, 42)}!`],
  ["two dots", `42.${SIG}.${SIG}`],
  ["empty", ""],
  ["null", null],
  ["undefined", undefined]
]) {
  check(`${label} → no lead segment, legacy shape only`, clientReference(CID, GCLID, bad), "c_1234567890x1699999999_g_EAIaIQobChMI123");
}

console.log("client_reference_id — Stripe's 200-char ceiling and the drop order");
// Segment widths: lead 48 ("l_" + 2 id + "x" + 43), cid 23, joiners 1 and 3. So
// lead+cid+gclid overflows past a 125-char gclid, lead+gclid past a 149-char one, and
// cid+gclid (the legacy shape) past a 174-char one. Drop order: cid, then lead, never the gclid -
// and a lead holder must never carry LESS attribution than the legacy code would have.
const hugeGclid = "E".repeat(140);
check(
  "over the ceiling: the cid goes first, the lead and gclid survive",
  clientReference(CID, hugeGclid, TOKEN),
  `${LEAD}_g_${hugeGclid}`
);
const hugerGclid = "E".repeat(170);
check(
  "still over: the lead goes next, but cid + gclid still fits, so the legacy shape is emitted (never less than legacy)",
  clientReference(CID, hugerGclid, TOKEN),
  `c_1234567890x1699999999_g_${hugerGclid}`
);
const hugestGclid = "E".repeat(180);
check(
  "still over: the cid goes too, the un-re-derivable gclid is never dropped",
  clientReference(CID, hugestGclid, TOKEN),
  `g_${hugestGclid}`
);
const allRefs = [
  clientReference(CID, GCLID, TOKEN),
  clientReference(CID, hugeGclid, TOKEN),
  clientReference(CID, hugerGclid, TOKEN),
  clientReference(CID, hugestGclid, TOKEN),
  clientReference(CID, "E".repeat(400), TOKEN)
];
check("no emitted reference ever exceeds 200 chars", allRefs.every(r => r.length <= 200), true);
check(
  "every emitted reference stays inside Stripe's [A-Za-z0-9_-] alphabet",
  allRefs.every(r => /^[A-Za-z0-9_-]*$/.test(r)),
  true
);

if (failures) {
  console.error(`\ncheck-client-reference: ${failures} failing assertion(s)`);
  process.exit(1);
}
console.log("\ncheck-client-reference: all assertions passed");
