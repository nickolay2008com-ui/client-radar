# Preview Validity Window

Purpose: prevent an old Product Lab preview from remaining commercially active after the client facts, offer, availability or implementation assumptions have changed.

## Release rule

Every preview must declare what evidence it depends on, when that evidence was last verified, and when the preview must be rechecked. A preview without a valid evidence window may remain viewable for reference, but its commercial CTA must be disabled.

## Minimal validity record

```json
{
  "schema": "product_lab.preview_validity.v1",
  "preview_id": "non-personal-stable-id",
  "company_id": "evo-company-id",
  "interest_event_id": "evo-interest-event-id",
  "evidence_verified_at": "ISO-8601 UTC",
  "valid_until": "ISO-8601 UTC",
  "dependencies": [
    "confirmed_problem",
    "client_request",
    "public_site_state",
    "offer_scope",
    "implementation_capacity"
  ],
  "status": "active | review_due | suspended | superseded",
  "superseded_by": null,
  "last_checked_by": "ally_ai",
  "evo_sync_status": "pending | synced | failed"
}
```

## Status behaviour

- `active`: evidence is current; CTA may be enabled.
- `review_due`: the validity window expired; CTA is disabled until re-verification.
- `suspended`: a material dependency is unavailable or contradicted; CTA is disabled.
- `superseded`: a newer preview exists; show a link to the current version and disable the old CTA.

## Material change triggers

Recheck immediately when any of these occurs:

1. The client clarifies or changes the requested outcome.
2. The public site changes the relevant page, form, service, price or contact route.
3. The implementation scope, availability or commercial terms change.
4. A newer Evo interest event contradicts the original evidence.
5. A preview link is reused after its stated validity window.

## UI requirements

- Show `Verified on` and `Valid until` near the trust module, not hidden in a footer.
- When invalid, replace the primary CTA with: `This preview needs a quick recheck`.
- Never imply that an expired preview is still a current recommendation.
- Preserve the old preview as an audit record; do not silently overwrite it.
- On mobile widths 360, 375 and 390 px, validity status and replacement action must remain visible without horizontal scrolling.

## Verification checklist

- Changing the clock beyond `valid_until` disables the commercial CTA.
- `superseded` previews point to exactly one current version.
- Re-verification creates a timestamped record instead of mutating historical evidence silently.
- No personal data is added to analytics payloads.
- Broken or unavailable Evo synchronization is shown as `pending` or `failed`, never `synced`.
- Keyboard and screen-reader users receive the same status and replacement action.

## Commercial acceptance

A preview may produce a commercial decision receipt only while its validity status is `active`. Any decision from an expired, suspended or superseded preview is marked `unverified` until the preview is revalidated in Evo.

## Method improvement

Previous method checked evidence before release but did not control how long that evidence remained commercially usable.

Improved method treats preview correctness as time-bound: current evidence enables the CTA; stale or contradicted evidence automatically removes the commercial action.

## next_cycle_rule

Before creating another Product Lab component, inspect whether existing previews have explicit validity records. If not, add validity status before improving presentation or copy.